'use client'
import { useEffect, useRef } from 'react'
import { Latest } from '@/lib/supabase'
import { META, fmt, fmtDate } from '@/lib/meta'

export default function Ticker({ items }: { items: Latest[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    let x = 0; let raf: number
    const tick = () => { x -= 0.4; if (Math.abs(x) >= el.scrollWidth / 2) x = 0; el.style.transform = `translateX(${x}px)`; raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [items])
  if (!items.length) return null
  const doubled = [...items, ...items]
  return (
    <div className="overflow-hidden border-b border-white/10 h-7 flex items-center" style={{ background: '#020810' }}>
      <div className="absolute left-0 w-12 h-7 z-10" style={{ background: 'linear-gradient(90deg,#020810,transparent)' }} />
      <div className="absolute right-0 w-12 h-7 z-10" style={{ background: 'linear-gradient(270deg,#020810,transparent)' }} />
      <div ref={ref} className="flex whitespace-nowrap will-change-transform">
        {doubled.map((item, i) => {
          const m = META[item.series_name]; if (!m) return null
          return (
            <span key={i} className="inline-flex items-center gap-2 px-4 border-r border-white/8 text-[10px]">
              <span>{m.icon}</span>
              <span className="font-bold font-mono" style={{ color: m.color }}>{m.label}</span>
              <span className="font-mono text-white/80">{fmt(item.value, m.fmt)}</span>
              <span className="text-white/25 font-mono">{fmtDate(item.reference_date)}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
