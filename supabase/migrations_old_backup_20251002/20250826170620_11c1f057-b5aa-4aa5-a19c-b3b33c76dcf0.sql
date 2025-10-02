-- 1) Adicionar colunas básicas
alter table public.tasks
  add column if not exists parent_task_id uuid,
  add column if not exists sort_index int not null default 0,
  add column if not exists estimated_duration_minutes int;

-- 2) Criar tabela de dependências
create table if not exists public.task_dependencies (
  task_id uuid not null,
  depends_on_id uuid not null,
  relation_type text not null default 'FS',
  lag_minutes int not null default 0,
  created_at timestamptz default now(),
  primary key (task_id, depends_on_id)
);

-- 3) Adicionar foreign keys condicionalmente  
do $$
begin
  -- Foreign key para parent_task_id
  if not exists (select 1 from information_schema.table_constraints 
                 where table_name = 'tasks' and constraint_name = 'fk_tasks_parent') then
    alter table public.tasks
      add constraint fk_tasks_parent
      foreign key (parent_task_id) references public.tasks(id) on delete set null;
  end if;

  -- Foreign keys para task_dependencies
  if not exists (select 1 from information_schema.table_constraints 
                 where table_name = 'task_dependencies' and constraint_name = 'fk_task_dep_task') then
    alter table public.task_dependencies
      add constraint fk_task_dep_task
      foreign key (task_id) references public.tasks(id) on delete cascade;
  end if;

  if not exists (select 1 from information_schema.table_constraints 
                 where table_name = 'task_dependencies' and constraint_name = 'fk_task_dep_depends') then
    alter table public.task_dependencies
      add constraint fk_task_dep_depends
      foreign key (depends_on_id) references public.tasks(id) on delete cascade;
  end if;
end$$;