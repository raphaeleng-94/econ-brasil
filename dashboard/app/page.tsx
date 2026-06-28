'use client'
import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchLatest, fetchMonthly, fetchAnnual, Latest, Monthly, Annual } from '@/lib/supabase'
import { META, ORDER, fmt, fmtDate } from '@/lib/meta'

const Ticker       = dynamic(() => import('@/components/ui/Ticker'),           { ssr: false })
const HistoryChart = dynamic(() => import('@/components/charts/HistoryChart'), { ssr: false })
const AnnualChart  = dynamic(() => import('@/components/charts/AnnualChart'),  { ssr: false })

export default function Home() {
  const [latest,  setLatest]  = useState<Latest[]>([])
  const [monthly, setMonthly] = useState<Monthly[]>([])
  const [annual,  setAnnual]  = useState<Annual[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState('selic_diaria')
  const [view, setView] = useState<'mensal'|'anual'>('mensal')

  useEffect(() => {
    Promise.all([fetchLatest(), fetchMonthly(), fetchAnnual()])
      .then(([l, m, a]) => { setLatest(l); setMonthly(m); setAnnual(a) })
      .catch(console.error).finally(() => setLoading(false))
  }, [])

  const latestMap  = useMemo(() => Object.fromEntries(latest.map(l => [l.series_name, l])), [latest])
  const monthlyFor = useMemo(() => monthly.filter(d => d.series_name === selected), [monthly, selected])
  const annualFor  = useMemo(() => annual.filter(d => d.series_name === selected),  [annual, selected])
  const selMeta    = META[selected]
  const item       = latestMap[selected]
  const lastAnn    = annualFor.at(-1)
  const allMin     = annualFor.length ? Math.min(...annualFor.map(d => d.min_value ?? Infinity)) : null
  const allMax     = annualFor.length ? Math.max(...annualFor.map(d => d.max_value ?? -Infinity)) : null

  return (
    <div className="relative z-10 flex flex-col h-screen overflow-hidden">

      {/* ── HEADER ── */}
      <header className="shrink-0 border-b border-white/6" style={{ background:'rgba(4,13,24,0.98)' }}>
        <Ticker items={latest} />
        <div className="flex items-center gap-3 px-5 py-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
               style={{ background:'linear-gradient(135deg,#00284480,#00d4ff20)', border:'1px solid #00d4ff25' }}>
            🇧🇷
          </div>
          <div>
            <h1 className="text-[14px] font-bold text-white leading-none">Painel Econômico Brasil</h1>
            <p className="text-[9px] text-white/20 tracking-widest mt-0.5">MEDALLION ETL · BCB/SGS · GITHUB ACTIONS · SUPABASE · VERCEL</p>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {[['BRONZE','#cd7f32'],['SILVER','#c0c0c0'],['GOLD','#ffcc00']].map(([l,c])=>(
              <span key={l} className="text-[9px] font-mono font-bold px-2 py-0.5 rounded"
                    style={{color:c,background:`${c}12`,border:`1px solid ${c}30`}}>{l}</span>
            ))}
            <span className={`text-[9px] font-mono ml-2 ${loading?'text-white/20 animate-pulse':'text-green-400'}`}>
              {loading ? '● CARREGANDO' : '● AO VIVO'}
            </span>
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* SIDEBAR */}
        <aside className="shrink-0 w-48 border-r border-white/6 overflow-y-auto"
               style={{ background:'rgba(3,10,20,0.8)' }}>
          <div className="p-1.5 space-y-0.5">
            {ORDER.map(name => {
              const m = META[name]; const it = latestMap[name]; const on = selected === name
              return (
                <button key={name} onClick={() => setSelected(name)}
                  className="w-full text-left px-2.5 py-2 rounded-lg transition-all"
                  style={{ background:on?`${m.color}18`:'transparent', border:`1px solid ${on?m.color+'40':'transparent'}` }}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px]">{m.icon}</span>
                    <span className="text-[10px] font-bold" style={{ color:on?m.color:'#5a7a9a' }}>{m.label}</span>
                  </div>
                  {it && (
                    <div className="pl-4">
                      <div className="text-[12px] font-mono font-bold text-white/85">{fmt(it.value, m.fmt)}</div>
                      <div className="text-[8px] text-white/20 font-mono">{fmtDate(it.reference_date)}</div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={selected} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
              exit={{opacity:0}} transition={{duration:0.18}} className="p-4 space-y-3">

              {/* KPI CARDS */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  {label:'Último Valor',  val:fmt(item?.value, selMeta?.fmt),  sub:fmtDate(item?.reference_date), color:selMeta?.color},
                  {label:'Média Anual',   val:fmt(lastAnn?.avg_value, selMeta?.fmt), sub:`${lastAnn?.year??'—'}`, color:selMeta?.color+'99'},
                  {label:'Mín Histórico', val:fmt(allMin, selMeta?.fmt), sub:'desde 2000', color:'#39ff14aa'},
                  {label:'Máx Histórico', val:fmt(allMax, selMeta?.fmt), sub:'desde 2000', color:'#ff4444aa'},
                ].map((c,i)=>(
                  <div key={i} className="rounded-xl p-4 border border-white/6" style={{background:'rgba(255,255,255,0.02)'}}>
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-white/25 mb-1">{c.label}</div>
                    <div className="text-[22px] font-bold font-mono leading-none" style={{color:c.color}}>{c.val}</div>
                    <div className="text-[9px] text-white/20 font-mono mt-1">{c.sub}</div>
                  </div>
                ))}
              </div>

              {/* CHART */}
              <div className="rounded-2xl border border-white/8 overflow-hidden" style={{background:'rgba(7,16,32,0.9)'}}>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/6">
                  <span className="text-[13px]">{selMeta?.icon}</span>
                  <span className="text-[13px] font-bold text-white">{selMeta?.label}</span>
                  <span className="text-[9px] text-white/25 font-mono">{selMeta?.unit}</span>
                  <span className="text-[9px] text-white/20 ml-1">· Arraste o brush para navegar no histórico</span>
                  <div className="ml-auto flex rounded-lg overflow-hidden border border-white/10">
                    {(['mensal','anual'] as const).map(v=>(
                      <button key={v} onClick={()=>setView(v)}
                        className="px-4 py-1.5 text-[10px] font-medium transition-colors"
                        style={{background:view===v?`${selMeta?.color}25`:'transparent', color:view===v?selMeta?.color:'#4a6a8a'}}>
                        {v[0].toUpperCase()+v.slice(1)}
                      </button>
                    ))}
                  </div>
                  <span className="text-[8px] font-mono px-2 py-0.5 rounded ml-1"
                        style={{color:'#ffcc00',background:'#ffcc0010',border:'1px solid #ffcc0025'}}>GOLD</span>
                </div>
                <div style={{height:360, padding:'12px 8px 0'}}>
                  {loading
                    ? <div className="h-full flex items-center justify-center text-white/15 animate-pulse text-sm">Carregando dados...</div>
                    : view==='mensal'
                      ? <HistoryChart series={selected} data={monthlyFor} />
                      : <AnnualChart  series={selected} data={annualFor} />
                  }
                </div>
              </div>

              {/* ALL INDICATORS GRID */}
              <div>
                <p className="text-[9px] uppercase tracking-widest text-white/20 mb-2">Todos os indicadores — última leitura</p>
                <div className="grid grid-cols-5 gap-2">
                  {ORDER.map(name=>{
                    const m=META[name]; const it=latestMap[name]; const on=selected===name
                    return (
                      <button key={name} onClick={()=>setSelected(name)}
                        className="rounded-xl p-3 text-left border transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{background:on?`${m.color}10`:'rgba(255,255,255,0.02)', borderColor:on?`${m.color}40`:'rgba(255,255,255,0.06)'}}>
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[11px]">{m.icon}</span>
                          <span className="text-[9px] font-bold" style={{color:m.color}}>{m.label}</span>
                        </div>
                        <div className="text-[13px] font-mono font-bold text-white/85">{it?fmt(it.value,m.fmt):'—'}</div>
                        <div className="text-[8px] text-white/20 font-mono mt-0.5">{it?fmtDate(it.reference_date):''}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/5 text-[9px] text-white/20"
                   style={{background:'rgba(255,255,255,0.01)'}}>
                <span>📡 <strong className="text-white/40">Fonte:</strong> API SGS — Banco Central do Brasil (bcb.gov.br) · gratuita · sem autenticação</span>
                <span className="ml-auto">Bronze → Silver → Gold · GitHub Actions cron 06:00 BRT</span>
              </div>

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
