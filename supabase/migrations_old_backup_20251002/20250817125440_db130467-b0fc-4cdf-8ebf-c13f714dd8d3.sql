-- Add RLS policies for "uso em tarefas" form status

-- Policy to allow users to view forms they have tasks for (when form status is "task_usage")
CREATE POLICY "Users can view task_usage forms when assigned to tasks" ON public.forms
FOR SELECT USING (
  status = 'task_usage' AND 
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.form_id = forms.id 
    AND (
      t.assigned_to = auth.uid() OR
      auth.uid() = ANY(t.assigned_users) OR
      (t.assigned_department IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() AND p.department_id = t.assigned_department
      ))
    )
  )
);

-- Policy to allow users to submit responses to task_usage forms when assigned to related tasks
CREATE POLICY "Users can submit responses to task_usage forms when assigned" ON public.form_responses
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.forms f
    WHERE f.id = form_responses.form_id 
    AND f.status = 'task_usage'
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.form_id = f.id 
      AND (
        t.assigned_to = auth.uid() OR
        auth.uid() = ANY(t.assigned_users) OR
        (t.assigned_department IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.profiles p 
          WHERE p.id = auth.uid() AND p.department_id = t.assigned_department
        ))
      )
    )
  )
);