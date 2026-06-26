export const SERIES_META: Record<string, {
  label: string; unit: string; color: string; desc: string; icon: string; format: 'pct'|'brl'|'usd'|'num'
}> = {
  selic_diaria:   { label:'SELIC',         unit:'% a.a.',    color:'#00d4ff', desc:'Taxa básica de juros',         icon:'📈', format:'pct' },
  ipca_mensal:    { label:'IPCA',          unit:'% a.m.',    color:'#ff6b35', desc:'Inflação oficial (IBGE)',       icon:'🔥', format:'pct' },
  cambio_usd:     { label:'USD/BRL',       unit:'R$',        color:'#39ff14', desc:'Câmbio dólar americano',       icon:'💵', format:'brl' },
  pib_trimestral: { label:'PIB',           unit:'% trim.',   color:'#bd10e0', desc:'Variação do PIB real',         icon:'📊', format:'pct' },
  igpm_mensal:    { label:'IGP-M',         unit:'% a.m.',    color:'#ffcc00', desc:'Índice Geral de Preços',       icon:'📉', format:'pct' },
  inpc_mensal:    { label:'INPC',          unit:'% a.m.',    color:'#ff4488', desc:'Índice Nacional Preços',       icon:'🛒', format:'pct' },
  reservas_int:   { label:'Reservas',      unit:'US$ mi',    color:'#00ff88', desc:'Reservas internacionais',      icon:'🏦', format:'usd' },
  divida_pib:     { label:'Dívida/PIB',    unit:'%',         color:'#ff4444', desc:'Dívida bruta do governo',      icon:'⚠️',  format:'pct' },
  saldo_bc:       { label:'Bal. Comercial',unit:'US$ mi',    color:'#4488ff', desc:'Saldo balança comercial',      icon:'⚖️',  format:'usd' },
  credito_total:  { label:'Crédito',       unit:'R$ bi',     color:'#ff88ff', desc:'Crédito total no sistema',     icon:'💳', format:'brl' },
}

export function fmtValue(v: number | null | undefined, format: string): string {
  if (v == null) return '—'
  if (format === 'pct') return `${v.toFixed(2)}%`
  if (format === 'brl') return `R$ ${v.toFixed(2)}`
  if (format === 'usd') return `US$ ${(v/1000).toFixed(1)}bi`
  return v.toLocaleString('pt-BR',{maximumFractionDigits:2})
}

export function fmtDate(s: string): string {
  if (!s) return ''
  const [y,m,d] = s.split('-')
  return d ? `${d}/${m}/${y}` : s
}
