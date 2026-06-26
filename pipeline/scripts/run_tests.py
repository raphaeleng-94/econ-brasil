"""Data Quality Tests"""
import os, psycopg2, sys
from loguru import logger

DB = dict(host=os.environ["DB_HOST"],port=os.environ.get("DB_PORT","5432"),
    dbname=os.environ.get("DB_NAME","postgres"),user=os.environ.get("DB_USER","postgres"),
    password=os.environ["DB_PASSWORD"],sslmode="require")

TESTS = [
    ("bronze","not_empty","SELECT COUNT(*) FROM bronze.indicators_raw",">0"),
    ("bronze","no_null","SELECT COUNT(*) FROM bronze.indicators_raw WHERE series_name IS NULL","=0"),
    ("silver","not_empty","SELECT COUNT(*) FROM silver.indicators_clean",">0"),
    ("silver","no_null_value","SELECT COUNT(*) FROM silver.indicators_clean WHERE value IS NULL","=0"),
    ("silver","no_future","SELECT COUNT(*) FROM silver.indicators_clean WHERE reference_date>CURRENT_DATE","=0"),
    ("gold","latest_not_empty","SELECT COUNT(*) FROM gold.latest_indicators",">0"),
    ("gold","min_8_series","SELECT CASE WHEN COUNT(DISTINCT series_name)>=8 THEN 1 ELSE 0 END FROM gold.latest_indicators",">0"),
    ("gold","monthly_not_empty","SELECT COUNT(*) FROM gold.monthly_summary",">0"),
]

def run():
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()
    ok, fail = 0, 0
    for layer, check, sql, cond in TESTS:
        try:
            cur.execute(sql); val=cur.fetchone()[0]
            if eval(f"{val}{cond}"): logger.success(f"✅ [{layer}] {check}: {val}"); ok+=1
            else: logger.error(f"❌ [{layer}] {check}: {val}"); fail+=1
        except Exception as e:
            logger.error(f"❌ [{layer}] {check}: {e}"); fail+=1
    cur.execute("INSERT INTO bronze.pipeline_log(layer,status,records_loaded,executed_at) VALUES('tests',%s,%s,NOW())",
        ('success' if fail==0 else 'partial', ok))
    conn.commit(); conn.close()
    logger.info(f"Testes: {ok} OK, {fail} falhas")
    sys.exit(0 if fail==0 else 1)

if __name__ == "__main__":
    run()
