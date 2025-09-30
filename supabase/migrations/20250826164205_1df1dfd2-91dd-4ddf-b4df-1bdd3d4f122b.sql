-- 1) Ordenação de subtarefas (posição entre irmãos)
alter table public.tasks
  add column if not exists sort_index int not null default 0;
create index if not exists idx_tasks_parent_sort on public.tasks(parent_task_id, sort_index);

-- 2) Duração estimada sempre >= 0
alter table public.tasks
  add constraint chk_tasks_est_duration_nonneg
  check (estimated_duration_minutes is null or estimated_duration_minutes >= 0);

-- 3) View de bloqueios mais robusta (fallback p/ quando não há planned_start)
create or replace view public.tasks_blockers_v as
select
  t.id as task_id,
  array_remove(array_agg(d.id) filter (where d.actual_end_at is null), null) as blocker_ids,
  count(*) filter (where d.actual_end_at is null) as open_blockers,
  max(
    case td.relation_type
      when 'FS' then d.expected_completion_at + (td.lag_minutes||' minutes')::interval
      when 'FF' then d.expected_completion_at + (td.lag_minutes||' minutes')::interval
      when 'SS' then coalesce(
                      d.planned_start_at,
                      d.expected_completion_at - ((coalesce(d.estimated_duration_minutes,0))::text||' minutes')::interval,
                      d.expected_completion_at
                    ) + (td.lag_minutes||' minutes')::interval
      when 'SF' then coalesce(
                      d.planned_start_at,
                      d.expected_completion_at - ((coalesce(d.estimated_duration_minutes,0))::text||' minutes')::interval,
                      d.expected_completion_at
                    ) + (td.lag_minutes||' minutes')::interval
    end
  ) filter (where d.actual_end_at is null) as blocked_until
from public.tasks t
left join public.task_dependencies td on td.task_id = t.id
left join public.tasks d             on d.id = td.depends_on_id
group by t.id;

-- 4) (Opcional) impedir múltiplos tipos de relação para o mesmo par (mantém 1 por par)
do $$
begin
  if exists (select 1 from information_schema.table_constraints
             where table_schema='public' and table_name='task_dependencies'
               and constraint_type='PRIMARY KEY') then
    -- já é (task_id, depends_on_id); nada a fazer
    null;
  end if;
end$$;