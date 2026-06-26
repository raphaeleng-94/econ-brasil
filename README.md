# 🇧🇷 Painel Econômico Brasil — Medallion ETL Pipeline

> Pipeline de dados end-to-end com arquitetura **Bronze → Silver → Gold**, ingestão automática diária via **GitHub Actions**, banco de dados em nuvem no **Supabase** e dashboard interativo publicado no **Vercel**.

**🔗 Dashboard ao vivo:** [econ-brasil.vercel.app](https://econ-brasil.vercel.app)

---

## 📊 Visão Geral

Este projeto demonstra um pipeline de engenharia de dados completo e produtivo, coletando **10 indicadores econômicos do Brasil** diretamente da API pública do Banco Central (BCB/SGS), processando-os em três camadas (medalion) e exibindo-os em um dashboard interativo com histórico desde 2000.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PIPELINE MEDALLION — INDICADORES BRASIL                  │
│                                                                              │
│  FONTE          BRONZE           SILVER           GOLD          DASHBOARD    │
│                                                                              │
│  BCB/SGS  ──►  Raw JSON    ──►  Limpo +    ──►  Agregado  ──►  Next.js     │
│  API REST       Supabase        Tipado           Mensal/        Vercel       │
│  (gratuita)     (10 séries)     PostgreSQL       Anual          Recharts     │
│                                                                              │
│  ⏰ Automação: GitHub Actions · todo dia às 06:00 BRT                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Arquitetura Completa

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   ┌─────────────┐    GitHub Actions (cron 09:00 UTC)                        │
│   │             │    ┌──────────────────────────────────────────────────┐   │
│   │  BCB / SGS  │    │                                                  │   │
│   │  API Pública│    │  1. ingest_bronze.py  ──── 🟤 BRONZE             │   │
│   │             │    │         │                                         │   │
│   │  10 séries: │    │         ▼                                         │   │
│   │  • SELIC    │───►│  2. transform_silver.py ─ ⚪ SILVER              │   │
│   │  • IPCA     │    │         │                                         │   │
│   │  • USD/BRL  │    │         ▼                                         │   │
│   │  • PIB      │    │  3. aggregate_gold.py ─── 🟡 GOLD               │   │
│   │  • IGP-M    │    │         │                                         │   │
│   │  • INPC     │    │         ▼                                         │   │
│   │  • Reservas │    │  4. run_tests.py ──────── ✅ Testes              │   │
│   │  • Dívida   │    │                                                  │   │
│   │  • Bal. Com.│    └──────────────────────────────────────────────────┘   │
│   │  • Crédito  │                        │                                  │
│   └─────────────┘                        ▼                                  │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────┐          │
│   │                    SUPABASE (PostgreSQL)                      │          │
│   │                                                              │          │
│   │  schema: bronze          schema: silver     schema: gold     │          │
│   │  ┌──────────────┐       ┌──────────────┐  ┌─────────────┐  │          │
│   │  │indicators_raw│──────►│indicators_   │─►│latest_      │  │          │
│   │  │              │       │clean         │  │indicators   │  │          │
│   │  │• series_name │       │              │  │             │  │          │
│   │  │• series_code │       │• reference_  │  │• value      │  │          │
│   │  │• reference_  │       │  date (DATE) │  │• updated_at │  │          │
│   │  │  date (TEXT) │       │• value       │  ├─────────────┤  │          │
│   │  │• raw_value   │       │  (NUMERIC)   │  │monthly_     │  │          │
│   │  │• raw_json    │       │• bronze_id   │  │summary      │  │          │
│   │  │• ingested_at │       │              │  │             │  │          │
│   │  │pipeline_log  │       └──────────────┘  │• avg/min/   │  │          │
│   │  └──────────────┘                          │  max/last   │  │          │
│   │                                            ├─────────────┤  │          │
│   │                                            │annual_      │  │          │
│   │                                            │summary      │  │          │
│   │                                            │• acum_value │  │          │
│   │                                            └─────────────┘  │          │
│   │                                                              │          │
│   │  schema: public (views expostas via PostgREST/API REST)      │          │
│   │  econ_latest  ──  econ_monthly  ──  econ_annual              │          │
│   └──────────────────────────────────────────────────────────────┘          │
│                                │                                             │
│                                ▼                                             │
│   ┌──────────────────────────────────────────────────────────────┐          │
│   │                DASHBOARD  (Next.js 14 + Vercel)              │          │
│   │                                                              │          │
│   │  ┌──────────────────────────────────────────────────────┐   │          │
│   │  │ 📡 TICKER  SELIC 10.50% · IPCA 0.38% · USD 5.12 ... │   │          │
│   │  └──────────────────────────────────────────────────────┘   │          │
│   │  ┌──────────┐  ┌───────────────────────────────────────┐   │          │
│   │  │ SIDEBAR  │  │   GRÁFICO HISTÓRICO (desde 2000)      │   │          │
│   │  │ • SELIC  │  │   ┌──────────────────────────────┐    │   │          │
│   │  │ • IPCA   │  │   │  Área empilhada + linha       │    │   │          │
│   │  │ • USD/BRL│  │   │  Brush para zoom              │    │   │          │
│   │  │ • PIB    │  │   │  Tooltip com min/max/média    │    │   │          │
│   │  │ • IGP-M  │  │   └──────────────────────────────┘    │   │          │
│   │  │ • INPC   │  │   [ Mensal ]  [ Anual ]               │   │          │
│   │  │ • ...    │  └───────────────────────────────────────┘   │          │
│   │  └──────────┘  ┌───────────────────────────────────────┐   │          │
│   │                │  MINI CARDS — todos os indicadores     │   │          │
│   │                └───────────────────────────────────────┘   │          │
│   └──────────────────────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 📈 Indicadores Monitorados

| Indicador | Série BCB | Descrição | Unidade |
|-----------|-----------|-----------|---------|
| **SELIC** | 11 | Taxa básica de juros do Brasil | % a.a. |
| **IPCA** | 433 | Inflação oficial (IBGE) | % a.m. |
| **USD/BRL** | 1 | Taxa de câmbio dólar americano | R$ |
| **PIB** | 7326 | Variação do PIB real | % trimestral |
| **IGP-M** | 189 | Índice Geral de Preços do Mercado | % a.m. |
| **INPC** | 188 | Índice Nacional de Preços ao Consumidor | % a.m. |
| **Reservas** | 13621 | Reservas internacionais | US$ milhões |
| **Dívida/PIB** | 4513 | Dívida bruta do governo geral | % do PIB |
| **Balança Comercial** | 22707 | Saldo exportações – importações | US$ milhões |
| **Crédito Total** | 20539 | Crédito total no sistema financeiro | R$ bilhões |

> **Fonte:** [API SGS — Banco Central do Brasil](https://www.bcb.gov.br/estabilidadefinanceira/reportdados) (pública, gratuita, sem autenticação)

---

## 🛠️ Stack Tecnológico

```
┌─────────────────┬──────────────────────────────────────────────┐
│ Camada          │ Tecnologia                                   │
├─────────────────┼──────────────────────────────────────────────┤
│ Ingestão        │ Python 3.11 + requests + psycopg2           │
│ Orquestração    │ GitHub Actions (cron diário)                 │
│ Transformação   │ Python + SQL (dbt-ready)                     │
│ Banco de Dados  │ Supabase (PostgreSQL 17) — São Paulo         │
│ API REST        │ Supabase PostgREST (views públicas)          │
│ Frontend        │ Next.js 14 (App Router) + TypeScript         │
│ Gráficos        │ Recharts (área empilhada, barra, brush)      │
│ Animações       │ Framer Motion                                │
│ Estilo          │ Tailwind CSS                                 │
│ Deploy          │ Vercel (CI/CD automático via GitHub)         │
│ Versionamento   │ GitHub                                       │
└─────────────────┴──────────────────────────────────────────────┘
```

---

## 🗄️ Modelo de Dados — Camadas Medallion

### 🟤 Bronze (dados brutos)
```sql
bronze.indicators_raw
├── id             BIGSERIAL PK
├── series_name    TEXT          -- ex: "selic_diaria"
├── series_code    INT           -- ex: 11
├── reference_date TEXT          -- formato original BCB: "01/06/2025"
├── raw_value      TEXT          -- valor bruto como string
├── raw_json       JSONB         -- payload completo da API
└── ingested_at    TIMESTAMPTZ

bronze.pipeline_log
├── id             BIGSERIAL PK
├── layer          TEXT          -- "bronze" | "silver" | "gold" | "tests"
├── status         TEXT          -- "success" | "partial" | "error"
├── records_loaded INT
└── executed_at    TIMESTAMPTZ
```

### ⚪ Silver (dados limpos e tipados)
```sql
silver.indicators_clean
├── id             BIGSERIAL PK
├── series_name    TEXT
├── series_code    INT
├── reference_date DATE          -- convertido para DATE nativo
├── value          NUMERIC(18,6) -- valor numérico parseado
├── bronze_id      BIGINT        -- rastreabilidade
└── processed_at   TIMESTAMPTZ
```

### 🟡 Gold (dados analíticos prontos para consumo)
```sql
gold.latest_indicators          -- último valor de cada série
├── series_name    TEXT PK
├── reference_date DATE
├── value          NUMERIC(18,6)
└── updated_at     TIMESTAMPTZ

gold.monthly_summary            -- resumo mensal histórico
├── series_name    TEXT
├── year           INT
├── month          INT
├── avg_value      NUMERIC(18,4)
├── min_value      NUMERIC(18,4)
├── max_value      NUMERIC(18,4)
├── last_value     NUMERIC(18,4)
└── updated_at     TIMESTAMPTZ

gold.annual_summary             -- resumo anual histórico
├── series_name    TEXT
├── year           INT
├── avg_value      NUMERIC(18,4)
├── min_value / max_value
├── acum_value     NUMERIC(18,4) -- acumulado anual
└── updated_at     TIMESTAMPTZ
```

---

## ⚙️ Pipeline de Dados — Fluxo Detalhado

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EXECUÇÃO DIÁRIA (06:00 BRT)                       │
│                                                                      │
│  PASSO 1: ingest_bronze.py                                           │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Para cada série (10 total):                                │    │
│  │    GET https://api.bcb.gov.br/dados/serie/bcdata.sgs.{N}/  │    │
│  │        dados?formato=json&dataInicial=01/01/2000            │    │
│  │    → DELETE FROM bronze.indicators_raw WHERE series=X       │    │
│  │    → INSERT registros brutos (texto, sem parsing)           │    │
│  │  Resultado: ~50.000–200.000 registros por série             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                          │                                           │
│                          ▼                                           │
│  PASSO 2: transform_silver.py                                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  TRUNCATE silver.indicators_clean                           │    │
│  │  Para cada registro bronze:                                 │    │
│  │    • parse_date("DD/MM/YYYY") → DATE                        │    │
│  │    • parse_float("1.234,56") → NUMERIC                      │    │
│  │    • Descarta nulos e valores inválidos                     │    │
│  │    • INSERT em batch                                        │    │
│  │  Regras de qualidade:                                       │    │
│  │    ✓ Sem datas futuras                                      │    │
│  │    ✓ Sem valores nulos                                      │    │
│  │    ✓ Rastreabilidade via bronze_id                          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                          │                                           │
│                          ▼                                           │
│  PASSO 3: aggregate_gold.py                                          │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  gold.latest_indicators:                                    │    │
│  │    DISTINCT ON (series_name) ORDER BY reference_date DESC   │    │
│  │                                                             │    │
│  │  gold.monthly_summary:                                      │    │
│  │    GROUP BY series_name, YEAR, MONTH                        │    │
│  │    → AVG, MIN, MAX, LAST (ARRAY_AGG DESC)[1]               │    │
│  │                                                             │    │
│  │  gold.annual_summary:                                       │    │
│  │    GROUP BY series_name, YEAR                               │    │
│  │    → AVG, MIN, MAX, SUM (acumulado)                        │    │
│  │  Todos com ON CONFLICT DO UPDATE (upsert)                   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                          │                                           │
│                          ▼                                           │
│  PASSO 4: run_tests.py — 8 testes de qualidade                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  [bronze] not_empty           → COUNT(*) > 0               │    │
│  │  [bronze] no_null_series      → COUNT(NULL) = 0            │    │
│  │  [silver] not_empty           → COUNT(*) > 0               │    │
│  │  [silver] no_null_value       → COUNT(NULL) = 0            │    │
│  │  [silver] no_future_dates     → datas futuras = 0          │    │
│  │  [gold]   latest_not_empty    → COUNT(*) > 0               │    │
│  │  [gold]   min_8_series        → >= 8 séries distintas      │    │
│  │  [gold]   monthly_not_empty   → COUNT(*) > 0               │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- Conta Supabase (gratuita)

### 1. Clone o repositório
```bash
git clone https://github.com/raphaeleng-94/econ-brasil.git
cd econ-brasil
```

### 2. Configure variáveis de ambiente
```bash
# Pipeline Python
export DB_HOST=db.<seu-projeto>.supabase.co
export DB_PORT=5432
export DB_NAME=postgres
export DB_USER=postgres
export DB_PASSWORD=<sua-senha>
```

### 3. Instale dependências Python
```bash
pip install requests psycopg2-binary loguru
```

### 4. Execute o pipeline manualmente
```bash
python pipeline/scripts/ingest_bronze.py
python pipeline/scripts/transform_silver.py
python pipeline/scripts/aggregate_gold.py
python pipeline/scripts/run_tests.py
```

### 5. Rode o dashboard
```bash
cd dashboard
npm install
cp .env.local.example .env.local  # adicione suas credenciais Supabase
npm run dev
# Acesse: http://localhost:3000
```

---

## 🤖 Automação — GitHub Actions

O pipeline roda automaticamente todo dia às **06:00 BRT (09:00 UTC)**:

```yaml
# .github/workflows/etl_pipeline.yml
on:
  schedule:
    - cron: '0 9 * * *'   # 06:00 Brasília
  workflow_dispatch:        # disparo manual disponível
```

**Secrets necessários no GitHub:**
| Secret | Descrição |
|--------|-----------|
| `DB_HOST` | Host do banco Supabase |
| `DB_PASSWORD` | Senha do banco de dados |

---

## 📁 Estrutura do Projeto

```
econ-brasil/
│
├── pipeline/
│   └── scripts/
│       ├── ingest_bronze.py      # Ingestão BCB/SGS → Bronze
│       ├── transform_silver.py   # Limpeza Bronze → Silver
│       ├── aggregate_gold.py     # Agregação Silver → Gold
│       └── run_tests.py          # 8 testes de qualidade
│
├── dashboard/                    # Next.js 14 App
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx              # Página principal
│   ├── components/
│   │   ├── charts/
│   │   │   ├── StackedChart.tsx  # Histórico mensal com brush/zoom
│   │   │   └── AnnualBar.tsx     # Resumo anual com barras
│   │   └── ui/
│   │       └── Ticker.tsx        # Barra scrolling com últimos valores
│   ├── lib/
│   │   ├── supabase.ts           # Client + fetchers
│   │   └── meta.ts               # Metadados, cores, formatadores
│   └── vercel.json
│
├── .github/
│   └── workflows/
│       └── etl_pipeline.yml      # CI/CD automático
│
└── README.md
```

---

## 🎨 Dashboard — Funcionalidades

| Funcionalidade | Descrição |
|---------------|-----------|
| **Ticker animado** | Barra superior com scroll automático exibindo os últimos valores de todos os indicadores |
| **Sidebar navegável** | Lista todos os 10 indicadores com último valor e data; clique para selecionar |
| **KPI cards** | Último valor, média anual, mínimo e máximo histórico |
| **Gráfico histórico** | Histórico completo desde 2000 com área empilhada (min/max) e linha central |
| **Zoom interativo** | Brush no gráfico para navegar qualquer período |
| **Visão mensal/anual** | Alterna entre granularidade mensal e resumo anual por barra |
| **Mini cards** | Grade com todos os indicadores para comparação rápida |
| **Animações** | Transições suaves ao trocar de indicador (Framer Motion) |

---

## 📊 Governança de Dados

- **Rastreabilidade:** Todo registro silver referencia seu `bronze_id`
- **Idempotência:** Pipeline pode ser reexecutado sem duplicar dados (truncate + reload no bronze/silver, upsert no gold)
- **Auditoria:** `bronze.pipeline_log` registra execução, camada, status e quantidade de registros
- **Qualidade:** 8 testes automatizados após cada execução
- **Imutabilidade bronze:** Dados brutos preservados como JSON antes de qualquer transformação

---

## 🔗 Links

- **Dashboard:** [econ-brasil.vercel.app](https://econ-brasil.vercel.app)
- **Repositório:** [github.com/raphaeleng-94/econ-brasil](https://github.com/raphaeleng-94/econ-brasil)
- **API BCB/SGS:** [api.bcb.gov.br](https://api.bcb.gov.br)
- **Supabase:** [supabase.com](https://supabase.com)

---

*Projeto de portfólio em Engenharia de Dados — demonstra pipeline ETL completo, arquitetura medallion, automação CI/CD e dashboard analítico interativo.*
