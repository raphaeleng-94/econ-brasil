"""Bronze - BCB/SGS API"""
import os, json, sys, requests, psycopg2

DB = dict(
    host=os.environ["DB_HOST"],
    port=os.environ.get("DB_PORT", "5432"),
    dbname="postgres", user="postgres",
    password=os.environ["DB_PASSWORD"],
    sslmode="require", connect_timeout=20
)

SERIES = {
    "selic_diaria": 11, "ipca_mensal": 433, "cambio_usd": 1,
    "pib_trimestral": 7326, "igpm_mensal": 189, "inpc_mensal": 188,
    "reservas_int": 13621, "divida_pib": 4513,
    "saldo_bc": 22707, "credito_total": 20539,
}
URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{c}/dados?formato=json&dataInicial=01/01/2000"

print(f"Connecting to {DB['host']}...", flush=True)
try:
    conn = psycopg2.connect(**DB)
    print("Connected OK", flush=True)
except Exception as e:
    print(f"CONNECTION FAILED: {e}", flush=True)
    sys.exit(1)

cur = conn.cursor()
total = 0

for name, code in SERIES.items():
    print(f"Fetching {name}...", flush=True)
    try:
        r = requests.get(URL.format(c=code), timeout=60)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        print(f"  SKIP {name}: {e}", flush=True)
        continue

    cur.execute("DELETE FROM bronze.indicators_raw WHERE series_name=%s", (name,))
    rows = [
        (name, code, rec["data"], rec["valor"], json.dumps(rec))
        for rec in data
        if rec.get("data") and rec.get("valor") not in ("", None)
    ]
    if rows:
        cur.executemany(
            "INSERT INTO bronze.indicators_raw "
            "(series_name,series_code,reference_date,raw_value,raw_json,ingested_at) "
            "VALUES(%s,%s,%s,%s,%s,NOW())", rows
        )
        total += len(rows)
    conn.commit()
    print(f"  {name}: {len(rows)} rows", flush=True)

cur.execute(
    "INSERT INTO bronze.pipeline_log(layer,status,records_loaded,executed_at) "
    "VALUES('bronze','success',%s,NOW())", (total,)
)
conn.commit()
conn.close()
print(f"Bronze done: {total} total rows", flush=True)
