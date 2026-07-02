// Supabase Edge Function — Pipeline ETL completo (Bronze → Silver → Gold)
// Roda dentro da infraestrutura Supabase, evitando bloqueios de IP da BCB
// e problemas de conectividade direta Postgres a partir do GitHub Actions.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const PIPELINE_SECRET = Deno.env.get('PIPELINE_SECRET') ?? 'econ-brasil-2025'

// Consulta por intervalo de datas (não usa /dados/ultimos/{N} pois a API do
// BCB limita N<=20; requisições maiores falhavam silenciosamente).
function bcbUrl(code: number): string {
  const hoje = new Date()
  const inicio = new Date(hoje.getFullYear() - 2, hoje.getMonth(), 1)
  const fmt = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
  return `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados?formato=json&dataInicial=${fmt(inicio)}&dataFinal=${fmt(hoje)}`
}

// selic_diaria usa série 432 (Meta Selic anualizada definida pelo Copom, % a.a.)
const SERIES: Record<string, number> = {
  selic_diaria: 432, ipca_mensal: 433, cambio_usd: 1,
  pib_trimestral: 7326, igpm_mensal: 189, inpc_mensal: 188,
  reservas_int: 13621, divida_pib: 4513, saldo_bc: 22707, credito_total: 20539,
}

Deno.serve(async (req: Request) => {
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
    const url = bcbUrl(code)
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EconBrasil/1.0)', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(20000),
      })
      const bodyText = await r.text()
      if (!r.ok) throw new Error(`HTTP ${r.status} :: ${bodyText.slice(0,150)}`)
      let data: Array<{ data: string; valor: string }>
      try { data = JSON.parse(bodyText) } catch { throw new Error(`JSON invalido :: ${bodyText.slice(0,150)}`) }
      if (!Array.isArray(data) || data.length === 0) throw new Error(`resposta vazia :: ${bodyText.slice(0,100)}`)

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
        if (error) log.push(`  erro-insert ${name}: ${error.message}`)
        else { bronzeRows += rows.length; bcbOk++; log.push(`  ok ${name}: ${rows.length} (até ${rows[rows.length-1].reference_date})`) }
      }
    } catch (e) {
      log.push(`  FALHA ${name}: ${e.message}`)
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

  // ── Verificação final + log persistido no banco (auditoria) ───
  const { count: latestCount } = await db.from('econ_latest').select('*', { count: 'exact', head: true })
  log.push(`=== RESULTADO: ${latestCount} séries no gold.latest ===`)

  const success = !silverErr && !goldErr
  const fullLog = log.join('\n')

  await db.from('pipeline_log').insert({
    layer: 'bronze', status: bcbOk > 0 ? 'success' : 'degraded',
    records_loaded: bronzeRows, message: fullLog,
  })

  return new Response(JSON.stringify({ success, log, bronzeRows, bcbOk }), {
    status: success ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  })
})
