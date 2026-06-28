export const META: Record<string, { label: string; unit: string; color: string; icon: string; fmt: 'pct'|'brl'|'usd'|'num' }> = {
  selic_diaria:   { label: 'SELIC',          unit: '% a.a.',  color: '#00d4ff', icon: '📈', fmt: 'pct' },
  ipca_mensal:    { label: 'IPCA',           unit: '% a.m.',  color: '#ff6b35', icon: '🔥', fmt: 'pct' },
  cambio_usd:     { label: 'USD/BRL',        unit: 'R$',      color: '#39ff14', icon: '💵', fmt: 'brl' },
  pib_trimestral: { label: 'PIB',            unit: '% trim.', color: '#bd10e0', icon: '📊', fmt: 'pct' },
  igpm_mensal:    { label: 'IGP-M',          unit: '% a.m.',  color: '#ffcc00', icon: '📉', fmt: 'pct' },
  inpc_mensal:    { label: 'INPC',           unit: '% a.m.',  color: '#ff4488', icon: '🛒', fmt: 'pct' },
  reservas_int:   { label: 'Reservas Int.',  unit: 'US$ mi',  color: '#00ff88', icon: '🏦', fmt: 'usd' },
  divida_pib:     { label: 'Dívida/PIB',    unit: '%',       color: '#ff4444', icon: '⚠️',  fmt: 'pct' },
  saldo_bc:       { label: 'Bal. Comercial', unit: 'US$ mi',  color: '#4488ff', icon: '⚖️',  fmt: 'usd' },
  credito_total:  { label: 'Crédito Total', unit: 'R$ bi',   color: '#ff88ff', icon: '💳', fmt: 'brl' },
}

export const ORDER = [
  'selic_diaria','ipca_mensal','cambio_usd','pib_trimestral',
  'igpm_mensal','inpc_mensal','divida_pib','saldo_bc','reservas_int','credito_total'
]

export function fmt(v: number | null | undefined, f: string): string {
  if (v == null) return '—'
  if (f === 'pct') return `${(+v).toFixed(2)}%`
  if (f === 'brl') return `R$ ${(+v).toFixed(2)}`
  if (f === 'usd') return `US$ ${((+v)/1000).toFixed(1)}bi`
  return (+v).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

export function fmtDate(s: string | null | undefined): string {
  if (!s) return ''
  const [y, m, d] = s.split('-')
  return d ? `${d}/${m}/${y}` : s
}
