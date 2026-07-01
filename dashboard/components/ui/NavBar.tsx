'use client'
import Link from 'next/link'
import ThemeToggle from './ThemeToggle'

export default function NavBar({ live, active }: { live: boolean; active: 'painel' | 'comparativo' | 'sobre' }) {
  const links = [
    { href: '/', key: 'painel', label: 'Painel' },
    { href: '/comparativo', key: 'comparativo', label: 'Comparativo' },
    { href: '/sobre', key: 'sobre', label: 'Sobre a Economia' },
  ] as const

  return (
    <div className="flex items-center gap-3 px-5 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
           style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
        🇧🇷
      </div>
      <h1 className="text-[14px] font-bold leading-none" style={{ color: 'var(--text-0)' }}>Painel Econômico Brasil</h1>

      <nav className="flex items-center gap-1 ml-4">
        {links.map(l => (
          <Link key={l.key} href={l.href}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
            style={{
              background: active === l.key ? 'var(--accent)' : 'transparent',
              color: active === l.key ? '#fff' : 'var(--text-2)',
            }}>
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3 ml-auto">
        <span className="text-[9px] font-mono" style={{ color: live ? '#16a34a' : 'var(--text-3)' }}>
          {live ? '● AO VIVO' : '● CARREGANDO'}
        </span>
        <ThemeToggle />
      </div>
    </div>
  )
}
