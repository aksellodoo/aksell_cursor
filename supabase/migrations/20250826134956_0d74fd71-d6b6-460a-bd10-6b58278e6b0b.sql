-- Melhorias de segurança e limitações para task_series

-- 1) Função segura para chamar Edge Function sem hardcode
create or replace function public.generate_task_occurrences()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text := current_setting('app.settings.edge_url', true);
  v_key text := current_setting('app.settings.edge_key', true);
begin
  if v_url is null or v_key is null then
    raise exception 'Edge URL/KEY ausentes. Configure app.settings.edge_url/app.settings.edge_key.';
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization', 'Bearer '||v_key
    ),
    body := '{}'::jsonb
  );
  return json_build_object('status','triggered');
end;
$$;

-- 2) Constraints de validação e limites práticos
alter table public.task_series
  add constraint chk_series_mode check (generation_mode in ('on_schedule','on_prev_complete')),
  add constraint chk_series_adjust check (adjust_policy in ('none','previous_business_day','next_business_day')),
  add constraint chk_series_lookahead check (lookahead_count between 1 and 5),
  add constraint chk_series_catchup check (catch_up_limit between 0 and 5),
  add constraint chk_series_days_before_due check (days_before_due between 0 and 30);

-- 3) Único título ativo por owner (evita duplicatas)
create unique index if not exists uq_task_series_owner_title_active
on public.task_series (owner_id, lower(title))
where status = 'active';

-- 4) Índice auxiliar por data da ocorrência
create index if not exists idx_tasks_series_occ_date on public.tasks (series_id, occurrence_start);

-- 5) Cron job chamando a função segura
do $$
begin
  begin perform cron.unschedule('process-task-series-every-5-min'); exception when others then null; end;
  perform cron.schedule('process-task-series-every-5-min','*/5 * * * *','select public.generate_task_occurrences();');
end$$;