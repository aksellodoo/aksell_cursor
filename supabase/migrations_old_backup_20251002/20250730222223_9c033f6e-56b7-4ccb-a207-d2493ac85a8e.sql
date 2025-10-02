-- Habilitar RLS na tabela cron_job_logs
ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Criar política para que apenas admins possam ver logs dos cron jobs
CREATE POLICY "Only admins can view cron job logs" 
ON public.cron_job_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'director')
));

-- Política para inserção automática pelo sistema
CREATE POLICY "System can insert cron job logs" 
ON public.cron_job_logs 
FOR INSERT 
WITH CHECK (true);