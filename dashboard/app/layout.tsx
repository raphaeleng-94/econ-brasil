import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Painel Econômico Brasil · Medallion ETL',
  description: 'Indicadores econômicos do Brasil em tempo real — BCB/SGS via pipeline Bronze→Silver→Gold',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full">{children}</body>
    </html>
  )
}
