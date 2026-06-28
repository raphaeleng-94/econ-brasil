'use client'
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine, Brush } from 'recharts'
import { Monthly } from '@/lib/supabase'
import { META, fmt } from '@/lib/meta'

const TT = ({ active, payload, label, f }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#071020] border border-white/10 rounded-xl p-3 text-[11px] shadow-2xl min-w-[160px]">
      <p className="text-white/40 font-mono mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex justify-between gap-4">
          <span style={{ color: p.color || p.stroke }}>{p.name}</span>
          <span className="font-mono font-bold text-white">{fmt(p.value, f)}</span>
        </div>
      ))}
    </div>
  )
}

export default function HistoryChart({ series, data }: { series: string; data: Monthly[] }) {
  const m = META[series]; if (!m || !data.length) return <div className="h-full flex items-center justify-center text-white/20 text-sm">Sem dados</div>
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
            <stop offset="5%" stopColor={m.color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={m.color} stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: '#3a5a7a', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: '#3a5a7a', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v, m.fmt)} width={60} />
        <Tooltip content={<TT f={m.fmt} />} />
        <Area type="monotone" dataKey="Máx" stroke="none" fill={`url(#g_${series})`} />
        <Area type="monotone" dataKey="Mín" stroke="none" fill="transparent" />
        <Line type="monotone" dataKey="Último" stroke={m.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="Média" stroke={`${m.color}55`} strokeWidth={1} strokeDasharray="4 2" dot={false} />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />
        <Brush dataKey="label" height={18} stroke="rgba(255,255,255,0.08)" fill="#071020" startIndex={start} travellerWidth={5} style={{ fontSize: 8 }} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
