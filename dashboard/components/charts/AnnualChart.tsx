'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { Annual } from '@/lib/supabase'
import { META, fmt } from '@/lib/meta'

export default function AnnualChart({ series, data }: { series: string; data: Annual[] }) {
  const m = META[series]
  const [gridColor, setGridColor] = useState('rgba(255,255,255,0.06)')
  const [axisColor, setAxisColor] = useState('#5a7390')

  useEffect(() => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    setGridColor(isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.07)')
    setAxisColor(isDark ? '#5a7390' : '#64748b')
  }, [])

  if (!m || !data.length) return null
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <XAxis dataKey="year" tick={{ fill: axisColor, fontSize:9 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: axisColor, fontSize:9 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v, m.fmt)} width={60} />
        <Tooltip contentStyle={{ background:'var(--bg-2)', border:'1px solid var(--border-strong)', borderRadius:10, fontSize:11, color: 'var(--text-0)' }}
          labelStyle={{ color:'var(--text-2)' }} formatter={(v: any) => [fmt(v, m.fmt)]} />
        <ReferenceLine y={0} stroke={gridColor} />
        <Bar dataKey="acum_value" name="Acumulado" radius={[3,3,0,0]} maxBarSize={36}>
          {data.map((d, i) => <Cell key={i} fill={(d.acum_value??0)>=0 ? m.color : '#dc2626'} fillOpacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
