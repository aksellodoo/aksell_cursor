
-- Permitir ao "contexto interno do banco" (sem JWT claims) ler workflows e auto-triggers
-- Isso é necessário para que a função process_workflow_triggers, chamada por triggers do banco,
-- consiga encontrar os workflows/auto-triggers ativos e enfileirar execuções.

-- 1) Política para workflows (apenas contexto interno: current_setting('request.jwt.claims', true) IS NULL)
CREATE POLICY IF NOT EXISTS "Internal system can read workflows for triggers"
ON public.workflows
FOR SELECT
USING (current_setting('request.jwt.claims', true) IS NULL);

-- 2) Política para workflow_auto_triggers (apenas contexto interno)
CREATE POLICY IF NOT EXISTS "Internal system can read workflow auto triggers"
ON public.workflow_auto_triggers
FOR SELECT
USING (current_setting('request.jwt.claims', true) IS NULL);
