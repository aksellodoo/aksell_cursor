-- 1) Adicionar colunas para subtarefas e cronograma
alter table public.tasks
  add column if not exists parent_task_id uuid null,
  add column if not exists sort_index int not null default 0,
  add column if not exists estimated_duration_minutes int;

-- 2) Criar tabela de dependências
create table if not exists public.task_dependencies (
  task_id uuid not null references public.tasks(id) on delete cascade,
  depends_on_id uuid not null references public.tasks(id) on delete cascade,
  relation_type text not null default 'FS',
  lag_minutes int not null default 0,
  created_at timestamptz default now(),
  primary key (task_id, depends_on_id),
  check (relation_type in ('FS','SS','FF','SF')),
  check (task_id <> depends_on_id)
);

-- 3) Criar índices
create index if not exists idx_tasks_parent on public.tasks(parent_task_id);
create index if not exists idx_tasks_parent_sort on public.tasks(parent_task_id, sort_index);
create index if not exists idx_task_deps_task on public.task_dependencies(task_id);
create index if not exists idx_task_deps_on on public.task_dependencies(depends_on_id);

-- 4) Foreign key para parent_task_id
do $$
begin
  if not exists (select 1 from information_schema.table_constraints 
                 where table_name = 'tasks' and constraint_name = 'fk_tasks_parent') then
    alter table public.tasks
      add constraint fk_tasks_parent
      foreign key (parent_task_id) references public.tasks(id) on delete set null;
  end if;
end$$;