-- Remover o cron job problemático que chama função inexistente
SELECT cron.unschedule('send-protheus-notifications');

-- Verificar se há outros cron jobs órfãos e removê-los
DELETE FROM cron.job 
WHERE command LIKE '%send-protheus-notifications%' 
   OR command LIKE '%process-protheus-notifications%';