-- 1) Adicionar colunas para subtarefas 
alter table public.tasks
  add column if not exists parent_task_id uuid,
  add column if not exists sort_index int not null default 0,
  add column if not exists estimated_duration_minutes int;

-- 2) Criar foreign key para parent_task_id
alter table public.tasks
  add constraint if not exists fk_tasks_parent
  foreign key (parent_task_id) references public.tasks(id) on delete set null;

-- 3) Criar tabela de dependências simples
create table if not exists public.task_dependencies (
  task_id uuid not null,
  depends_on_id uuid not null,
  relation_type text not null default 'FS',
  lag_minutes int not null default 0,
  created_at timestamptz default now(),
  primary key (task_id, depends_on_id)
);

-- 4) Adicionar foreign keys para task_dependencies
alter table public.task_dependencies
  add constraint if not exists fk_task_dep_task
  foreign key (task_id) references public.tasks(id) on delete cascade;

alter table public.task_dependencies
  add constraint if not exists fk_task_dep_depends
  foreign key (depends_on_id) references public.tasks(id) on delete cascade;