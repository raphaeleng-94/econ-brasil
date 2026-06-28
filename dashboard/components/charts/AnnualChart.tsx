'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { Annual } from '@/lib/supabase'
import { META, fmt } from '@/lib/meta'

export default function AnnualChart({ series, data }: { series: string; data: Annual[] }) {
  const m = META[series]; if (!m || !data.length) return null
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <XAxis dataKey="year" tick={{ fill:'#3a5a7a', fontSize:9 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill:'#3a5a7a', fontSize:9 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v, m.fmt)} width={60} />
        <Tooltip contentStyle={{ background:'#071020', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, fontSize:11 }}
          labelStyle={{ color:'#7a9ab5' }} formatter={(v: any) => [fmt(v, m.fmt)]} />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />
        <Bar dataKey="acum_value" name="Acumulado" radius={[3,3,0,0]} maxBarSize={36}>
          {data.map((d, i) => <Cell key={i} fill={(d.acum_value??0)>=0 ? m.color : '#ff4444'} fillOpacity={0.8} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
