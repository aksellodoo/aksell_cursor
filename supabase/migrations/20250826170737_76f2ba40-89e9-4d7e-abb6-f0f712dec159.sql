-- 1) Adicionar colunas para subtarefas se não existirem
alter table public.tasks
  add column if not exists parent_task_id uuid,
  add column if not exists sort_index int not null default 0,
  add column if not exists estimated_duration_minutes int;

-- 2) Criar constraint para parent_task_id condicionalmente
do $$
begin
  if not exists (select 1 from information_schema.table_constraints 
                 where table_name = 'tasks' and constraint_name = 'fk_tasks_parent') then
    alter table public.tasks
      add constraint fk_tasks_parent
      foreign key (parent_task_id) references public.tasks(id) on delete set null;
  end if;
end$$;

-- 3) Criar índices
create index if not exists idx_tasks_parent on public.tasks(parent_task_id);
create index if not exists idx_tasks_parent_sort on public.tasks(parent_task_id, sort_index);

-- 4) Criar view de bloqueios básica (sem task_dependencies por enquanto)
create or replace view public.tasks_blockers_v as
select
  t.id as task_id,
  null::uuid[] as blocker_ids,
  0::bigint as open_blockers,
  null::timestamptz as blocked_until
from public.tasks t;