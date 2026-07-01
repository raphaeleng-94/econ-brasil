'use client'
import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { fetchLatest, fetchMonthly, Latest, Monthly } from '@/lib/supabase'
import { META, ORDER, fmt, fmtDate } from '@/lib/meta'
import NavBar from '@/components/ui/NavBar'

const MultiLineChart = dynamic(() => import('@/components/charts/MultiLineChart'), { ssr: false })

export default function Comparativo() {
  const [latest, setLatest] = useState<Latest[]>([])
  const [monthly, setMonthly] = useState<Monthly[]>([])
  const [loading, setLoading] = useState(true)
  const [picked, setPicked] = useState<string[]>(['selic_diaria', 'ipca_mensal'])

  useEffect(() => {
    Promise.all([fetchLatest(), fetchMonthly()])
      .then(([l, m]) => { setLatest(l); setMonthly(m) })
      .catch(console.error).finally(() => setLoading(false))
  }, [])

  const latestMap = useMemo(() => Object.fromEntries(latest.map(l => [l.series_name, l])), [latest])

  function toggle(name: string) {
    setPicked(prev => {
      if (prev.includes(name)) return prev.filter(n => n !== name)
      if (prev.length >= 4) return prev
      return [...prev, name]
    })
  }

  return (
    <div className="relative z-10 flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-0)' }}>
      <header className="shrink-0" style={{ background: 'var(--bg-1)' }}>
        <NavBar live={!loading} active="comparativo" />
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <h2 className="text-[16px] font-bold mb-1" style={{ color: 'var(--text-0)' }}>Comparativo entre Indicadores</h2>
          <p className="text-[11px]" style={{ color: 'var(--text-2)' }}>
            Selecione até 4 indicadores para visualizar a evolução histórica no mesmo gráfico (valores normalizados em escala própria por eixo).
          </p>
        </div>

        {/* Picker grid */}
        <div className="grid grid-cols-5 gap-2">
          {ORDER.map(name => {
            const m = META[name]; const it = latestMap[name]; const on = picked.includes(name)
            return (
              <button key={name} onClick={() => toggle(name)}
                className="rounded-xl p-3 text-left transition-all"
                style={{
                  background: on ? `${m.color}18` : 'var(--bg-1)',
                  border: `1px solid ${on ? m.color+'66' : 'var(--border)'}`,
                  boxShadow: on ? 'none' : 'var(--shadow)',
                  opacity: !on && picked.length >= 4 ? 0.4 : 1,
                }}>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[11px]">{m.icon}</span>
                  <span className="text-[9px] font-bold" style={{ color: m.color }}>{m.label}</span>
                  {on && <span className="ml-auto text-[10px]" style={{ color: m.color }}>✓</span>}
                </div>
                <div className="text-[12px] font-mono font-bold" style={{ color: 'var(--text-0)' }}>{it ? fmt(it.value, m.fmt) : '—'}</div>
              </button>
            )
          })}
        </div>

        {/* Chart */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <div className="flex items-center gap-2 px-4 py-3 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
            {picked.map(name => {
              const m = META[name]
              return (
                <span key={name} className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: `${m.color}18`, color: m.color }}>
                  {m.icon} {m.label}
                </span>
              )
            })}
            {picked.length === 0 && <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>Selecione indicadores acima para comparar</span>}
          </div>
          <div style={{ height: 380, padding: '12px 8px 0' }}>
            {loading
              ? <div className="h-full flex items-center justify-center text-sm animate-pulse" style={{ color: 'var(--text-3)' }}>Carregando...</div>
              : <MultiLineChart series={picked} data={monthly} />
            }
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[9px]" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
          <span>💡 Dica: indicadores com unidades muito diferentes (ex: SELIC % vs Reservas US$ bi) usam eixos independentes para facilitar a leitura visual da tendência.</span>
        </div>
      </main>
    </div>
  )
}
