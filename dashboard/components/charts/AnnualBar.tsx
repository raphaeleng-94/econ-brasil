'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { Annual } from '@/lib/supabase'
import { SERIES_META, fmtValue } from '@/lib/meta'

interface Props { seriesName: string; data: Annual[] }

export default function AnnualBar({ seriesName, data }: Props) {
  const meta = SERIES_META[seriesName]
  if (!meta || !data.length) return null

  const chartData = data.map(d => ({
    year: d.year,
    Acumulado: d.acum_value,
    Média: d.avg_value,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <XAxis dataKey="year" tick={{ fill:'#4a6a8a', fontSize:9 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill:'#4a6a8a', fontSize:9 }} axisLine={false} tickLine={false}
          tickFormatter={(v: number) => fmtValue(v, meta.format)} width={55} />
        <Tooltip
          contentStyle={{ background:'#0b1828', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, fontSize:11 }}
          labelStyle={{ color:'#7a9ab5' }}
          formatter={(v: any) => [fmtValue(v, meta.format)]}
        />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
        <Bar dataKey="Acumulado" radius={[3,3,0,0]} maxBarSize={40}>
          {chartData.map((d,i) => (
            <Cell key={i} fill={(d.Acumulado ?? 0) >= 0 ? meta.color : '#ff4444'} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
