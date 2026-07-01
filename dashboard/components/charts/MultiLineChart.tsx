'use client'
import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, Brush } from 'recharts'
import { Monthly } from '@/lib/supabase'
import { META, fmt } from '@/lib/meta'

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl p-3 text-[11px] shadow-lg min-w-[160px]" style={{ background: 'var(--bg-2)', border: '1px solid var(--border-strong)' }}>
      <p className="font-mono mb-2" style={{ color: 'var(--text-2)' }}>{label}</p>
      {payload.map((p: any, i: number) => {
        const m = META[p.dataKey]
        return (
          <div key={i} className="flex justify-between gap-4">
            <span style={{ color: p.stroke }}>{m?.label ?? p.dataKey}</span>
            <span className="font-mono font-bold" style={{ color: 'var(--text-0)' }}>{fmt(p.value, m?.fmt ?? 'num')}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function MultiLineChart({ series, data }: { series: string[]; data: Monthly[] }) {
  const [gridColor, setGridColor] = useState('rgba(255,255,255,0.06)')
  const [axisColor, setAxisColor] = useState('#5a7390')

  useEffect(() => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    setGridColor(isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.07)')
    setAxisColor(isDark ? '#5a7390' : '#64748b')
  }, [])

  if (series.length === 0) return <div className="h-full flex items-center justify-center text-sm" style={{ color: 'var(--text-3)' }}>Nenhum indicador selecionado</div>

  // Build combined dataset: { label, series1: val, series2: val, ... }
  const byLabel: Record<string, any> = {}
  for (const name of series) {
    data.filter(d => d.series_name === name).forEach(d => {
      const label = `${String(d.month).padStart(2,'0')}/${d.year}`
      if (!byLabel[label]) byLabel[label] = { label, year: d.year, month: d.month }
      byLabel[label][name] = d.last_value
    })
  }
  const chartData = Object.values(byLabel).sort((a: any, b: any) => a.year - b.year || a.month - b.month)
  const start = Math.max(0, chartData.length - 60)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={gridColor} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: axisColor, fontSize: 9 }} axisLine={false} tickLine={false} width={50} />
        <Tooltip content={<TT />} />
        <Legend
          formatter={(value: string) => <span style={{ color: META[value]?.color, fontSize: 11 }}>{META[value]?.icon} {META[value]?.label}</span>}
        />
        {series.map(name => (
          <Line key={name} type="monotone" dataKey={name} stroke={META[name]?.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        ))}
        <Brush dataKey="label" height={18} stroke={gridColor} fill="var(--bg-2)" startIndex={start} travellerWidth={5} style={{ fontSize: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
