-- Habilitar RLS na tabela task_dependencies
alter table public.task_dependencies enable row level security;

-- RLS policies para task_dependencies (similar às tasks)
create policy "Users can view task dependencies they have access to"
  on public.task_dependencies
  for select
  using (
    exists (
      select 1 from public.tasks t1 
      where t1.id = task_dependencies.task_id 
        and (
          t1.created_by = auth.uid() 
          or t1.assigned_to = auth.uid()
          or auth.uid() = any(t1.assigned_users)
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() 
              and (
                p.role in ('admin', 'director') 
                or (p.department_id = t1.assigned_department)
              )
          )
        )
    )
  );

create policy "Users can create task dependencies for tasks they manage"
  on public.task_dependencies
  for insert
  with check (
    exists (
      select 1 from public.tasks t1 
      where t1.id = task_dependencies.task_id 
        and (
          t1.created_by = auth.uid() 
          or t1.assigned_to = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() 
              and p.role in ('admin', 'director')
          )
        )
    )
  );

create policy "Users can update task dependencies for tasks they manage"
  on public.task_dependencies
  for update
  using (
    exists (
      select 1 from public.tasks t1 
      where t1.id = task_dependencies.task_id 
        and (
          t1.created_by = auth.uid() 
          or t1.assigned_to = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() 
              and p.role in ('admin', 'director')
          )
        )
    )
  );

create policy "Users can delete task dependencies for tasks they manage"
  on public.task_dependencies
  for delete
  using (
    exists (
      select 1 from public.tasks t1 
      where t1.id = task_dependencies.task_id 
        and (
          t1.created_by = auth.uid() 
          or t1.assigned_to = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() 
              and p.role in ('admin', 'director')
          )
        )
    )
  );