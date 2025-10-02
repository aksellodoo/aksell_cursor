-- Verificar a política RLS atual para UPDATE na tabela tasks
-- e corrigi-la para permitir que usuários atualizem tarefas que estão envolvidos

-- Primeiro, vamos dropar a política existente de UPDATE
DROP POLICY IF EXISTS "Users can update tasks they are involved in" ON public.tasks;

-- Criar uma nova política mais permissiva para UPDATE
CREATE POLICY "Users can update tasks they are involved in" 
ON public.tasks 
FOR UPDATE 
USING (
  auth.uid() = assigned_to OR 
  auth.uid() = created_by OR 
  auth.uid() = ANY(assigned_users) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (
      profiles.role IN ('admin', 'hr', 'director') OR
      profiles.department_id = tasks.assigned_department
    )
  )
);