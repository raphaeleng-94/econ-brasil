import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: 'Painel Econômico Brasil · Medallion ETL',
  description: 'Indicadores econômicos do Brasil — BCB/SGS via Bronze→Silver→Gold',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  )
}
