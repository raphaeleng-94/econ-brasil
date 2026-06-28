"""Silver - clean and type bronze data"""
import os, sys, math, psycopg2, psycopg2.extras
from datetime import datetime

DB = dict(host=os.environ["DB_HOST"], port=os.environ.get("DB_PORT","5432"),
          dbname="postgres", user="postgres", password=os.environ["DB_PASSWORD"],
          sslmode="require", connect_timeout=20)

def parse_date(s):
    for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
        try: return datetime.strptime(s.strip(), fmt).date()
        except: pass
    return None

def parse_float(s):
    try:
        v = float(str(s).replace(",",".").strip())
        return None if math.isnan(v) or math.isinf(v) else round(v, 6)
    except: return None

conn = psycopg2.connect(**DB)
cur  = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
cur.execute("SELECT * FROM bronze.indicators_raw ORDER BY series_name, id")
rows = cur.fetchall()
print(f"Silver: processando {len(rows)} linhas bronze...", flush=True)

cur.execute("TRUNCATE silver.indicators_clean")
batch, skipped = [], 0
for row in rows:
    d = parse_date(row["reference_date"])
    v = parse_float(row["raw_value"])
    if not d or v is None: skipped += 1; continue
    batch.append((row["series_name"], row["series_code"], d, v, row["id"]))

if batch:
    cur.executemany(
        "INSERT INTO silver.indicators_clean "
        "(series_name,series_code,reference_date,value,bronze_id,processed_at) "
        "VALUES(%s,%s,%s,%s,%s,NOW())", batch
    )
cur.execute(
    "INSERT INTO bronze.pipeline_log(layer,status,records_loaded,executed_at) "
    "VALUES('silver','success',%s,NOW())", (len(batch),)
)
conn.commit(); conn.close()
print(f"Silver: {len(batch)} processados, {skipped} ignorados", flush=True)
