'use client'
import { useEffect, useState } from 'react'
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine, Brush } from 'recharts'
import { Monthly } from '@/lib/supabase'
import { META, fmt } from '@/lib/meta'

const TT = ({ active, payload, label, f }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl p-3 text-[11px] shadow-lg min-w-[160px]" style={{ background: 'var(--bg-2)', border: '1px solid var(--border-strong)' }}>
      <p className="font-mono mb-2" style={{ color: 'var(--text-2)' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex justify-between gap-4">
          <span style={{ color: p.color || p.stroke }}>{p.name}</span>
          <span className="font-mono font-bold" style={{ color: 'var(--text-0)' }}>{fmt(p.value, f)}</span>
        </div>
      ))}
    </div>
  )
}

export default function HistoryChart({ series, data }: { series: string; data: Monthly[] }) {
  const m = META[series]
  const [gridColor, setGridColor] = useState('rgba(255,255,255,0.06)')
  const [axisColor, setAxisColor] = useState('#5a7390')

  useEffect(() => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    setGridColor(isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.07)')
    setAxisColor(isDark ? '#5a7390' : '#64748b')
  }, [])

  if (!m || !data.length) return <div className="h-full flex items-center justify-center text-sm" style={{ color: 'var(--text-3)' }}>Sem dados</div>

  const chartData = data.map(d => ({
    label: `${String(d.month).padStart(2,'0')}/${d.year}`,
    Máx: d.max_value, Média: d.avg_value, Mín: d.min_value, Último: d.last_value,
  }))
  const start = Math.max(0, chartData.length - 60)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`g_${series}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={m.color} stopOpacity={0.28} />
            <stop offset="95%" stopColor={m.color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={gridColor} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: axisColor, fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v, m.fmt)} width={60} />
        <Tooltip content={<TT f={m.fmt} />} />
        <Area type="monotone" dataKey="Máx" stroke="none" fill={`url(#g_${series})`} />
        <Area type="monotone" dataKey="Mín" stroke="none" fill="transparent" />
        <Line type="monotone" dataKey="Último" stroke={m.color} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="Média" stroke={`${m.color}88`} strokeWidth={1} strokeDasharray="4 2" dot={false} />
        <ReferenceLine y={0} stroke={gridColor} />
        <Brush dataKey="label" height={18} stroke={gridColor} fill="var(--bg-2)" startIndex={start} travellerWidth={5} style={{ fontSize: 8 }} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
