-- Correções críticas encontradas em produção:
--
-- BUG 1: faltavam views públicas para bronze.indicators_raw e bronze.pipeline_log.
-- Sem elas, o client REST (usado pela Edge Function via service_role) não conseguia
-- inserir/consultar essas tabelas — PostgREST só expõe o schema `public` por padrão.
-- Resultado: todo INSERT no bronze falhava silenciosamente (erro não verificado no
-- código JS), o pipeline "rodava com sucesso" mas nunca atualizava dados novos,
-- deixando o dashboard preso em jun/2025 indefinidamente.
--
-- BUG 2: a Edge Function usava GET /dados/ultimos/{N} com N=36, mas a API do BCB
-- limita esse parâmetro a N<=20. Requisições com N>20 falhavam e caíam no fallback
-- (manter dados antigos). Corrigido para usar consulta por intervalo de datas
-- (dataInicial/dataFinal), que não tem esse limite.

CREATE OR REPLACE VIEW public.indicators_raw AS SELECT * FROM bronze.indicators_raw;
GRANT SELECT, INSERT, DELETE ON public.indicators_raw TO service_role;
GRANT USAGE, SELECT ON bronze.indicators_raw_id_seq TO service_role;

CREATE OR REPLACE VIEW public.pipeline_log AS SELECT * FROM bronze.pipeline_log;
GRANT SELECT, INSERT ON public.pipeline_log TO service_role;
GRANT USAGE, SELECT ON bronze.pipeline_log_id_seq TO service_role;

ALTER TABLE bronze.pipeline_log ADD COLUMN IF NOT EXISTS message TEXT;
