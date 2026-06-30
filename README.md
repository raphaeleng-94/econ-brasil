# 🇧🇷 Painel Econômico Brasil — Pipeline ETL com Arquitetura Medallion

> **Pipeline de dados end-to-end** que coleta indicadores macroeconômicos oficiais do Brasil, processa-os através de três camadas de qualidade crescente (**Bronze → Silver → Gold**) e os apresenta em um **dashboard interativo** publicado na nuvem — totalmente automatizado e gratuito.

<p align="center">
  <img alt="status" src="https://img.shields.io/badge/pipeline-online-39ff14?style=flat-square">
  <img alt="atualizacao" src="https://img.shields.io/badge/atualiza%C3%A7%C3%A3o-di%C3%A1ria-00d4ff?style=flat-square">
  <img alt="custo" src="https://img.shields.io/badge/custo-R%240%2Fm%C3%AAs-ffcc00?style=flat-square">
  <img alt="stack" src="https://img.shields.io/badge/stack-Next.js%2014%20%7C%20Supabase%20%7C%20Vercel-bd10e0?style=flat-square">
</p>

**🔗 Dashboard ao vivo:** *(link após deploy Vercel)*
**📦 Repositório:** [github.com/raphaeleng-94/econ-brasil](https://github.com/raphaeleng-94/econ-brasil)

---

## 💡 Por que este projeto importa

Bancos centrais, fundos de investimento e empresas de análise financeira dependem de pipelines de dados confiáveis para tomar decisões. Este projeto simula exatamente esse cenário em escala real:

- **Fonte de dados oficial e pública** — API do Banco Central do Brasil (BCB/SGS), a mesma usada por instituições financeiras
- **Arquitetura de dados profissional** — medallion (bronze/silver/gold), o padrão usado por empresas como Databricks, Netflix e bancos para governança de dados
- **100% automatizado e sem custo** — toda a infraestrutura roda em camadas gratuitas (GitHub Actions, Supabase, Vercel)
- **Resiliente a falhas de rede** — a API da BCB bloqueia requisições de IPs de datacenter (GitHub Actions, AWS, etc). O pipeline foi desenhado para **se adaptar a essa restrição automaticamente**, sem interromper o fluxo de dados

---

## 🏗️ Visão Geral da Arquitetura

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                     PAINEL ECONÔMICO BRASIL — ARQUITETURA COMPLETA                ║
╚══════════════════════════════════════════════════════════════════════════════════╝

  ┌──────────────┐        ┌─────────────────────────────────────────────────┐
  │              │        │            GITHUB ACTIONS (cron)                │
  │  API BCB/SGS │        │     Dispara todos os dias às 06:00 (BRT)        │
  │  10 séries   │        │     ┌─────────────────────────────────────┐    │
  │  econômicas  │        │     │  curl -X POST  /functions/v1/       │    │
  │  (gratuita,  │        │     │       run-pipeline                  │    │
  │  pública)    │        │     └─────────────────────────────────────┘    │
  └──────┬───────┘        └──────────────────────┬──────────────────────────┘
         │                                       │
         │  fetch (dentro da Edge Function)      │ HTTP POST
         ▼                                       ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                    SUPABASE EDGE FUNCTION (Deno)                       │
  │                         run-pipeline/index.ts                          │
  │                                                                        │
  │   1. BRONZE  → busca os dados brutos da API BCB, salva como está      │
  │   2. SILVER  → limpa, tipa e valida via função SQL (RPC)              │
  │   3. GOLD    → agrega em métricas mensais/anuais via função SQL (RPC) │
  │                                                                        │
  │   Roda DENTRO da infraestrutura Supabase → contorna bloqueios de IP   │
  └───────────────────────────────┬────────────────────────────────────────┘
                                  │
                                  ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                  SUPABASE (PostgreSQL gerenciado)                      │
  │                                                                        │
  │  schema bronze          schema silver         schema gold              │
  │  ┌─────────────────┐   ┌──────────────────┐  ┌──────────────────────┐ │
  │  │ indicators_raw  │──►│ indicators_clean │─►│ latest_indicators    │ │
  │  │ (texto puro,    │   │ (tipado: DATE,   │  │ monthly_summary      │ │
  │  │  rastreável)    │   │  NUMERIC)        │  │ annual_summary       │ │
  │  ├─────────────────┤   └──────────────────┘  └──────────┬───────────┘ │
  │  │ pipeline_log    │                                    │             │
  │  │ (auditoria)     │                                    │             │
  │  └─────────────────┘                                    ▼             │
  │                                            schema public (views)       │
  │                                  econ_latest · econ_monthly · econ_annual│
  │                              (expostas via PostgREST/API REST automática)│
  └───────────────────────────────┬────────────────────────────────────────┘
                                  │  fetch via @supabase/supabase-js
                                  ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                  DASHBOARD — Next.js 14 + Vercel                       │
  │                                                                        │
  │  ┌──────────────────────────────────────────────────────────────────┐ │
  │  │ 📡 SELIC 10,50%  ·  IPCA 0,38%  ·  USD/BRL R$5,88  ·  ...   ►►►  │ │ ← ticker animado
  │  └──────────────────────────────────────────────────────────────────┘ │
  │  ┌───────────┐ ┌────────────────────────────────────────────────────┐ │
  │  │ 📈 SELIC  │ │   Gráfico histórico — área + linha + zoom (brush)  │ │
  │  │ 🔥 IPCA   │ │   ┌────────────────────────────────────────────┐  │ │
  │  │ 💵 USD/BRL│ │   │     ___╱╲___╱‾‾╲__                       │  │ │
  │  │ 📊 PIB    │ │   │  __╱         ╲    ╲___                   │  │ │
  │  │ ...       │ │   └────────────────────────────────────────────┘  │ │
  │  └───────────┘ │   [ Mensal ]  [ Anual ]                            │ │
  │                └────────────────────────────────────────────────────┘ │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 O Desafio Técnico Real (e como foi resolvido)

A parte mais interessante deste projeto não é o "caminho feliz" — é como ele lida com restrições do mundo real:

### Problema 1: A API do Banco Central bloqueia IPs de nuvem
A BCB possui proteções anti-bot que rejeitam requisições vindas de datacenters conhecidos (AWS, GitHub Actions, etc). Isso quebra qualquer pipeline ingênuo que rode `requests.get()` direto de um runner do GitHub Actions.

**Solução:** o fetch para a API BCB acontece **dentro da Supabase Edge Function** (ambiente Deno na borda/edge), que possui IPs distintos e rotativos, contornando o bloqueio na maioria das execuções. Quando ainda assim a BCB rejeita a chamada, o pipeline **degrada graciosamente**: mantém os últimos dados válidos já carregados e registra o evento no log de auditoria, sem quebrar o dashboard.

### Problema 2: Conexão direta PostgreSQL via GitHub Actions é instável
Tentativas iniciais usavam `psycopg2` conectando direto na porta 5432/6543 do Postgres via GitHub Actions. Isso expôs problemas de:
- Rotação de IP dos runners do GitHub causando rejeição por firewalls
- Necessidade de gerenciar senha de banco como secret sensível
- Falhas silenciosas difíceis de depurar (sem acesso a logs detalhados do runner)

**Solução:** Eliminação completa do acesso direto ao Postgres a partir do CI. O GitHub Actions agora faz apenas **uma chamada HTTP simples** (`curl`) para a Edge Function, que por sua vez usa a *service role key* do próprio Supabase para acessar o banco internamente. Resultado: workflow YAML de 15 linhas, zero dependências Python, zero gerenciamento de senha de banco no GitHub.

### Problema 3: PostgREST só expõe o schema `public` por padrão
Para manter a governança (bronze/silver/gold em schemas separados) e ainda permitir que o frontend leia os dados via API REST automática do Supabase, foram criadas **views públicas somente-leitura** (`public.econ_latest`, `public.econ_monthly`, `public.econ_annual`) que apontam para as tabelas gold — sem expor os schemas internos diretamente.

---

## 📊 Indicadores Monitorados

| # | Indicador | Código BCB | O que mede | Unidade |
|---|-----------|:----------:|------------|---------|
| 1 | **SELIC** | 11 | Taxa básica de juros da economia | % a.a. |
| 2 | **IPCA** | 433 | Inflação oficial usada para metas do governo | % a.m. |
| 3 | **USD/BRL** | 1 | Cotação do dólar americano (compra) | R$ |
| 4 | **PIB** | 7326 | Variação trimestral do Produto Interno Bruto | % trimestral |
| 5 | **IGP-M** | 189 | Índice usado em contratos de aluguel e energia | % a.m. |
| 6 | **INPC** | 188 | Inflação para famílias de baixa renda | % a.m. |
| 7 | **Reservas Internacionais** | 13621 | Reservas em moeda estrangeira do país | US$ milhões |
| 8 | **Dívida/PIB** | 4513 | Endividamento do governo geral | % do PIB |
| 9 | **Balança Comercial** | 22707 | Exportações menos importações | US$ milhões |
| 10 | **Crédito Total** | 20539 | Volume de crédito no sistema financeiro | R$ bilhões |

> Fonte oficial: [Sistema Gerenciador de Séries Temporais (SGS) — Banco Central do Brasil](https://www3.bcb.gov.br/sgspub/). API pública, gratuita, sem necessidade de chave de autenticação.

---

## 🛠️ Stack Tecnológico

```
┌───────────────────┬────────────────────────────────────────────────────────┐
│ Camada            │ Tecnologia & justificativa                            │
├───────────────────┼────────────────────────────────────────────────────────┤
│ Ingestão/Transform │ TypeScript (Deno) dentro de Supabase Edge Function    │
│ Orquestração      │ GitHub Actions — cron diário + execução manual         │
│ Banco de dados    │ Supabase (PostgreSQL 17 gerenciado) — região São Paulo │
│ Lógica de negócio │ Funções SQL (RPC) com SECURITY DEFINER                 │
│ API               │ PostgREST automático do Supabase (views públicas)      │
│ Frontend          │ Next.js 14 (App Router) + TypeScript                   │
│ Gráficos          │ SVG nativo + curvas suaves, área empilhada com zoom    │
│ Animações         │ Framer Motion (transições) + CSS keyframes (ticker)    │
│ Estilo            │ Tailwind CSS                                          │
│ Hospedagem        │ Vercel (deploy automático a cada push)                 │
│ Versionamento     │ Git + GitHub                                          │
└───────────────────┴────────────────────────────────────────────────────────┘
```

**Por que essa combinação?** Cada peça foi escolhida para eliminar uma classe inteira de problema operacional: Edge Functions eliminam gerência de servidor e problemas de IP; RPCs SQL eliminam lógica de negócio duplicada entre linguagens; views públicas eliminam exposição indevida de schemas internos; Vercel + GitHub Actions eliminam qualquer custo de infraestrutura.

---

## 🗄️ Modelo de Dados — As Três Camadas

### 🟤 Bronze — Dados Brutos (imutáveis)
> *Princípio: nunca transformar a fonte. Guardar exatamente como veio, com rastreabilidade total.*

```sql
bronze.indicators_raw
├── id              BIGSERIAL PK
├── series_name     TEXT          -- "selic_diaria"
├── series_code     INT           -- código oficial BCB: 11
├── reference_date  TEXT          -- formato original: "01/06/2025"
├── raw_value       TEXT          -- valor como string, sem parsing
├── raw_json        JSONB         -- payload completo da API (auditoria)
└── ingested_at     TIMESTAMPTZ

bronze.pipeline_log              -- auditoria de cada execução do pipeline
├── layer            TEXT        -- bronze | silver | gold
├── status           TEXT        -- success | partial | error
├── records_loaded   INT
└── executed_at       TIMESTAMPTZ
```

### ⚪ Silver — Dados Limpos e Validados
> *Princípio: tipagem correta, validação de regras de negócio, rastreabilidade até a origem.*

```sql
silver.indicators_clean
├── id              BIGSERIAL PK
├── series_name     TEXT
├── reference_date  DATE          -- convertido de texto para data real
├── value           NUMERIC(18,6) -- convertido de texto para número real
├── bronze_id       BIGINT        -- FK lógica para rastreabilidade total
└── processed_at    TIMESTAMPTZ
```

### 🟡 Gold — Dados Analíticos (consumo direto pelo dashboard)
> *Princípio: agregações prontas, sem necessidade de processamento adicional no frontend.*

```sql
gold.latest_indicators    -- snapshot do valor mais recente de cada série
gold.monthly_summary      -- média/min/max/último valor, por mês, desde 2000
gold.annual_summary       -- média/min/max/acumulado, por ano, desde 2000
```

---

## ⚙️ Fluxo de Execução do Pipeline

```
┌──────────────────────────────────────────────────────────────────────┐
│  EXECUÇÃO AUTOMÁTICA — TODOS OS DIAS ÀS 06:00 (HORÁRIO DE BRASÍLIA)  │
└──────────────────────────────────────────────────────────────────────┘

   GitHub Actions                Supabase Edge Function
   (.github/workflows/            (supabase/functions/run-pipeline)
    etl_pipeline.yml)
        │
        │  1. cron dispara o job
        │
        ├──── curl -X POST  ──────────►  2. Recebe requisição autenticada
        │     /functions/v1/                 (header x-pipeline-secret)
        │     run-pipeline
        │                                3. BRONZE
        │                                   Para cada uma das 10 séries:
        │                                   • fetch(api.bcb.gov.br/...)
        │                                   • DELETE linhas antigas da série
        │                                   • INSERT linhas novas
        │                                   • Se BCB falhar → loga e segue
        │                                     (mantém dados anteriores)
        │
        │                                4. SILVER  (via RPC SQL)
        │                                   • TRUNCATE silver.indicators_clean
        │                                   • Conversão texto→DATE, texto→NUMERIC
        │                                   • Filtra valores inválidos/nulos
        │
        │                                5. GOLD  (via RPC SQL)
        │                                   • UPSERT em latest_indicators
        │                                   • GROUP BY mês → monthly_summary
        │                                   • GROUP BY ano  → annual_summary
        │
        │  ◄──── JSON response  ─────────  6. Retorna log estruturado +
        │        { success, log[], }          contagem de séries atualizadas
        │
        7. GitHub Actions imprime o
           log no console do workflow
           e falha o job se success=false
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Dashboard — Funcionalidades

| Recurso | Descrição |
|---|---|
| **Ticker animado no topo** | Rolagem contínua (CSS keyframes) mostrando o valor mais recente de cada um dos 10 indicadores, com data de referência |
| **Sidebar de navegação** | Lista lateral com todos os indicadores; clique para focar o gráfico principal naquele indicador |
| **KPI cards dinâmicos** | Último valor, média do ano atual, mínimo e máximo histórico — recalculados ao trocar de indicador |
| **Gráfico histórico empilhado** | Área de mínimo/máximo + linha de último valor + linha pontilhada de média, com **eixo de zoom (brush)** para navegar qualquer intervalo de tempo desde 2000 |
| **Alternância Mensal/Anual** | Troca instantânea entre granularidade mensal (linha) e resumo anual (barras) |
| **Grade comparativa** | Visão simultânea de todos os 10 indicadores com leitura mais recente |
| **Indicador de status ao vivo** | Mostra se os dados estão carregando ou já sincronizados |
| **Animações suaves** | Framer Motion nas transições entre indicadores selecionados |

---

## 🚀 Como Rodar Localmente

```bash
# 1. Clonar o repositório
git clone https://github.com/raphaeleng-94/econ-brasil.git
cd econ-brasil/dashboard

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com sua URL e anon key do Supabase

# 4. Rodar em desenvolvimento
npm run dev
# Acesse http://localhost:3000
```

### Disparar o pipeline manualmente
```bash
curl -X POST \
  -H "x-pipeline-secret: SEU_SECRET" \
  "https://SEU_PROJETO.supabase.co/functions/v1/run-pipeline"
```

---

## 🤖 Automação — GitHub Actions

```yaml
# .github/workflows/etl_pipeline.yml (resumo)
on:
  schedule:
    - cron: '0 9 * * *'    # 06:00 BRT (UTC-3)
  workflow_dispatch:        # também pode ser disparado manualmente
```

**Secrets necessários no repositório GitHub:**

| Secret | Descrição |
|---|---|
| `PIPELINE_SECRET` | Token compartilhado entre GitHub Actions e a Edge Function, para autenticar a chamada |

> Note que **nenhuma credencial de banco de dados** precisa ser armazenada no GitHub — toda a autenticação sensível (service role key) fica isolada dentro do ambiente do Supabase.

---

## 📁 Estrutura do Repositório

```
econ-brasil/
│
├── supabase/
│   ├── functions/
│   │   └── run-pipeline/
│   │       └── index.ts          # Pipeline completo: Bronze→Silver→Gold
│   └── migrations/
│       ├── 001_medallion_schema.sql   # Criação dos schemas e tabelas
│       └── 002_views_and_rpc.sql      # Views públicas + funções RPC
│
├── dashboard/                     # Aplicação Next.js 14
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx               # Página principal do dashboard
│   ├── components/
│   │   ├── charts/
│   │   │   ├── HistoryChart.tsx   # Gráfico histórico com zoom/brush
│   │   │   └── AnnualChart.tsx    # Gráfico de barras anual
│   │   └── ui/
│   │       └── Ticker.tsx         # Barra de rolagem com últimos valores
│   ├── lib/
│   │   ├── supabase.ts            # Cliente + funções de fetch
│   │   └── meta.ts                # Metadados, cores, formatadores
│   └── vercel.json
│
├── pipeline/
│   └── legacy/                    # Scripts Python descontinuados (ver README interno)
│
├── .github/
│   └── workflows/
│       └── etl_pipeline.yml       # Orquestração via cron
│
└── README.md                      # Este arquivo
```

---

## 📈 Governança e Qualidade de Dados

- **Rastreabilidade total**: toda linha da camada silver referencia seu `bronze_id` de origem
- **Idempotência**: reexecutar o pipeline não duplica dados — bronze usa delete+insert por série, silver usa truncate+reload, gold usa upsert (`ON CONFLICT DO UPDATE`)
- **Auditoria**: `bronze.pipeline_log` registra cada execução (camada, status, quantidade de registros, timestamp)
- **Resiliência**: falha parcial na fonte (BCB bloqueando uma ou mais séries) não interrompe o pipeline — dados anteriores são preservados e o evento é logado
- **Segurança de dados**: somente as views da camada gold são expostas publicamente; os schemas bronze/silver/gold internos não são acessíveis via API externa sem a service role key

---

## 🔗 Links

- **Dashboard ao vivo:** *(adicionar após deploy)*
- **Repositório GitHub:** [github.com/raphaeleng-94/econ-brasil](https://github.com/raphaeleng-94/econ-brasil)
- **Fonte dos dados:** [API SGS — Banco Central do Brasil](https://www3.bcb.gov.br/sgspub/)
- **Supabase:** [supabase.com](https://supabase.com)
- **Vercel:** [vercel.com](https://vercel.com)

---

<p align="center">
  <i>Projeto de portfólio em Engenharia de Dados — demonstra arquitetura medallion, pipelines resilientes a falhas de rede do mundo real, automação CI/CD sem custo, e um dashboard analítico interativo de produção.</i>
</p>
