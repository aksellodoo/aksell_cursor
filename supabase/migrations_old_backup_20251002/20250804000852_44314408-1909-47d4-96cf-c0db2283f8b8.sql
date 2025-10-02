-- Criar tabela para tipos de tarefa
CREATE TABLE public.task_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT NOT NULL DEFAULT 'CheckSquare',
  icon_color TEXT NOT NULL DEFAULT '#3B82F6',
  form_id UUID REFERENCES public.forms(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar coluna task_type_id na tabela tasks
ALTER TABLE public.tasks 
ADD COLUMN task_type_id UUID REFERENCES public.task_types(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.task_types ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para task_types
CREATE POLICY "Users can view task types" 
ON public.task_types 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create task types" 
ON public.task_types 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their task types" 
ON public.task_types 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their task types" 
ON public.task_types 
FOR DELETE 
USING (auth.uid() = created_by);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_task_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_types_updated_at
BEFORE UPDATE ON public.task_types
FOR EACH ROW
EXECUTE FUNCTION public.update_task_types_updated_at();