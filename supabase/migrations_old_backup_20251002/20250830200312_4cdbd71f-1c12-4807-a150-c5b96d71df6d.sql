
-- Habilita extensões necessárias (idempotente)
create extension if not exists pg_cron;
-- pg_net não é necessário aqui pois chamaremos a função diretamente via SQL

-- Remove qualquer job anterior com o mesmo nome para evitar duplicidade
do $$
declare 
  jid int;
begin
  for jid in
    select jobid from cron.job where jobname = 'create-missing-unified-accounts-every-5min'
  loop
    perform cron.unschedule(jid);
  end loop;
end$$;

-- Agenda a execução a cada 5 minutos (timezone do banco, geralmente UTC)
select cron.schedule(
  'create-missing-unified-accounts-every-5min',
  '*/5 * * * *',
  $$
  select public.create_missing_unified_accounts();
  $$
);

-- Opcional: verifique os jobs agendados
-- select jobid, jobname, schedule, command from cron.job where jobname like '%unified-accounts%';
