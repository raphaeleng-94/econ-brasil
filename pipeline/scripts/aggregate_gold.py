"""Gold Layer - Tabelas analiticas"""
import os, psycopg2
from loguru import logger

DB = dict(host=os.environ["DB_HOST"],port=os.environ.get("DB_PORT","5432"),
    dbname=os.environ.get("DB_NAME","postgres"),user=os.environ.get("DB_USER","postgres"),
    password=os.environ["DB_PASSWORD"],sslmode="require")

SQLS = {
"latest_indicators": """
    INSERT INTO gold.latest_indicators(series_name,series_code,reference_date,value,updated_at)
    SELECT DISTINCT ON(series_name) series_name,series_code,reference_date,value,NOW()
    FROM silver.indicators_clean ORDER BY series_name,reference_date DESC
    ON CONFLICT(series_name) DO UPDATE SET
      reference_date=EXCLUDED.reference_date,value=EXCLUDED.value,updated_at=NOW()
""",
"monthly_summary": """
    INSERT INTO gold.monthly_summary(series_name,year,month,avg_value,min_value,max_value,last_value,updated_at)
    SELECT series_name,
      EXTRACT(YEAR FROM reference_date)::int,EXTRACT(MONTH FROM reference_date)::int,
      ROUND(AVG(value)::numeric,4),ROUND(MIN(value)::numeric,4),ROUND(MAX(value)::numeric,4),
      (ARRAY_AGG(value ORDER BY reference_date DESC))[1],NOW()
    FROM silver.indicators_clean
    GROUP BY series_name,EXTRACT(YEAR FROM reference_date)::int,EXTRACT(MONTH FROM reference_date)::int
    ON CONFLICT(series_name,year,month) DO UPDATE SET
      avg_value=EXCLUDED.avg_value,min_value=EXCLUDED.min_value,
      max_value=EXCLUDED.max_value,last_value=EXCLUDED.last_value,updated_at=NOW()
""",
"annual_summary": """
    INSERT INTO gold.annual_summary(series_name,year,avg_value,min_value,max_value,acum_value,updated_at)
    SELECT series_name,EXTRACT(YEAR FROM reference_date)::int,
      ROUND(AVG(value)::numeric,4),ROUND(MIN(value)::numeric,4),
      ROUND(MAX(value)::numeric,4),ROUND(SUM(value)::numeric,4),NOW()
    FROM silver.indicators_clean
    GROUP BY series_name,EXTRACT(YEAR FROM reference_date)::int
    ON CONFLICT(series_name,year) DO UPDATE SET
      avg_value=EXCLUDED.avg_value,min_value=EXCLUDED.min_value,
      max_value=EXCLUDED.max_value,acum_value=EXCLUDED.acum_value,updated_at=NOW()
"""
}

def run():
    logger.info("=== GOLD ===")
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()
    total = 0
    for name, sql in SQLS.items():
        cur.execute(sql); n=cur.rowcount; total+=n
        logger.info(f"  {name}: {n}")
    cur.execute("INSERT INTO bronze.pipeline_log(layer,status,records_loaded,executed_at) VALUES('gold','success',%s,NOW())",(total,))
    conn.commit(); conn.close()
    logger.success(f"Gold: {total} linhas")

if __name__ == "__main__":
    run()
