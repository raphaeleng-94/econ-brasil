// Supabase Edge Function — Pipeline ETL completo (Bronze → Silver → Gold)
// Roda dentro da infraestrutura Supabase, evitando bloqueios de IP da BCB
// e problemas de conectividade direta Postgres a partir do GitHub Actions.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const PIPELINE_SECRET = Deno.env.get('PIPELINE_SECRET') ?? 'econ-brasil-2025'

const BCB_URL = (code: number) =>
  `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados/ultimos/36?formato=json`

const SERIES: Record<string, number> = {
  selic_diaria: 11, ipca_mensal: 433, cambio_usd: 1,
  pib_trimestral: 7326, igpm_mensal: 189, inpc_mensal: 188,
  reservas_int: 13621, divida_pib: 4513, saldo_bc: 22707, credito_total: 20539,
}

Deno.serve(async (req: Request) => {
  // Autenticação simples via header/query secret
  const secret = req.headers.get('x-pipeline-secret') ?? new URL(req.url).searchParams.get('secret')
  if (secret !== PIPELINE_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const db = createClient(SUPABASE_URL, SERVICE_KEY)
  const log: string[] = []
  let bronzeRows = 0, bcbOk = 0

  // ── BRONZE: ingestão raw da API BCB/SGS ──────────────────────
  log.push('=== BRONZE ===')
  for (const [name, code] of Object.entries(SERIES)) {
    try {
      const r = await fetch(BCB_URL(code), {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EconBrasil/1.0)' },
        signal: AbortSignal.timeout(25000),
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data: Array<{ data: string; valor: string }> = await r.json()

      await db.from('indicators_raw').delete().eq('series_name', name)

      const rows = data
        .filter(rec => rec.data && rec.valor != null && rec.valor !== '')
        .map(rec => ({
          series_name: name,
          series_code: code,
          reference_date: rec.data,
          raw_value: rec.valor,
          raw_json: rec,
        }))

      if (rows.length > 0) {
        const { error } = await db.from('indicators_raw').insert(rows)
        if (error) log.push(`  erro ${name}: ${error.message}`)
        else { bronzeRows += rows.length; bcbOk++; log.push(`  ok ${name}: ${rows.length}`) }
      }
    } catch (e) {
      log.push(`  skip ${name}: ${e.message} (BCB bloqueou IP cloud - mantendo dados existentes)`)
    }
  }
  log.push(`Bronze: ${bronzeRows} rows novas, BCB disponível: ${bcbOk}/${Object.keys(SERIES).length}`)

  // ── SILVER: limpeza e tipagem via RPC ─────────────────────────
  log.push('=== SILVER ===')
  const { data: silverCount, error: silverErr } = await db.rpc('pipeline_run_silver')
  if (silverErr) log.push(`  erro: ${silverErr.message}`)
  else log.push(`  ok: ${silverCount} rows processados`)

  // ── GOLD: agregação analítica via RPC ─────────────────────────
  log.push('=== GOLD ===')
  const { error: goldErr } = await db.rpc('pipeline_run_gold')
  if (goldErr) log.push(`  erro: ${goldErr.message}`)
  else log.push('  ok: Gold atualizado')

  // ── Verificação final ──────────────────────────────────────────
  const { count: latestCount } = await db.from('econ_latest').select('*', { count: 'exact', head: true })
  log.push(`=== RESULTADO: ${latestCount} séries no gold.latest ===`)

  const success = !silverErr && !goldErr
  return new Response(JSON.stringify({ success, log, bronzeRows, bcbOk }), {
    status: success ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  })
})
