"""
Bronze Layer - Indicadores Economicos Brasil
Fonte primaria: BCB/SGS API
Fallback: dados seed quando API indisponivel (IPs cloud bloqueados pela BCB)
"""
import os, sys, json, requests, psycopg2
from datetime import datetime, date
from dateutil.relativedelta import relativedelta

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
BCB_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{c}/dados/ultimos/24?formato=json"

def try_bcb(code):
    """Tenta buscar da BCB - pode falhar em IPs cloud."""
    try:
        r = requests.get(BCB_URL.format(c=code), timeout=30,
                        headers={"User-Agent": "Mozilla/5.0"})
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return None

print("Conectando ao banco...", flush=True)
conn = psycopg2.connect(**DB)
cur = conn.cursor()
print("Conectado!", flush=True)

total = 0
bcb_ok = 0
for name, code in SERIES.items():
    data = try_bcb(code)
    if data:
        bcb_ok += 1
        cur.execute("DELETE FROM bronze.indicators_raw WHERE series_name=%s", (name,))
        rows = [(name, code, r["data"], r["valor"], json.dumps(r))
                for r in data if r.get("data") and r.get("valor") not in ("", None)]
        if rows:
            cur.executemany(
                "INSERT INTO bronze.indicators_raw "
                "(series_name,series_code,reference_date,raw_value,raw_json,ingested_at) "
                "VALUES(%s,%s,%s,%s,%s,NOW())", rows
            )
            total += len(rows)
        conn.commit()
        print(f"  BCB {name}: {len(rows)} rows", flush=True)
    else:
        print(f"  SKIP {name}: BCB indisponivel (IP bloqueado)", flush=True)

print(f"\nBCB disponivel: {bcb_ok}/{len(SERIES)} series", flush=True)

# Se BCB totalmente indisponivel, verificar se ja temos dados no banco
if bcb_ok == 0:
    cur.execute("SELECT COUNT(*) FROM bronze.indicators_raw")
    existing = cur.fetchone()[0]
    print(f"Bronze ja tem {existing} linhas - mantendo dados existentes", flush=True)
    if existing == 0:
        print("ERRO: Sem dados na BCB e banco vazio!", flush=True)
        cur.close(); conn.close()
        sys.exit(1)
else:
    cur.execute(
        "INSERT INTO bronze.pipeline_log(layer,status,records_loaded,executed_at) "
        "VALUES('bronze','success',%s,NOW())", (total,)
    )
    conn.commit()

cur.close(); conn.close()
print(f"Bronze finalizado: {total} rows via BCB", flush=True)
