export type Category = 'juros_inflacao' | 'cambio_externo' | 'atividade_fiscal'

export const META: Record<string, {
  label: string; unit: string; color: string; icon: string
  fmt: 'pct'|'brl'|'usd'|'tri'|'num'; category: Category; desc: string
}> = {
  selic_diaria:   { label: 'SELIC',          unit: '% a.a.',  color: '#0284c7', icon: '📈', fmt: 'pct', category: 'juros_inflacao', desc: 'Taxa básica de juros da economia, definida pelo Copom' },
  ipca_mensal:    { label: 'IPCA',           unit: '% a.m.',  color: '#ea580c', icon: '🔥', fmt: 'pct', category: 'juros_inflacao', desc: 'Inflação oficial usada para a meta do governo' },
  igpm_mensal:    { label: 'IGP-M',          unit: '% a.m.',  color: '#ca8a04', icon: '📉', fmt: 'pct', category: 'juros_inflacao', desc: 'Índice usado em contratos de aluguel e energia' },
  inpc_mensal:    { label: 'INPC',           unit: '% a.m.',  color: '#db2777', icon: '🛒', fmt: 'pct', category: 'juros_inflacao', desc: 'Inflação para famílias de baixa renda' },
  cambio_usd:     { label: 'USD/BRL',        unit: 'R$',      color: '#16a34a', icon: '💵', fmt: 'brl', category: 'cambio_externo', desc: 'Cotação do dólar americano (compra)' },
  reservas_int:   { label: 'Reservas Int.',  unit: 'US$ mi',  color: '#059669', icon: '🏦', fmt: 'usd', category: 'cambio_externo', desc: 'Reservas em moeda estrangeira do país' },
  saldo_bc:       { label: 'Bal. Comercial', unit: 'US$ mi',  color: '#2563eb', icon: '⚖️',  fmt: 'usd', category: 'cambio_externo', desc: 'Exportações menos importações' },
  pib_trimestral: { label: 'PIB',            unit: '% trim.', color: '#7c3aed', icon: '📊', fmt: 'pct', category: 'atividade_fiscal', desc: 'Variação trimestral do Produto Interno Bruto' },
  divida_pib:     { label: 'Dívida/PIB',    unit: '%',       color: '#dc2626', icon: '⚠️',  fmt: 'pct', category: 'atividade_fiscal', desc: 'Endividamento do governo geral' },
  credito_total:  { label: 'Crédito Total', unit: 'R$ tri',  color: '#c026d3', icon: '💳', fmt: 'tri', category: 'atividade_fiscal', desc: 'Volume de crédito no sistema financeiro' },
}

export const ORDER = [
  'selic_diaria','ipca_mensal','cambio_usd','pib_trimestral',
  'igpm_mensal','inpc_mensal','divida_pib','saldo_bc','reservas_int','credito_total'
]

export const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: 'juros_inflacao', label: 'Juros & Inflação', icon: '📈' },
  { key: 'cambio_externo', label: 'Câmbio & Externo',  icon: '🌎' },
  { key: 'atividade_fiscal', label: 'Atividade & Fiscal', icon: '🏛️' },
]

export function fmt(v: number | null | undefined, f: string): string {
  if (v == null) return '—'
  if (f === 'pct') return `${(+v).toFixed(2)}%`
  if (f === 'brl') return `R$ ${(+v).toFixed(2)}`
  if (f === 'tri') return `R$ ${((+v)/1e6).toFixed(2)}tri`
  if (f === 'usd') return `US$ ${((+v)/1000).toFixed(1)}bi`
  return (+v).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

export function fmtDate(s: string | null | undefined): string {
  if (!s) return ''
  const [y, m, d] = s.split('-')
  return d ? `${d}/${m}/${y}` : s
}
