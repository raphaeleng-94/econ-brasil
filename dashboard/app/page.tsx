'use client'
import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchLatest, fetchMonthly, fetchAnnual, Latest, Monthly, Annual } from '@/lib/supabase'
import { SERIES_META, fmtValue, fmtDate } from '@/lib/meta'

const Ticker       = dynamic(() => import('@/components/ui/Ticker'),             { ssr: false })
const StackedChart = dynamic(() => import('@/components/charts/StackedChart'),   { ssr: false })
const AnnualBar    = dynamic(() => import('@/components/charts/AnnualBar'),      { ssr: false })

const SERIES_ORDER = [
  'selic_diaria','ipca_mensal','cambio_usd','pib_trimestral',
  'igpm_mensal','inpc_mensal','divida_pib','saldo_bc','reservas_int','credito_total'
]

export default function Home() {
  const [latest, setLatest]   = useState<Latest[]>([])
  const [monthly, setMonthly] = useState<Monthly[]>([])
  const [annual, setAnnual]   = useState<Annual[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string>('selic_diaria')
  const [view, setView]       = useState<'mensal'|'anual'>('mensal')

  useEffect(() => {
    Promise.all([fetchLatest(), fetchMonthly(), fetchAnnual()])
      .then(([l, m, a]) => { setLatest(l); setMonthly(m); setAnnual(a) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const monthlyFor  = useMemo(() => monthly.filter(d => d.series_name === selected), [monthly, selected])
  const annualFor   = useMemo(() => annual.filter(d => d.series_name === selected),  [annual, selected])
  const latestMap   = useMemo(() => Object.fromEntries(latest.map(l => [l.series_name, l])), [latest])
  const selectedMeta = SERIES_META[selected]

  return (
    <div className="relative z-10 flex flex-col h-full min-h-screen">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-white/8"
              style={{ background: 'rgba(5,12,22,0.97)', backdropFilter: 'blur(20px)' }}>
        {/* Ticker */}
        <Ticker items={latest} />

        {/* Brand row */}
        <div className="flex items-center gap-4 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold"
                 style={{ background: 'linear-gradient(135deg,#00d4ff22,#00d4ff44)', border: '1px solid #00d4ff44' }}>
              🇧🇷
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white leading-none">
                Painel Econômico Brasil
              </h1>
              <p className="text-[9px] font-mono text-white/30 tracking-widest mt-0.5">
                MEDALLION ETL · BCB/SGS · AIRFLOW · DBT · SUPABASE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {['bronze','silver','gold'].map((layer, i) => (
              <span key={layer} className="text-[9px] font-mono font-bold px-2 py-0.5 rounded"
                    style={{
                      color: ['#cd7f32','#c0c0c0','#ffcc00'][i],
                      background: ['#cd7f3210','#c0c0c010','#ffcc0010'][i],
                      border: `1px solid ${['#cd7f3244','#c0c0c044','#ffcc0044'][i]}`,
                    }}>
                {layer.toUpperCase()}
              </span>
            ))}
            {!loading && (
              <span className="text-[9px] font-mono text-green-400 ml-1">● LIVE</span>
            )}
            {loading && (
              <span className="text-[9px] font-mono text-white/30 ml-1 animate-pulse">● LOADING</span>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN LAYOUT ────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── SIDEBAR: series list ──────────────────────────────── */}
        <aside className="shrink-0 w-52 border-r border-white/6 overflow-y-auto"
               style={{ background: 'rgba(5,12,22,0.8)' }}>
          <div className="p-2 space-y-0.5">
            {SERIES_ORDER.map(name => {
              const meta  = SERIES_META[name]
              const item  = latestMap[name]
              const isOn  = selected === name
              return (
                <button
                  key={name}
                  onClick={() => setSelected(name)}
                  className="w-full text-left px-3 py-2.5 rounded-lg transition-all group"
                  style={{
                    background: isOn ? `${meta.color}15` : 'transparent',
                    border: `1px solid ${isOn ? meta.color+'44' : 'transparent'}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[12px]">{meta.icon}</span>
                    <span className="text-[11px] font-bold" style={{ color: isOn ? meta.color : '#7a9ab5' }}>
                      {meta.label}
                    </span>
                  </div>
                  {item && (
                    <div className="pl-5">
                      <div className="text-[12px] font-mono font-bold text-white/90">
                        {fmtValue(item.value, meta.format)}
                      </div>
                      <div className="text-[9px] text-white/25 font-mono">
                        {fmtDate(item.reference_date)}
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </aside>

        {/* ── MAIN CONTENT ──────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div key={selected}
              initial={{ opacity:0, y:10 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-10 }}
              transition={{ duration:0.2 }}
              className="space-y-4"
            >

              {/* KPI cards */}
              {selectedMeta && latestMap[selected] && (
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label:'Último valor', value: fmtValue(latestMap[selected]?.value, selectedMeta.format), sub: fmtDate(latestMap[selected]?.reference_date), color: selectedMeta.color },
                    { label:'Média anual', value: fmtValue(annualFor.at(-1)?.avg_value, selectedMeta.format), sub: `${annualFor.at(-1)?.year ?? '—'}`, color: selectedMeta.color+'aa' },
                    { label:'Mínimo histórico', value: fmtValue(Math.min(...annualFor.map(d=>d.min_value??Infinity)), selectedMeta.format), sub:'desde 2000', color:'#39ff14aa' },
                    { label:'Máximo histórico', value: fmtValue(Math.max(...annualFor.map(d=>d.max_value??-Infinity)), selectedMeta.format), sub:'desde 2000', color:'#ff4444aa' },
                  ].map((card, i) => (
                    <div key={i} className="rounded-xl p-4 border border-white/6"
                         style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/35 mb-1">
                        {card.label}
                      </div>
                      <div className="text-[22px] font-bold font-mono leading-none" style={{ color: card.color }}>
                        {card.value}
                      </div>
                      <div className="text-[10px] text-white/30 font-mono mt-1">{card.sub}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chart header */}
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-[15px] font-bold text-white">
                    {selectedMeta?.icon} {selectedMeta?.label} — {selectedMeta?.desc}
                  </h2>
                  <p className="text-[11px] text-white/35 font-mono mt-0.5">
                    {selectedMeta?.unit} · Use o seletor abaixo para navegar no histórico
                  </p>
                </div>
                {/* View toggle */}
                <div className="ml-auto flex rounded-lg overflow-hidden border border-white/10">
                  {(['mensal','anual'] as const).map(v => (
                    <button key={v} onClick={() => setView(v)}
                      className="px-4 py-1.5 text-[11px] font-medium transition-colors"
                      style={{
                        background: view===v ? selectedMeta?.color+'33' : 'transparent',
                        color: view===v ? selectedMeta?.color : '#4a6a8a',
                      }}>
                      {v.charAt(0).toUpperCase()+v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main chart — full history, stacked, zoomable */}
              <div className="rounded-2xl border border-white/8 overflow-hidden"
                   style={{ background: 'rgba(8,16,32,0.8)', height: 380 }}>
                <div className="px-4 py-3 border-b border-white/6 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-white/70">
                    {view === 'mensal' ? 'Histórico Mensal (desde 2000)' : 'Resumo Anual (acumulado)'}
                  </span>
                  <span className="ml-auto text-[9px] font-mono text-white/25">
                    🖱 Arraste o seletor abaixo para zoom · Hover para detalhes
                  </span>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded"
                        style={{ color:'#ffcc00', background:'#ffcc0012', border:'1px solid #ffcc0030' }}>
                    GOLD LAYER
                  </span>
                </div>
                <div className="p-2" style={{ height: 340 }}>
                  {loading
                    ? <div className="h-full flex items-center justify-center text-white/20 text-sm animate-pulse">Carregando dados...</div>
                    : view === 'mensal'
                      ? <StackedChart seriesName={selected} data={monthlyFor} />
                      : <AnnualBar seriesName={selected} data={annualFor} />
                  }
                </div>
              </div>

              {/* All series mini cards */}
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-3">
                  Todos os indicadores — últimas leituras
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {SERIES_ORDER.map(name => {
                    const meta = SERIES_META[name]
                    const item = latestMap[name]
                    const isOn = selected === name
                    const ann  = annualFor.filter(d => d.series_name === name)
                    return (
                      <button key={name} onClick={() => setSelected(name)}
                        className="rounded-xl p-3 text-left border transition-all hover:scale-[1.02]"
                        style={{
                          background: isOn ? `${meta.color}12` : 'rgba(255,255,255,0.02)',
                          borderColor: isOn ? `${meta.color}50` : 'rgba(255,255,255,0.06)',
                        }}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[13px]">{meta.icon}</span>
                          <span className="text-[10px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
                        </div>
                        <div className="text-[14px] font-mono font-bold text-white/90">
                          {item ? fmtValue(item.value, meta.format) : '—'}
                        </div>
                        <div className="text-[9px] text-white/25 font-mono mt-0.5">
                          {item ? fmtDate(item.reference_date) : ''}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Pipeline info */}
              <div className="rounded-xl border border-white/6 p-4 flex items-center gap-6"
                   style={{ background: 'rgba(255,255,255,0.01)' }}>
                <div className="text-[11px] text-white/30">
                  <span className="text-white/60 font-semibold">Fonte:</span> Banco Central do Brasil — SGS (Sistema Gerenciador de Séries Temporais)
                </div>
                <div className="flex gap-4 ml-auto text-[10px] font-mono text-white/25">
                  {[
                    ['Bronze', 'Ingestão raw'],
                    ['Silver', 'Limpeza + tipagem'],
                    ['Gold', 'Agregação analítica'],
                  ].map(([l,d]) => (
                    <div key={l}><span className="text-white/50">{l}</span> · {d}</div>
                  ))}
                  <div>⏰ Atualização diária 06:00 BRT</div>
                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
