'use client'
import NavBar from '@/components/ui/NavBar'
import { META, CATEGORIES, ORDER } from '@/lib/meta'

const SECOES = [
  { title: 'O que é a SELIC e por que ela importa?', body: 'A taxa SELIC é o principal instrumento de política monetária do Brasil. Definida pelo Copom a cada 45 dias, ela influencia diretamente o custo do crédito, financiamentos, poupança e investimentos de renda fixa. Quando a inflação está alta, o Banco Central tende a subir a SELIC para conter o consumo; quando a economia desacelera, a SELIC tende a cair para estimular atividade.' },
  { title: 'IPCA vs IGP-M vs INPC: qual a diferença?', body: 'O IPCA é o índice oficial de inflação do Brasil, usado para a meta do governo, e mede o custo de vida de famílias com renda de 1 a 40 salários mínimos. O IGP-M é mais sensível a preços no atacado e câmbio, sendo usado em contratos de aluguel. Já o INPC foca em famílias de menor renda (até 5 salários mínimos), com peso maior em alimentação e transporte.' },
  { title: 'Por que o câmbio USD/BRL flutua tanto?', body: 'O real é uma moeda flutuante, ou seja, seu valor é determinado pelo mercado. Fatores como diferencial de juros entre Brasil e EUA, fluxo de capital estrangeiro, preço de commodities exportadas, e percepção de risco fiscal influenciam diretamente a cotação.' },
  { title: 'O que significa Dívida/PIB acima de 70%?', body: 'A relação Dívida/PIB mede o quanto o governo deve em comparação ao tamanho da economia. Não existe um limite "seguro" universal — países desenvolvidos costumam operar com índices mais altos sem grandes problemas, desde que a trajetória seja sustentável e a confiança dos credores se mantenha.' },
]

export default function Sobre() {
  return (
    <div className="relative z-10 flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-0)' }}>
      <header className="shrink-0" style={{ background: 'var(--bg-1)' }}>
        <NavBar live={true} active="sobre" />
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-5 max-w-4xl mx-auto w-full">
        <div>
          <h2 className="text-[18px] font-bold mb-1" style={{ color: 'var(--text-0)' }}>Entendendo a Economia Brasileira</h2>
          <p className="text-[12px]" style={{ color: 'var(--text-2)' }}>
            Um guia rápido sobre os indicadores monitorados neste painel e por que eles importam para a economia do dia a dia.
          </p>
        </div>

        {/* Categories overview */}
        <div className="grid grid-cols-3 gap-3">
          {CATEGORIES.map(cat => {
            const items = ORDER.filter(n => META[n].category === cat.key)
            return (
              <div key={cat.key} className="rounded-xl p-4" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                <div className="text-[12px] font-bold mb-2" style={{ color: 'var(--text-0)' }}>{cat.icon} {cat.label}</div>
                <div className="space-y-1.5">
                  {items.map(n => (
                    <div key={n} className="text-[10px] flex items-center gap-1.5" style={{ color: 'var(--text-2)' }}>
                      <span style={{ color: META[n].color }}>●</span> {META[n].label} — {META[n].desc}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* FAQ-style sections */}
        <div className="space-y-3">
          {SECOES.map((s, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
              <h3 className="text-[13px] font-bold mb-1.5" style={{ color: 'var(--text-0)' }}>{s.title}</h3>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-2)' }}>{s.body}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[9px] mb-4" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
          <span>📡 Fonte: API SGS — Banco Central do Brasil (bcb.gov.br) · gratuita · sem autenticação</span>
        </div>
      </main>
    </div>
  )
}
