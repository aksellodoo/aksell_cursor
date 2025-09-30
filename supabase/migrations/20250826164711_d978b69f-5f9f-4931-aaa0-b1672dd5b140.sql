-- 1) Primeiro, criar as colunas básicas para subtarefas
alter table public.tasks
  add column if not exists parent_task_id uuid null,
  add column if not exists sort_index int not null default 0,
  add column if not exists estimated_duration_minutes int;

-- 2) Criar tabela de dependências
create table if not exists public.task_dependencies (
  task_id uuid not null references public.tasks(id) on delete cascade,
  depends_on_id uuid not null references public.tasks(id) on delete cascade,
  relation_type text not null default 'FS' check (relation_type in ('FS','SS','FF','SF')),
  lag_minutes int not null default 0,
  created_at timestamptz default now(),
  primary key (task_id, depends_on_id)
);

-- 3) Criar índices
create index if not exists idx_tasks_parent on public.tasks(parent_task_id);
create index if not exists idx_tasks_parent_sort on public.tasks(parent_task_id, sort_index);
create index if not exists idx_task_deps_task on public.task_dependencies(task_id);
create index if not exists idx_task_deps_on on public.task_dependencies(depends_on_id);

-- 4) Criar constraints condicionalmente
do $$
begin
  -- Foreign key para parent_task_id
  if not exists (select 1 from information_schema.table_constraints 
                 where table_name = 'tasks' and constraint_name = 'fk_tasks_parent') then
    alter table public.tasks
      add constraint fk_tasks_parent
      foreign key (parent_task_id) references public.tasks(id) on delete set null;
  end if;

  -- Constraint para duração estimada
  if not exists (select 1 from information_schema.table_constraints 
                 where table_name = 'tasks' and constraint_name = 'chk_tasks_est_duration_nonneg') then
    alter table public.tasks
      add constraint chk_tasks_est_duration_nonneg
      check (estimated_duration_minutes is null or estimated_duration_minutes >= 0);
  end if;

  -- Constraint para task_dependencies não permitir auto-referência
  if not exists (select 1 from information_schema.table_constraints 
                 where table_name = 'task_dependencies' and constraint_name = 'task_dep_no_self') then
    alter table public.task_dependencies
      add constraint task_dep_no_self check (task_id <> depends_on_id);
  end if;
end$$;

-- 5) View de bloqueios mais robusta
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