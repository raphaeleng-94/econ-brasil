'use client'
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine, Brush
} from 'recharts'
import { Monthly } from '@/lib/supabase'
import { SERIES_META, fmtValue } from '@/lib/meta'

interface Props {
  seriesName: string
  data: Monthly[]
  highlighted?: { year: number; month: number } | null
}

const CustomTooltip = ({ active, payload, label, format, unit }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0b1828] border border-white/15 rounded-xl p-3 shadow-2xl text-xs min-w-[160px]">
      <p className="text-white/50 font-mono mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono font-bold text-white">
            {fmtValue(p.value, format)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function StackedChart({ seriesName, data, highlighted }: Props) {
  const meta = SERIES_META[seriesName]
  if (!meta || !data.length) return null

  const chartData = data.map(d => ({
    label: `${String(d.month).padStart(2,'0')}/${d.year}`,
    year: d.year,
    month: d.month,
    Máximo: d.max_value,
    Média: d.avg_value,
    Mínimo: d.min_value,
    Último: d.last_value,
  }))

  const isHighlighted = (d: any) =>
    highlighted && d.year === highlighted.year && d.month === highlighted.month

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`grad_${seriesName}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={meta.color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={meta.color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: '#4a6a8a', fontSize: 9 }}
          axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: '#4a6a8a', fontSize: 9 }} axisLine={false} tickLine={false}
          tickFormatter={v => fmtValue(v, meta.format)} width={55} />
        <Tooltip content={<CustomTooltip format={meta.format} />} />

        {/* Range band */}
        <Area type="monotone" dataKey="Máximo" stroke="transparent"
          fill={`url(#grad_${seriesName})`} fillOpacity={1} name="Máximo" />
        <Area type="monotone" dataKey="Mínimo" stroke="transparent"
          fill="transparent" name="Mínimo" />

        {/* Main lines */}
        <Line type="monotone" dataKey="Último" stroke={meta.color}
          strokeWidth={2} dot={false} activeDot={{ r: 5, fill: meta.color }} name="Último" />
        <Line type="monotone" dataKey="Média" stroke={`${meta.color}66`}
          strokeWidth={1} strokeDasharray="4 2" dot={false} name="Média" />

        {/* Zero reference */}
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />

        {/* Brush for zoom */}
        <Brush dataKey="label" height={20} stroke="rgba(255,255,255,0.1)"
          fill="#0b1828" travellerWidth={6}
          startIndex={Math.max(0, chartData.length - 60)}
          style={{ fontSize: 8, fill: '#4a6a8a' }} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
