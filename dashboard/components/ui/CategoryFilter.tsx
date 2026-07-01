'use client'
import { CATEGORIES, type Category } from '@/lib/meta'

interface Props {
  active: Category | null
  onChange: (c: Category | null) => void
}

export default function CategoryFilter({ active, onChange }: Props) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={() => onChange(null)}
        className="px-3 py-1.5 rounded-full text-[10px] font-semibold transition-colors"
        style={{
          background: active === null ? 'var(--accent)' : 'var(--bg-3)',
          color: active === null ? '#fff' : 'var(--text-1)',
          border: '1px solid var(--border)',
        }}
      >
        Todos
      </button>
      {CATEGORIES.map(c => (
        <button
          key={c.key}
          onClick={() => onChange(active === c.key ? null : c.key)}
          className="px-3 py-1.5 rounded-full text-[10px] font-semibold transition-colors flex items-center gap-1"
          style={{
            background: active === c.key ? 'var(--accent)' : 'var(--bg-3)',
            color: active === c.key ? '#fff' : 'var(--text-1)',
            border: '1px solid var(--border)',
          }}
        >
          <span>{c.icon}</span>{c.label}
        </button>
      ))}
    </div>
  )
}
