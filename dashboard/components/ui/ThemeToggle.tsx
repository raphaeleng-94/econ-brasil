'use client'
import { useTheme } from '@/lib/theme'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label="Alternar tema"
      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
      style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
