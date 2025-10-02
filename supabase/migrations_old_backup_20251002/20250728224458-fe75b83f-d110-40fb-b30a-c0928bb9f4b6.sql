-- Criar tabela para templates de workflow
CREATE TABLE public.workflow_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  workflow_definition JSONB NOT NULL DEFAULT '{}',
  instructions TEXT,
  prerequisites TEXT,
  example_usage TEXT,
  tags TEXT[],
  complexity_level TEXT NOT NULL DEFAULT 'basic', -- basic, intermediate, advanced
  department_ids UUID[],
  confidentiality_level confidentiality_level NOT NULL DEFAULT 'public',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  usage_count INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view workflow templates with confidentiality check" 
ON public.workflow_templates 
FOR SELECT 
USING (can_access_workflow(confidentiality_level, auth.uid()));

CREATE POLICY "Users can create workflow templates" 
ON public.workflow_templates 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their workflow templates" 
ON public.workflow_templates 
FOR UPDATE 
USING ((auth.uid() = created_by) OR (EXISTS ( 
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['admin'::text, 'hr'::text, 'director'::text])
)) AND can_access_workflow(confidentiality_level, auth.uid()));

CREATE POLICY "Users can delete their workflow templates" 
ON public.workflow_templates 
FOR DELETE 
USING ((auth.uid() = created_by) OR (EXISTS ( 
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['admin'::text, 'hr'::text, 'director'::text])
)) AND can_access_workflow(confidentiality_level, auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_workflow_templates_updated_at
BEFORE UPDATE ON public.workflow_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial templates
INSERT INTO public.workflow_templates (name, description, category, workflow_definition, instructions, prerequisites, example_usage, tags, complexity_level, created_by) VALUES
(
  'Aprovação de Despesas',
  'Template para criar workflows de aprovação de despesas corporativas',
  'financeiro',
  '{"nodes":[{"id":"start","type":"trigger","position":{"x":100,"y":100},"data":{"label":"Solicitação de Despesa","triggerType":"manual"}},{"id":"approval","type":"approval","position":{"x":300,"y":100},"data":{"label":"Aprovação Financeira","approvers":[],"requireAll":false}},{"id":"notification","type":"notification","position":{"x":500,"y":100},"data":{"label":"Notificar Resultado","recipients":[],"template":"Sua solicitação de despesa foi {{status}}"}}],"edges":[{"id":"e1","source":"start","target":"approval"},{"id":"e2","source":"approval","target":"notification"}]}',
  'Configure os aprovadores no nó de aprovação e os destinatários das notificações. Personalize as mensagens conforme necessário.',
  'Definir responsáveis pela aprovação financeira no sistema',
  'Use para aprovações de reembolsos, compras, viagens corporativas',
  ARRAY['aprovação', 'financeiro', 'despesas'],
  'basic',
  '00000000-0000-0000-0000-000000000000'
),
(
  'Onboarding de Funcionários',
  'Workflow completo para integração de novos funcionários',
  'rh',
  '{"nodes":[{"id":"start","type":"trigger","position":{"x":100,"y":100},"data":{"label":"Novo Funcionário","triggerType":"manual"}},{"id":"task1","type":"task","position":{"x":300,"y":100},"data":{"label":"Criar Conta Sistema","assignee":"","description":"Criar conta no sistema e definir permissões"}},{"id":"task2","type":"task","position":{"x":500,"y":100},"data":{"label":"Preparar Equipamentos","assignee":"","description":"Preparar computador, periféricos e acessos"}},{"id":"notification","type":"notification","position":{"x":700,"y":100},"data":{"label":"Boas-vindas","recipients":[],"template":"Bem-vindo à empresa! Seu primeiro dia será {{data.start_date}}"}}],"edges":[{"id":"e1","source":"start","target":"task1"},{"id":"e2","source":"task1","target":"task2"},{"id":"e3","source":"task2","target":"notification"}]}',
  'Personalize as tarefas conforme o processo da sua empresa. Defina responsáveis para cada etapa.',
  'Ter departamento de TI e RH configurados no sistema',
  'Automatize todo o processo de integração de novos colaboradores',
  ARRAY['onboarding', 'rh', 'funcionários'],
  'intermediate',
  '00000000-0000-0000-0000-000000000000'
),
(
  'Revisão de Documentos',
  'Template para revisão e aprovação de documentos corporativos',
  'geral',
  '{"nodes":[{"id":"start","type":"trigger","position":{"x":100,"y":100},"data":{"label":"Documento Submetido","triggerType":"manual"}},{"id":"condition","type":"condition","position":{"x":300,"y":100},"data":{"label":"Verificar Tipo","conditions":[{"field":"document_type","operator":"equals","value":"confidencial"}]}},{"id":"approval1","type":"approval","position":{"x":500,"y":50},"data":{"label":"Aprovação Gerencial","approvers":[],"requireAll":false}},{"id":"approval2","type":"approval","position":{"x":500,"y":150},"data":{"label":"Aprovação Diretoria","approvers":[],"requireAll":true}},{"id":"notification","type":"notification","position":{"x":700,"y":100},"data":{"label":"Documento Aprovado","recipients":[],"template":"Documento {{data.title}} foi aprovado"}}],"edges":[{"id":"e1","source":"start","target":"condition"},{"id":"e2","source":"condition","target":"approval1","condition":"normal"},{"id":"e3","source":"condition","target":"approval2","condition":"confidencial"},{"id":"e4","source":"approval1","target":"notification"},{"id":"e5","source":"approval2","target":"notification"}]}',
  'Configure diferentes níveis de aprovação baseados no tipo de documento. Ajuste as condições conforme necessário.',
  'Definir aprovadores para cada nível hierárquico',
  'Use para políticas internas, manuais, documentos contratuais',
  ARRAY['documentos', 'aprovação', 'revisão'],
  'advanced',
  '00000000-0000-0000-0000-000000000000'
),
(
  'Notificação de Aniversários',
  'Workflow automatizado para parabenizar funcionários em seus aniversários',
  'rh',
  '{"nodes":[{"id":"start","type":"trigger","position":{"x":100,"y":100},"data":{"label":"Aniversário Funcionário","triggerType":"scheduled","schedule":"0 9 * * *"}},{"id":"condition","type":"condition","position":{"x":300,"y":100},"data":{"label":"É Aniversário Hoje?","conditions":[{"field":"birth_date","operator":"equals","value":"today"}]}},{"id":"notification","type":"notification","position":{"x":500,"y":100},"data":{"label":"Parabéns!","recipients":[],"template":"Parabéns {{data.name}}! Desejamos um feliz aniversário!"}}],"edges":[{"id":"e1","source":"start","target":"condition"},{"id":"e2","source":"condition","target":"notification","condition":"true"}]}',
  'Configure o agendamento para executar diariamente e personalizar a mensagem de parabéns.',
  'Ter dados de aniversário dos funcionários no sistema',
  'Automatize o envio de felicitações de aniversário para toda a equipe',
  ARRAY['aniversário', 'rh', 'notificação', 'automático'],
  'basic',
  '00000000-0000-0000-0000-000000000000'
);