-- Views públicas (PostgREST só expõe schema public por padrão)
CREATE OR REPLACE VIEW public.econ_latest  AS SELECT * FROM gold.latest_indicators;
CREATE OR REPLACE VIEW public.econ_monthly AS SELECT * FROM gold.monthly_summary;
CREATE OR REPLACE VIEW public.econ_annual  AS SELECT * FROM gold.annual_summary;

GRANT USAGE ON SCHEMA bronze, silver, gold TO anon, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA bronze TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA silver TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA gold   TO anon;
GRANT SELECT ON public.econ_latest, public.econ_monthly, public.econ_annual TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA bronze TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA silver TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA gold   TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA bronze TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA silver TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA gold   TO service_role;

-- RPC: Silver — limpeza e tipagem (chamado pela Edge Function)
CREATE OR REPLACE FUNCTION public.pipeline_run_silver()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE n int;
BEGIN
  TRUNCATE silver.indicators_clean;
  INSERT INTO silver.indicators_clean(series_name,series_code,reference_date,value,bronze_id,processed_at)
  SELECT series_name, series_code,
    CASE WHEN reference_date ~ '^\d{2}/\d{2}/\d{4}$'
         THEN TO_DATE(reference_date,'DD/MM/YYYY')
         ELSE reference_date::DATE END,
    REPLACE(raw_value,',','.')::NUMERIC, id, NOW()
  FROM bronze.indicators_raw
  WHERE raw_value IS NOT NULL AND raw_value != ''
    AND raw_value ~ '^-?[0-9]+([.,][0-9]+)?$';
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO bronze.pipeline_log(layer,status,records_loaded,executed_at)
  VALUES('silver','success',n,NOW());
  RETURN n;
END;
$$;

-- RPC: Gold — agregação analítica (chamado pela Edge Function)
CREATE OR REPLACE FUNCTION public.pipeline_run_gold()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO gold.latest_indicators(series_name,series_code,reference_date,value,updated_at)
  SELECT DISTINCT ON(series_name) series_name,series_code,reference_date,value,NOW()
  FROM silver.indicators_clean ORDER BY series_name,reference_date DESC
  ON CONFLICT(series_name) DO UPDATE SET
    reference_date=EXCLUDED.reference_date,value=EXCLUDED.value,updated_at=NOW();

  INSERT INTO gold.monthly_summary(series_name,year,month,avg_value,min_value,max_value,last_value,updated_at)
  SELECT series_name,
    EXTRACT(YEAR FROM reference_date)::int, EXTRACT(MONTH FROM reference_date)::int,
    ROUND(AVG(value)::numeric,4), ROUND(MIN(value)::numeric,4),
    ROUND(MAX(value)::numeric,4), (ARRAY_AGG(value ORDER BY reference_date DESC))[1], NOW()
  FROM silver.indicators_clean
  GROUP BY series_name,EXTRACT(YEAR FROM reference_date)::int,EXTRACT(MONTH FROM reference_date)::int
  ON CONFLICT(series_name,year,month) DO UPDATE SET
    avg_value=EXCLUDED.avg_value,min_value=EXCLUDED.min_value,
    max_value=EXCLUDED.max_value,last_value=EXCLUDED.last_value,updated_at=NOW();

  INSERT INTO gold.annual_summary(series_name,year,avg_value,min_value,max_value,acum_value,updated_at)
  SELECT series_name, EXTRACT(YEAR FROM reference_date)::int,
    ROUND(AVG(value)::numeric,4), ROUND(MIN(value)::numeric,4),
    ROUND(MAX(value)::numeric,4), ROUND(SUM(value)::numeric,4), NOW()
  FROM silver.indicators_clean
  GROUP BY series_name, EXTRACT(YEAR FROM reference_date)::int
  ON CONFLICT(series_name,year) DO UPDATE SET
    avg_value=EXCLUDED.avg_value,min_value=EXCLUDED.min_value,
    max_value=EXCLUDED.max_value,acum_value=EXCLUDED.acum_value,updated_at=NOW();

  INSERT INTO bronze.pipeline_log(layer,status,records_loaded,executed_at)
  VALUES('gold','success',0,NOW());
END;
$$;

GRANT EXECUTE ON FUNCTION public.pipeline_run_silver() TO service_role;
GRANT EXECUTE ON FUNCTION public.pipeline_run_gold()   TO service_role;
