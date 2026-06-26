'use client'
import { useEffect, useRef } from 'react'
import { Latest } from '@/lib/supabase'
import { SERIES_META, fmtValue, fmtDate } from '@/lib/meta'

export default function Ticker({ items }: { items: Latest[] }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let x = 0
    const speed = 0.5
    let raf: number
    const animate = () => {
      x -= speed
      if (Math.abs(x) > el.scrollWidth / 2) x = 0
      el.style.transform = `translateX(${x}px)`
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [items])

  if (!items.length) return null

  const doubled = [...items, ...items]

  return (
    <div className="relative overflow-hidden bg-[#050c16] border-b border-white/10 h-8 flex items-center"
         style={{ background: 'linear-gradient(90deg,#050c16,#0a1628,#050c16)' }}>
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10"
           style={{ background: 'linear-gradient(90deg,#050c16,transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10"
           style={{ background: 'linear-gradient(270deg,#050c16,transparent)' }} />

      <div ref={ref} className="flex items-center gap-0 whitespace-nowrap will-change-transform">
        {doubled.map((item, i) => {
          const meta = SERIES_META[item.series_name]
          if (!meta) return null
          return (
            <span key={i} className="flex items-center gap-2 px-5 border-r border-white/8">
              <span className="text-[10px]">{meta.icon}</span>
              <span className="text-[11px] font-bold font-mono" style={{ color: meta.color }}>
                {meta.label}
              </span>
              <span className="text-[11px] font-mono text-white/90">
                {fmtValue(item.value, meta.format)}
              </span>
              <span className="text-[9px] text-white/30 font-mono">
                {fmtDate(item.reference_date)}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
