"""Data quality tests"""
import os, sys, psycopg2

DB = dict(host=os.environ["DB_HOST"], port=os.environ.get("DB_PORT","5432"),
          dbname="postgres", user="postgres", password=os.environ["DB_PASSWORD"],
          sslmode="require", connect_timeout=20)

TESTS = [
    ("bronze", "SELECT COUNT(*) FROM bronze.indicators_raw", ">0"),
    ("silver_empty", "SELECT COUNT(*) FROM silver.indicators_clean", ">0"),
    ("silver_nulls", "SELECT COUNT(*) FROM silver.indicators_clean WHERE value IS NULL", "=0"),
    ("silver_future", "SELECT COUNT(*) FROM silver.indicators_clean WHERE reference_date>CURRENT_DATE", "=0"),
    ("gold_latest", "SELECT COUNT(*) FROM gold.latest_indicators", ">0"),
    ("gold_series", "SELECT COUNT(DISTINCT series_name) FROM gold.latest_indicators", ">=8"),
    ("gold_monthly", "SELECT COUNT(*) FROM gold.monthly_summary", ">0"),
]

conn = psycopg2.connect(**DB)
cur = conn.cursor()
ok = fail = 0
for name, sql, cond in TESTS:
    cur.execute(sql)
    val = cur.fetchone()[0]
    passed = eval(f"{val}{cond}")
    icon = "✅" if passed else "❌"
    print(f"{icon} {name}: {val} (expected {cond})", flush=True)
    if passed: ok += 1
    else: fail += 1

cur.execute(
    "INSERT INTO bronze.pipeline_log(layer,status,records_loaded,executed_at) "
    "VALUES('tests',%s,%s,NOW())", ('success' if fail==0 else 'partial', ok)
)
conn.commit(); conn.close()
print(f"\nTestes: {ok} OK, {fail} falhas", flush=True)
sys.exit(0 if fail == 0 else 1)
