
-- 1) Habilitar extensões necessárias (idempotente)
create extension if not exists pg_cron with schema public;
create extension if not exists pg_net with schema public;

-- 2) Remover job com mesmo nome (se existir) para evitarmos duplicidade
do $$
declare
  v_job_id int;
begin
  select jobid into v_job_id
  from cron.job
  where jobname = 'city-distance-worker-every-minute'
  limit 1;

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;
end$$;

-- 3) Criar job que chama a edge function do worker a cada minuto
select
  cron.schedule(
    'city-distance-worker-every-minute',
    '* * * * *', -- a cada minuto
    $$
    select
      net.http_post(
        url:='https://nahyrexnxhzutfeqxjte.supabase.co/functions/v1/city-distance-worker',
        headers:='{
          "Content-Type": "application/json",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg"
        }'::jsonb,
        body:='{"source":"pg_cron"}'::jsonb
      );
    $$
  );
