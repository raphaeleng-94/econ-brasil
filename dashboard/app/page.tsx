'use client'
import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchLatest, fetchMonthly, fetchAnnual, Latest, Monthly, Annual } from '@/lib/supabase'
import { META, ORDER, fmt, fmtDate, type Category } from '@/lib/meta'
import NavBar from '@/components/ui/NavBar'
import CategoryFilter from '@/components/ui/CategoryFilter'

const Ticker       = dynamic(() => import('@/components/ui/Ticker'),           { ssr: false })
const HistoryChart  = dynamic(() => import('@/components/charts/HistoryChart'), { ssr: false })
const AnnualChart   = dynamic(() => import('@/components/charts/AnnualChart'),  { ssr: false })

export default function Home() {
  const [latest,  setLatest]  = useState<Latest[]>([])
  const [monthly, setMonthly] = useState<Monthly[]>([])
  const [annual,  setAnnual]  = useState<Annual[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState('selic_diaria')
  const [view, setView] = useState<'mensal'|'anual'>('mensal')
  const [category, setCategory] = useState<Category | null>(null)
  const [search, setSearch] = useState('')

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

  const filteredOrder = useMemo(() => {
    return ORDER.filter(name => {
      const m = META[name]
      if (category && m.category !== category) return false
      if (search && !m.label.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [category, search])

  return (
    <div className="relative z-10 flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-0)' }}>

      {/* HEADER */}
      <header className="shrink-0" style={{ background: 'var(--bg-1)' }}>
        <Ticker items={latest} />
        <NavBar live={!loading} active="painel" />

        {/* Filters row */}
        <div className="flex items-center gap-3 px-5 py-2.5 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
          <CategoryFilter active={category} onChange={setCategory} />
          <input
            type="text"
            placeholder="🔍 Buscar indicador..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-1.5 rounded-full text-[11px] outline-none ml-auto w-48"
            style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text-0)' }}
          />
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* SIDEBAR */}
        <aside className="shrink-0 w-48 overflow-y-auto" style={{ background: 'var(--bg-1)', borderRight: '1px solid var(--border)' }}>
          <div className="p-1.5 space-y-0.5">
            {filteredOrder.length === 0 && (
              <p className="text-[10px] text-center py-4" style={{ color: 'var(--text-3)' }}>Nenhum resultado</p>
            )}
            {filteredOrder.map(name => {
              const m = META[name]; const it = latestMap[name]; const on = selected === name
              return (
                <button key={name} onClick={() => setSelected(name)}
                  className="w-full text-left px-2.5 py-2 rounded-lg transition-all"
                  style={{ background: on ? `${m.color}1c` : 'transparent', border: `1px solid ${on ? m.color+'55':'transparent'}` }}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px]">{m.icon}</span>
                    <span className="text-[10px] font-bold" style={{ color: on ? m.color : 'var(--text-2)' }}>{m.label}</span>
                  </div>
                  {it && (
                    <div className="pl-4">
                      <div className="text-[12px] font-mono font-bold" style={{ color: 'var(--text-0)' }}>{fmt(it.value, m.fmt)}</div>
                      <div className="text-[8px] font-mono" style={{ color: 'var(--text-3)' }}>{fmtDate(it.reference_date)}</div>
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
                  {label:'Média Anual',   val:fmt(lastAnn?.avg_value, selMeta?.fmt), sub:`${lastAnn?.year??'—'}`, color:selMeta?.color},
                  {label:'Mín Histórico', val:fmt(allMin, selMeta?.fmt), sub:'desde 2000', color:'#16a34a'},
                  {label:'Máx Histórico', val:fmt(allMax, selMeta?.fmt), sub:'desde 2000', color:'#dc2626'},
                ].map((c,i)=>(
                  <div key={i} className="rounded-xl p-4" style={{background:'var(--bg-1)', border:'1px solid var(--border)', boxShadow:'var(--shadow)'}}>
                    <div className="text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-2)' }}>{c.label}</div>
                    <div className="text-[22px] font-bold font-mono leading-none" style={{color:c.color}}>{c.val}</div>
                    <div className="text-[9px] font-mono mt-1" style={{ color: 'var(--text-3)' }}>{c.sub}</div>
                  </div>
                ))}
              </div>

              {/* CHART */}
              <div className="rounded-2xl overflow-hidden" style={{background:'var(--bg-1)', border:'1px solid var(--border)', boxShadow:'var(--shadow)'}}>
                <div className="flex items-center gap-3 px-4 py-3 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="text-[13px]">{selMeta?.icon}</span>
                  <span className="text-[13px] font-bold" style={{ color: 'var(--text-0)' }}>{selMeta?.label}</span>
                  <span className="text-[9px] font-mono" style={{ color: 'var(--text-2)' }}>{selMeta?.unit}</span>
                  <span className="text-[9px] hidden md:inline" style={{ color: 'var(--text-3)' }}>· {selMeta?.desc}</span>
                  <div className="ml-auto flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    {(['mensal','anual'] as const).map(v=>(
                      <button key={v} onClick={()=>setView(v)}
                        className="px-4 py-1.5 text-[10px] font-medium transition-colors"
                        style={{background:view===v?`${selMeta?.color}25`:'transparent', color:view===v?selMeta?.color:'var(--text-2)'}}>
                        {v[0].toUpperCase()+v.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{height:360, padding:'12px 8px 0'}}>
                  {loading
                    ? <div className="h-full flex items-center justify-center text-sm animate-pulse" style={{ color: 'var(--text-3)' }}>Carregando dados...</div>
                    : view==='mensal'
                      ? <HistoryChart series={selected} data={monthlyFor} />
                      : <AnnualChart  series={selected} data={annualFor} />
                  }
                </div>
              </div>

              {/* ALL INDICATORS GRID */}
              <div>
                <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>Todos os indicadores — última leitura</p>
                <div className="grid grid-cols-5 gap-2">
                  {filteredOrder.map(name=>{
                    const m=META[name]; const it=latestMap[name]; const on=selected===name
                    return (
                      <button key={name} onClick={()=>setSelected(name)}
                        className="rounded-xl p-3 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{background:on?`${m.color}14`:'var(--bg-1)', border: `1px solid ${on?m.color+'55':'var(--border)'}`, boxShadow: on ? 'none' : 'var(--shadow)'}}>
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[11px]">{m.icon}</span>
                          <span className="text-[9px] font-bold" style={{color:m.color}}>{m.label}</span>
                        </div>
                        <div className="text-[13px] font-mono font-bold" style={{ color: 'var(--text-0)' }}>{it?fmt(it.value,m.fmt):'—'}</div>
                        <div className="text-[8px] font-mono mt-0.5" style={{ color: 'var(--text-3)' }}>{it?fmtDate(it.reference_date):''}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[9px]" style={{background:'var(--bg-1)', border:'1px solid var(--border)', color: 'var(--text-3)'}}>
                <span>📡 <strong style={{ color: 'var(--text-2)' }}>Fonte:</strong> API SGS — Banco Central do Brasil (bcb.gov.br) · gratuita · sem autenticação</span>
              </div>

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
