-- Arquitetura Medallion: schemas bronze, silver, gold
CREATE SCHEMA IF NOT EXISTS bronze;
CREATE SCHEMA IF NOT EXISTS silver;
CREATE SCHEMA IF NOT EXISTS gold;

CREATE TABLE bronze.indicators_raw (
  id BIGSERIAL PRIMARY KEY,
  series_name TEXT NOT NULL,
  series_code INT NOT NULL,
  reference_date TEXT NOT NULL,
  raw_value TEXT,
  raw_json JSONB,
  ingested_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bronze.pipeline_log (
  id BIGSERIAL PRIMARY KEY,
  layer TEXT,
  status TEXT,
  records_loaded INT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE silver.indicators_clean (
  id BIGSERIAL PRIMARY KEY,
  series_name TEXT NOT NULL,
  series_code INT,
  reference_date DATE NOT NULL,
  value NUMERIC(18,6),
  bronze_id BIGINT,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gold.latest_indicators (
  series_name TEXT PRIMARY KEY,
  series_code INT,
  reference_date DATE,
  value NUMERIC(18,6),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gold.monthly_summary (
  id BIGSERIAL PRIMARY KEY,
  series_name TEXT NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  avg_value NUMERIC(18,4),
  min_value NUMERIC(18,4),
  max_value NUMERIC(18,4),
  last_value NUMERIC(18,4),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(series_name, year, month)
);

CREATE TABLE gold.annual_summary (
  id BIGSERIAL PRIMARY KEY,
  series_name TEXT NOT NULL,
  year INT NOT NULL,
  avg_value NUMERIC(18,4),
  min_value NUMERIC(18,4),
  max_value NUMERIC(18,4),
  acum_value NUMERIC(18,4),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(series_name, year)
);
