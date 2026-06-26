"""
Bronze Layer - Indicadores Economicos do Brasil
Fonte: API SGS (Banco Central do Brasil)
Series: SELIC, IPCA, Cambio, PIB, IGP-M, INPC, Reservas, Divida, Balanca, Credito
"""
import os, json, requests, psycopg2
from loguru import logger

DB = dict(
    host=os.environ["DB_HOST"],
    port=os.environ.get("DB_PORT","5432"),
    dbname=os.environ.get("DB_NAME","postgres"),
    user=os.environ.get("DB_USER","postgres"),
    password=os.environ["DB_PASSWORD"],
    sslmode="require"
)

SERIES = {
    "selic_diaria":   11,
    "ipca_mensal":    433,
    "cambio_usd":     1,
    "pib_trimestral": 7326,
    "igpm_mensal":    189,
    "inpc_mensal":    188,
    "reservas_int":   13621,
    "divida_pib":     4513,
    "saldo_bc":       22707,
    "credito_total":  20539,
}

SGS_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{code}/dados?formato=json&dataInicial=01/01/2000"

def fetch(code, name):
    try:
        r = requests.get(SGS_URL.format(code=code), timeout=60)
        r.raise_for_status()
        data = r.json()
        logger.info(f"  {name}: {len(data)} registros")
        return data
    except Exception as e:
        logger.warning(f"  {name}: {e}")
        return []

def run():
    logger.info("=== BRONZE: BCB/SGS ===")
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()
    total = 0
    for name, code in SERIES.items():
        records = fetch(code, name)
        cur.execute("DELETE FROM bronze.indicators_raw WHERE series_name=%s", (name,))
        rows = [(name, code, r["data"], r["valor"], json.dumps(r))
                for r in records if r.get("data") and r.get("valor") not in ("",None)]
        if rows:
            cur.executemany("""
                INSERT INTO bronze.indicators_raw
                  (series_name,series_code,reference_date,raw_value,raw_json,ingested_at)
                VALUES(%s,%s,%s,%s,%s,NOW())
            """, rows)
            total += len(rows)
        conn.commit()
    cur.execute("INSERT INTO bronze.pipeline_log(layer,status,records_loaded,executed_at) VALUES('bronze','success',%s,NOW())", (total,))
    conn.commit()
    conn.close()
    logger.success(f"Bronze: {total} registros")

if __name__ == "__main__":
    run()
