# Scripts Legados (não utilizados em produção)

Estes scripts Python (psycopg2) representavam a abordagem inicial do pipeline,
que tentava conectar diretamente ao PostgreSQL do Supabase via GitHub Actions.

**Por que foram substituídos?**
GitHub Actions runners usam IPs de datacenter, que são frequentemente
bloqueados por políticas de rede do Postgres direto (porta 5432) e também
pela própria API do Banco Central (BCB/SGS), que limita acesso de IPs cloud.

**Solução atual:** Supabase Edge Function (`supabase/functions/run-pipeline`)
que roda o pipeline completo (Bronze→Silver→Gold) dentro da infraestrutura do
próprio Supabase, eliminando problemas de conectividade. O GitHub Actions
apenas dispara essa função via HTTP/cron.

Mantidos aqui apenas para referência histórica e documentação do processo de
troubleshooting.
