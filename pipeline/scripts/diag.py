import os, sys, socket
h = os.environ.get('DB_HOST', 'EMPTY')
p = os.environ.get('DB_PASSWORD', '')
print(f'HOST={h!r}')
print(f'PASS_LEN={len(p)} FIRST={repr(p[:2]) if p else "EMPTY"}')
try:
    ip = socket.gethostbyname(h)
    print(f'DNS OK: {h} -> {ip}')
except Exception as e:
    print(f'DNS FAIL: {e}')
try:
    import psycopg2
    conn = psycopg2.connect(host=h,port='5432',dbname='postgres',user='postgres',password=p,sslmode='require',connect_timeout=15)
    conn.cursor().execute('SELECT 1')
    conn.close()
    print('DB CONNECT: OK')
except Exception as e:
    print(f'DB CONNECT FAIL: {e}')
