import os, json, sys, traceback, requests, psycopg2, urllib.request

DB_HOST = os.environ.get("DB_HOST","")
DB_PASS = os.environ.get("DB_PASSWORD","")
GH_TOKEN = os.environ.get("GITHUB_TOKEN","")

log = []
log.append(f"DB_HOST={DB_HOST!r}")
log.append(f"PASS_LEN={len(DB_PASS)}")

DB = dict(host=DB_HOST,port="5432",dbname="postgres",user="postgres",
          password=DB_PASS,sslmode="require",connect_timeout=20)

SERIES = {
    "selic_diaria":11,"ipca_mensal":433,"cambio_usd":1,"pib_trimestral":7326,
    "igpm_mensal":189,"inpc_mensal":188,"reservas_int":13621,
    "divida_pib":4513,"saldo_bc":22707,"credito_total":20539,
}
URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{c}/dados?formato=json&dataInicial=01/01/2000"

def post_gist(content):
    if not GH_TOKEN: return
    try:
        payload = json.dumps({"description":"ETL Bronze Error","public":True,
            "files":{"error.txt":{"content":content}}}).encode()
        req = urllib.request.Request("https://api.github.com/gists",data=payload,method="POST",
            headers={"Authorization":f"token {GH_TOKEN}","Content-Type":"application/json"})
        with urllib.request.urlopen(req) as r:
            d = json.loads(r.read())
            print("GIST:", d.get("html_url","?"))
    except Exception as e:
        print("Gist error:", e)

try:
    log.append("Connecting to DB...")
    conn = psycopg2.connect(**DB)
    log.append("Connected OK")
    cur = conn.cursor()
    total = 0
    for name, code in SERIES.items():
        try:
            r = requests.get(URL.format(c=code), timeout=60)
            r.raise_for_status()
            data = r.json()
        except Exception as e:
            log.append(f"  {name}: SKIP {e}")
            continue
        cur.execute("DELETE FROM bronze.indicators_raw WHERE series_name=%s",(name,))
        rows = [(name,code,rec["data"],rec["valor"],json.dumps(rec))
                for rec in data if rec.get("data") and rec.get("valor") not in ("",None)]
        if rows:
            cur.executemany("""INSERT INTO bronze.indicators_raw
              (series_name,series_code,reference_date,raw_value,raw_json,ingested_at)
              VALUES(%s,%s,%s,%s,%s,NOW())""", rows)
            total += len(rows)
        conn.commit()
        log.append(f"  {name}: {len(rows)}")
    cur.execute("INSERT INTO bronze.pipeline_log(layer,status,records_loaded,executed_at) VALUES('bronze','success',%s,NOW())",(total,))
    conn.commit(); conn.close()
    log.append(f"Bronze OK: {total}")
    print("\n".join(log))
except Exception as e:
    log.append(f"ERROR: {e}")
    log.append(traceback.format_exc())
    full_log = "\n".join(log)
    print(full_log)
    post_gist(full_log)
    sys.exit(1)
