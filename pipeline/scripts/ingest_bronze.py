"""Bronze Layer - BCB/SGS"""
import os, json, sys, traceback, requests, psycopg2
from loguru import logger

DB_HOST = os.environ.get("DB_HOST","")
DB_PASS = os.environ.get("DB_PASSWORD","")
print(f"HOST={DB_HOST!r} PASS_LEN={len(DB_PASS)}", flush=True)

DB = dict(host=DB_HOST,port="5432",dbname="postgres",user="postgres",
          password=DB_PASS,sslmode="require",connect_timeout=20)

SERIES = {
    "selic_diaria":11,"ipca_mensal":433,"cambio_usd":1,"pib_trimestral":7326,
    "igpm_mensal":189,"inpc_mensal":188,"reservas_int":13621,
    "divida_pib":4513,"saldo_bc":22707,"credito_total":20539,
}
URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{c}/dados?formato=json&dataInicial=01/01/2000"

try:
    print("Conectando ao banco...", flush=True)
    conn = psycopg2.connect(**DB)
    print("Conexao OK", flush=True)
    cur = conn.cursor()
    total = 0
    for name, code in SERIES.items():
        try:
            r = requests.get(URL.format(c=code), timeout=60)
            r.raise_for_status()
            data = r.json()
        except Exception as e:
            print(f"  {name}: SKIP ({e})", flush=True)
            continue
        cur.execute("DELETE FROM bronze.indicators_raw WHERE series_name=%s",(name,))
        rows = [(name,code,r["data"],r["valor"],json.dumps(r))
                for r in data if r.get("data") and r.get("valor") not in ("",None)]
        if rows:
            cur.executemany("""INSERT INTO bronze.indicators_raw
              (series_name,series_code,reference_date,raw_value,raw_json,ingested_at)
              VALUES(%s,%s,%s,%s,%s,NOW())""", rows)
            total += len(rows)
        conn.commit()
        print(f"  {name}: {len(rows)}", flush=True)
    cur.execute("INSERT INTO bronze.pipeline_log(layer,status,records_loaded,executed_at) VALUES('bronze','success',%s,NOW())",(total,))
    conn.commit(); conn.close()
    print(f"Bronze OK: {total} registros", flush=True)
except Exception as e:
    print(f"ERRO: {e}", flush=True)
    traceback.print_exc()
    sys.exit(1)
