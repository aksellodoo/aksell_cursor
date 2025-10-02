-- Primeiro, criar a coluna parent_task_id caso não exista
alter table public.tasks
  add column if not exists parent_task_id uuid null;

-- Criar o índice e foreign key para parent_task_id
create index if not exists idx_tasks_parent on public.tasks(parent_task_id);

-- Criar foreign key sem "if not exists" (não suportado)
do $$
begin
  if not exists (select 1 from information_schema.table_constraints 
                 where table_name = 'tasks' and constraint_name = 'fk_tasks_parent') then
    alter table public.tasks
      add constraint fk_tasks_parent
      foreign key (parent_task_id) references public.tasks(id) on delete set null;
  end if;
end$$;

-- 1) Ordenação de subtarefas (posição entre irmãos)
alter table public.tasks
  add column if not exists sort_index int not null default 0;
create index if not exists idx_tasks_parent_sort on public.tasks(parent_task_id, sort_index);

-- 2) Duração estimada sempre >= 0
do $$
begin
  if not exists (select 1 from information_schema.table_constraints 
                 where table_name = 'tasks' and constraint_name = 'chk_tasks_est_duration_nonneg') then
    alter table public.tasks
      add constraint chk_tasks_est_duration_nonneg
      check (estimated_duration_minutes is null or estimated_duration_minutes >= 0);
  end if;
end$$;

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