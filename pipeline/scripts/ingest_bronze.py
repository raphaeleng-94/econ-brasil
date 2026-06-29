"""
Bronze Layer - BCB/SGS via Supabase REST API
Usa service_role key - sem necessidade de senha direta do banco
"""
import os, sys, json, requests

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://ftbtqqwahzpzwqizigcd.supabase.co")
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]  # service_role key
BCB_URL      = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{c}/dados/ultimos/36?formato=json"

SERIES = {
    "selic_diaria": 11, "ipca_mensal": 433, "cambio_usd": 1,
    "pib_trimestral": 7326, "igpm_mensal": 189, "inpc_mensal": 188,
    "reservas_int": 13621, "divida_pib": 4513,
    "saldo_bc": 22707, "credito_total": 20539,
}

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def rest_delete(table, series_name):
    r = requests.delete(
        f"{SUPABASE_URL}/rest/v1/{table}?series_name=eq.{series_name}",
        headers=HEADERS, timeout=30
    )
    return r.status_code in (200, 204)

def rest_insert(table, rows):
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=HEADERS,
        data=json.dumps(rows), timeout=30
    )
    if r.status_code not in (200, 201):
        print(f"  INSERT error {r.status_code}: {r.text[:200]}", flush=True)
        return False
    return True

def rest_log(layer, status, n):
    requests.post(
        f"{SUPABASE_URL}/rest/v1/pipeline_log",
        headers={**HEADERS, "Content-Type": "application/json"},
        data=json.dumps([{"layer": layer, "status": status, "records_loaded": n}]),
        timeout=15
    )

# Note: pipeline_log is in bronze schema - use RPC or direct table
# Using public view approach for REST

print(f"Supabase URL: {SUPABASE_URL}", flush=True)
print(f"Key length: {len(SUPABASE_KEY)}", flush=True)

total = 0
bcb_ok = 0

for name, code in SERIES.items():
    # Try BCB
    data = None
    try:
        r = requests.get(BCB_URL.format(c=code), timeout=30,
                        headers={"User-Agent": "Mozilla/5.0 (compatible)"})
        if r.status_code == 200:
            data = r.json()
            bcb_ok += 1
    except Exception as e:
        pass

    if data:
        # Delete existing
        rest_delete("bronze_raw", name)
        # Insert new
        rows = [
            {"series_name": name, "series_code": code,
             "reference_date": rec["data"], "raw_value": rec["valor"],
             "raw_json": rec}
            for rec in data if rec.get("data") and rec.get("valor") not in ("", None)
        ]
        if rows:
            rest_insert("bronze_raw", rows)
            total += len(rows)
        print(f"  ✅ {name}: {len(rows)} rows", flush=True)
    else:
        print(f"  ⚠ {name}: BCB indisponivel - mantendo dados existentes", flush=True)

print(f"\nBCB: {bcb_ok}/{len(SERIES)} series disponíveis", flush=True)

# Check if we have any data
r = requests.get(
    f"{SUPABASE_URL}/rest/v1/bronze_raw?select=count&series_name=eq.selic_diaria",
    headers=HEADERS, timeout=15
)
print(f"Bronze check: {r.text[:100]}", flush=True)

if bcb_ok == 0 and total == 0:
    # No BCB data and no existing data - check if seeded
    r2 = requests.get(
        f"{SUPABASE_URL}/rest/v1/bronze_raw?select=count",
        headers={**HEADERS, "Prefer": "count=exact"},
        timeout=15
    )
    count = int(r2.headers.get("content-range", "0/0").split("/")[-1])
    if count == 0:
        print("ERRO: Bronze vazio e BCB indisponivel!", flush=True)
        sys.exit(1)
    print(f"Bronze ja tem {count} linhas - OK", flush=True)

print(f"Bronze finalizado: {total} novas linhas", flush=True)
