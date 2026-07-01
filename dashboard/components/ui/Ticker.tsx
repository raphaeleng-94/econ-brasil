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
    <div className="overflow-hidden h-7 flex items-center relative" style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--border)' }}>
      <div className="absolute left-0 w-12 h-7 z-10" style={{ background: 'linear-gradient(90deg,var(--bg-1),transparent)' }} />
      <div className="absolute right-0 w-12 h-7 z-10" style={{ background: 'linear-gradient(270deg,var(--bg-1),transparent)' }} />
      <div ref={ref} className="flex whitespace-nowrap will-change-transform">
        {doubled.map((item, i) => {
          const m = META[item.series_name]; if (!m) return null
          return (
            <span key={i} className="inline-flex items-center gap-2 px-4 text-[10px]" style={{ borderRight: '1px solid var(--border)' }}>
              <span>{m.icon}</span>
              <span className="font-bold font-mono" style={{ color: m.color }}>{m.label}</span>
              <span className="font-mono" style={{ color: 'var(--text-1)' }}>{fmt(item.value, m.fmt)}</span>
              <span className="font-mono" style={{ color: 'var(--text-3)' }}>{fmtDate(item.reference_date)}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
