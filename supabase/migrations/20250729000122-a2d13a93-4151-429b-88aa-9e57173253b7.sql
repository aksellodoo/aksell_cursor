-- Criar templates pré-construídos para o sistema

-- Templates de Recursos Humanos
INSERT INTO public.workflow_templates (
  name, description, category, workflow_definition, instructions, prerequisites, 
  example_usage, tags, complexity_level, confidentiality_level, created_by
) VALUES 
(
  'Processo de Contratação Completo',
  'Fluxo completo desde a abertura da vaga até a integração do novo funcionário.',
  'rh',
  '{
    "nodes": [
      {"id": "1", "type": "trigger", "position": {"x": 250, "y": 50}, "data": {"label": "Nova vaga aberta", "triggerType": "manual"}},
      {"id": "2", "type": "approval", "position": {"x": 250, "y": 150}, "data": {"label": "Aprovação do orçamento", "approver": "director"}},
      {"id": "3", "type": "task", "position": {"x": 250, "y": 250}, "data": {"label": "Publicar vaga", "assignedTo": "rh"}},
      {"id": "4", "type": "task", "position": {"x": 250, "y": 350}, "data": {"label": "Triagem de currículos", "assignedTo": "rh"}},
      {"id": "5", "type": "task", "position": {"x": 250, "y": 450}, "data": {"label": "Entrevistas", "assignedTo": "manager"}},
      {"id": "6", "type": "approval", "position": {"x": 250, "y": 550}, "data": {"label": "Aprovação final", "approver": "director"}},
      {"id": "7", "type": "task", "position": {"x": 250, "y": 650}, "data": {"label": "Preparar documentação", "assignedTo": "rh"}},
      {"id": "8", "type": "notification", "position": {"x": 250, "y": 750}, "data": {"label": "Notificar início", "recipients": ["candidate", "team"]}}
    ],
    "edges": [
      {"id": "e1-2", "source": "1", "target": "2"},
      {"id": "e2-3", "source": "2", "target": "3"},
      {"id": "e3-4", "source": "3", "target": "4"},
      {"id": "e4-5", "source": "4", "target": "5"},
      {"id": "e5-6", "source": "5", "target": "6"},
      {"id": "e6-7", "source": "6", "target": "7"},
      {"id": "e7-8", "source": "7", "target": "8"}
    ]
  }',
  'Configure os aprovadores de orçamento e contratação. Defina os responsáveis por cada etapa. Personalize as notificações.',
  'Departamento de RH ativo, Aprovadores definidos, Templates de documentos preparados',
  'Abertura de vaga para Analista de Marketing: aprovação → publicação → triagem → entrevistas → contratação',
  ARRAY['contratação', 'rh', 'aprovação', 'onboarding'],
  'intermediate',
  'department_leaders',
  (SELECT id FROM auth.users LIMIT 1)
),
(
  'Solicitação de Férias',
  'Processo padronizado para solicitação e aprovação de férias.',
  'rh', 
  '{
    "nodes": [
      {"id": "1", "type": "trigger", "position": {"x": 250, "y": 50}, "data": {"label": "Solicitação de férias", "triggerType": "user_request"}},
      {"id": "2", "type": "condition", "position": {"x": 250, "y": 150}, "data": {"label": "Tem saldo suficiente?", "condition": "vacation_balance >= requested_days"}},
      {"id": "3", "type": "approval", "position": {"x": 400, "y": 250}, "data": {"label": "Aprovação do gestor", "approver": "direct_manager"}},
      {"id": "4", "type": "task", "position": {"x": 400, "y": 350}, "data": {"label": "Atualizar calendário", "assignedTo": "rh"}},
      {"id": "5", "type": "notification", "position": {"x": 400, "y": 450}, "data": {"label": "Confirmar aprovação", "recipients": ["employee", "team"]}},
      {"id": "6", "type": "notification", "position": {"x": 100, "y": 250}, "data": {"label": "Saldo insuficiente", "recipients": ["employee"]}}
    ],
    "edges": [
      {"id": "e1-2", "source": "1", "target": "2"},
      {"id": "e2-3", "source": "2", "target": "3", "label": "Sim"},
      {"id": "e2-6", "source": "2", "target": "6", "label": "Não"},
      {"id": "e3-4", "source": "3", "target": "4"},
      {"id": "e4-5", "source": "4", "target": "5"}
    ]
  }',
  'Configure o cálculo de saldo de férias. Defina os gestores responsáveis pela aprovação. Configure as notificações.',
  'Sistema de controle de férias integrado, Hierarquia de aprovação definida',
  'Funcionário solicita 10 dias de férias → sistema verifica saldo → gestor aprova → RH atualiza calendário',
  ARRAY['férias', 'aprovação', 'rh', 'gestão'],
  'basic',
  'public',
  (SELECT id FROM auth.users LIMIT 1)
),
(
  'Avaliação de Desempenho',
  'Ciclo completo de avaliação de desempenho com múltiplas etapas.',
  'rh',
  '{
    "nodes": [
      {"id": "1", "type": "trigger", "position": {"x": 250, "y": 50}, "data": {"label": "Iniciar ciclo", "triggerType": "scheduled"}},
      {"id": "2", "type": "task", "position": {"x": 250, "y": 150}, "data": {"label": "Autoavaliação", "assignedTo": "employee"}},
      {"id": "3", "type": "task", "position": {"x": 250, "y": 250}, "data": {"label": "Avaliação do gestor", "assignedTo": "manager"}},
      {"id": "4", "type": "task", "position": {"x": 250, "y": 350}, "data": {"label": "Feedback 360°", "assignedTo": "peers"}},
      {"id": "5", "type": "task", "position": {"x": 250, "y": 450}, "data": {"label": "Reunião de feedback", "assignedTo": "manager"}},
      {"id": "6", "type": "task", "position": {"x": 250, "y": 550}, "data": {"label": "Plano de desenvolvimento", "assignedTo": "rh"}},
      {"id": "7", "type": "notification", "position": {"x": 250, "y": 650}, "data": {"label": "Ciclo finalizado", "recipients": ["employee", "hr"]}}
    ],
    "edges": [
      {"id": "e1-2", "source": "1", "target": "2"},
      {"id": "e2-3", "source": "2", "target": "3"},
      {"id": "e3-4", "source": "3", "target": "4"},
      {"id": "e4-5", "source": "4", "target": "5"},
      {"id": "e5-6", "source": "5", "target": "6"},
      {"id": "e6-7", "source": "6", "target": "7"}
    ]
  }',
  'Configure os períodos de avaliação. Defina os participantes do feedback 360°. Personalize os formulários de avaliação.',
  'Formulários de avaliação criados, Ciclos de avaliação definidos, Colaboradores cadastrados',
  'Avaliação semestral: funcionário se autoavalia → gestor avalia → colegas dão feedback → reunião de desenvolvimento',
  ARRAY['avaliação', 'desempenho', 'feedback', '360', 'desenvolvimento'],
  'advanced',
  'department_leaders',
  (SELECT id FROM auth.users LIMIT 1)
),

-- Templates Financeiros
(
  'Aprovação de Orçamento',
  'Fluxo para aprovação de orçamentos departamentais com múltiplos níveis.',
  'financeiro',
  '{
    "nodes": [
      {"id": "1", "type": "trigger", "position": {"x": 250, "y": 50}, "data": {"label": "Solicitação de orçamento", "triggerType": "manual"}},
      {"id": "2", "type": "condition", "position": {"x": 250, "y": 150}, "data": {"label": "Valor > R$ 10.000?", "condition": "amount > 10000"}},
      {"id": "3", "type": "approval", "position": {"x": 400, "y": 250}, "data": {"label": "Aprovação diretor", "approver": "director"}},
      {"id": "4", "type": "approval", "position": {"x": 100, "y": 250}, "data": {"label": "Aprovação gestor", "approver": "manager"}},
      {"id": "5", "type": "task", "position": {"x": 250, "y": 350}, "data": {"label": "Registrar no sistema", "assignedTo": "finance"}},
      {"id": "6", "type": "notification", "position": {"x": 250, "y": 450}, "data": {"label": "Orçamento aprovado", "recipients": ["requester", "finance"]}}
    ],
    "edges": [
      {"id": "e1-2", "source": "1", "target": "2"},
      {"id": "e2-3", "source": "2", "target": "3", "label": "Sim"},
      {"id": "e2-4", "source": "2", "target": "4", "label": "Não"},
      {"id": "e3-5", "source": "3", "target": "5"},
      {"id": "e4-5", "source": "4", "target": "5"},
      {"id": "e5-6", "source": "5", "target": "6"}
    ]
  }',
  'Configure os limites de aprovação por cargo. Defina os aprovadores para cada nível. Configure as integrações financeiras.',
  'Sistema financeiro integrado, Limites de aprovação definidos, Aprovadores cadastrados',
  'Departamento solicita R$ 15.000 para marketing → vai para diretor → aprovado → registrado no sistema',
  ARRAY['orçamento', 'aprovação', 'financeiro', 'gastos'],
  'intermediate',
  'directors_admins',
  (SELECT id FROM auth.users LIMIT 1)
),
(
  'Processo de Compras',
  'Fluxo completo para aquisição de produtos e serviços.',
  'financeiro',
  '{
    "nodes": [
      {"id": "1", "type": "trigger", "position": {"x": 250, "y": 50}, "data": {"label": "Solicitação de compra", "triggerType": "manual"}},
      {"id": "2", "type": "task", "position": {"x": 250, "y": 150}, "data": {"label": "Pesquisa de fornecedores", "assignedTo": "purchasing"}},
      {"id": "3", "type": "task", "position": {"x": 250, "y": 250}, "data": {"label": "Solicitar cotações", "assignedTo": "purchasing"}},
      {"id": "4", "type": "approval", "position": {"x": 250, "y": 350}, "data": {"label": "Aprovação de compra", "approver": "manager"}},
      {"id": "5", "type": "task", "position": {"x": 250, "y": 450}, "data": {"label": "Emitir pedido", "assignedTo": "purchasing"}},
      {"id": "6", "type": "task", "position": {"x": 250, "y": 550}, "data": {"label": "Acompanhar entrega", "assignedTo": "purchasing"}},
      {"id": "7", "type": "task", "position": {"x": 250, "y": 650}, "data": {"label": "Confirmar recebimento", "assignedTo": "requester"}},
      {"id": "8", "type": "notification", "position": {"x": 250, "y": 750}, "data": {"label": "Compra finalizada", "recipients": ["requester", "finance"]}}
    ],
    "edges": [
      {"id": "e1-2", "source": "1", "target": "2"},
      {"id": "e2-3", "source": "2", "target": "3"},
      {"id": "e3-4", "source": "3", "target": "4"},
      {"id": "e4-5", "source": "4", "target": "5"},
      {"id": "e5-6", "source": "5", "target": "6"},
      {"id": "e6-7", "source": "6", "target": "7"},
      {"id": "e7-8", "source": "7", "target": "8"}
    ]
  }',
  'Configure os fornecedores preferidos. Defina os limites para cotação obrigatória. Configure as aprovações.',
  'Cadastro de fornecedores atualizado, Políticas de compra definidas, Aprovadores configurados',
  'Solicitar 5 notebooks → pesquisar fornecedores → cotar → aprovar → comprar → receber',
  ARRAY['compras', 'fornecedores', 'cotação', 'aprovação'],
  'intermediate',
  'public',
  (SELECT id FROM auth.users LIMIT 1)
),

-- Templates Operacionais
(
  'Chamado de TI',
  'Processo padronizado para abertura e resolução de chamados de TI.',
  'ti',
  '{
    "nodes": [
      {"id": "1", "type": "trigger", "position": {"x": 250, "y": 50}, "data": {"label": "Abrir chamado", "triggerType": "user_request"}},
      {"id": "2", "type": "condition", "position": {"x": 250, "y": 150}, "data": {"label": "Prioridade crítica?", "condition": "priority == critical"}},
      {"id": "3", "type": "notification", "position": {"x": 400, "y": 250}, "data": {"label": "Alerta urgente", "recipients": ["it_manager"]}},
      {"id": "4", "type": "task", "position": {"x": 250, "y": 350}, "data": {"label": "Analisar problema", "assignedTo": "it_support"}},
      {"id": "5", "type": "condition", "position": {"x": 250, "y": 450}, "data": {"label": "Pode resolver?", "condition": "can_resolve == true"}},
      {"id": "6", "type": "task", "position": {"x": 400, "y": 550}, "data": {"label": "Resolver problema", "assignedTo": "it_support"}},
      {"id": "7", "type": "task", "position": {"x": 100, "y": 550}, "data": {"label": "Escalar para especialista", "assignedTo": "it_specialist"}},
      {"id": "8", "type": "notification", "position": {"x": 250, "y": 650}, "data": {"label": "Chamado resolvido", "recipients": ["requester"]}}
    ],
    "edges": [
      {"id": "e1-2", "source": "1", "target": "2"},
      {"id": "e2-3", "source": "2", "target": "3", "label": "Sim"},
      {"id": "e2-4", "source": "2", "target": "4", "label": "Não"},
      {"id": "e3-4", "source": "3", "target": "4"},
      {"id": "e4-5", "source": "4", "target": "5"},
      {"id": "e5-6", "source": "5", "target": "6", "label": "Sim"},
      {"id": "e5-7", "source": "5", "target": "7", "label": "Não"},
      {"id": "e6-8", "source": "6", "target": "8"},
      {"id": "e7-8", "source": "7", "target": "8"}
    ]
  }',
  'Configure os critérios de prioridade. Defina a equipe de TI e especialistas. Configure os SLAs por tipo de chamado.',
  'Equipe de TI cadastrada, Categorias de chamado definidas, SLAs estabelecidos',
  'Usuário reporta problema no sistema → TI analisa → resolve ou escala → notifica solução',
  ARRAY['ti', 'suporte', 'chamado', 'helpdesk'],
  'basic',
  'public',
  (SELECT id FROM auth.users LIMIT 1)
),
(
  'Controle de Qualidade',
  'Processo de inspeção e controle de qualidade de produtos.',
  'operacional',
  '{
    "nodes": [
      {"id": "1", "type": "trigger", "position": {"x": 250, "y": 50}, "data": {"label": "Produto finalizado", "triggerType": "automatic"}},
      {"id": "2", "type": "task", "position": {"x": 250, "y": 150}, "data": {"label": "Inspeção visual", "assignedTo": "quality_inspector"}},
      {"id": "3", "type": "condition", "position": {"x": 250, "y": 250}, "data": {"label": "Passou na inspeção?", "condition": "visual_inspection == approved"}},
      {"id": "4", "type": "task", "position": {"x": 250, "y": 350}, "data": {"label": "Testes funcionais", "assignedTo": "quality_tester"}},
      {"id": "5", "type": "condition", "position": {"x": 250, "y": 450}, "data": {"label": "Passou nos testes?", "condition": "functional_test == approved"}},
      {"id": "6", "type": "task", "position": {"x": 250, "y": 550}, "data": {"label": "Aprovar produto", "assignedTo": "quality_manager"}},
      {"id": "7", "type": "task", "position": {"x": 100, "y": 350}, "data": {"label": "Registrar não conformidade", "assignedTo": "quality_inspector"}},
      {"id": "8", "type": "task", "position": {"x": 100, "y": 450}, "data": {"label": "Devolver para produção", "assignedTo": "production"}}
    ],
    "edges": [
      {"id": "e1-2", "source": "1", "target": "2"},
      {"id": "e2-3", "source": "2", "target": "3"},
      {"id": "e3-4", "source": "3", "target": "4", "label": "Sim"},
      {"id": "e3-7", "source": "3", "target": "7", "label": "Não"},
      {"id": "e4-5", "source": "4", "target": "5"},
      {"id": "e5-6", "source": "5", "target": "6", "label": "Sim"},
      {"id": "e5-8", "source": "5", "target": "8", "label": "Não"},
      {"id": "e7-8", "source": "7", "target": "8"}
    ]
  }',
  'Configure os critérios de qualidade. Defina os inspetores e testadores. Configure as não conformidades.',
  'Padrões de qualidade definidos, Equipe de QC treinada, Checklist de inspeção criado',
  'Produto acabado → inspeção visual → testes funcionais → aprovação ou rejeição',
  ARRAY['qualidade', 'inspeção', 'testes', 'conformidade'],
  'intermediate',
  'department_leaders',
  (SELECT id FROM auth.users LIMIT 1)
),

-- Templates de Vendas/Marketing
(
  'Lead para Oportunidade',
  'Processo de qualificação de leads e conversão em oportunidades.',
  'vendas',
  '{
    "nodes": [
      {"id": "1", "type": "trigger", "position": {"x": 250, "y": 50}, "data": {"label": "Novo lead", "triggerType": "automatic"}},
      {"id": "2", "type": "task", "position": {"x": 250, "y": 150}, "data": {"label": "Qualificar lead", "assignedTo": "sales_sdr"}},
      {"id": "3", "type": "condition", "position": {"x": 250, "y": 250}, "data": {"label": "Lead qualificado?", "condition": "qualification_score >= 70"}},
      {"id": "4", "type": "task", "position": {"x": 400, "y": 350}, "data": {"label": "Agendar reunião", "assignedTo": "sales_sdr"}},
      {"id": "5", "type": "task", "position": {"x": 400, "y": 450}, "data": {"label": "Realizar apresentação", "assignedTo": "sales_rep"}},
      {"id": "6", "type": "task", "position": {"x": 400, "y": 550}, "data": {"label": "Enviar proposta", "assignedTo": "sales_rep"}},
      {"id": "7", "type": "task", "position": {"x": 100, "y": 350}, "data": {"label": "Nutrir lead", "assignedTo": "marketing"}},
      {"id": "8", "type": "notification", "position": {"x": 400, "y": 650}, "data": {"label": "Oportunidade criada", "recipients": ["sales_manager"]}}
    ],
    "edges": [
      {"id": "e1-2", "source": "1", "target": "2"},
      {"id": "e2-3", "source": "2", "target": "3"},
      {"id": "e3-4", "source": "3", "target": "4", "label": "Sim"},
      {"id": "e3-7", "source": "3", "target": "7", "label": "Não"},
      {"id": "e4-5", "source": "4", "target": "5"},
      {"id": "e5-6", "source": "5", "target": "6"},
      {"id": "e6-8", "source": "6", "target": "8"}
    ]
  }',
  'Configure os critérios de qualificação. Defina a equipe de vendas. Configure as integrações com CRM.',
  'CRM configurado, Critérios de qualificação definidos, Equipe de vendas treinada',
  'Lead do site → SDR qualifica → agenda reunião → vendedor apresenta → envia proposta',
  ARRAY['vendas', 'leads', 'qualificação', 'crm', 'oportunidade'],
  'intermediate',
  'public',
  (SELECT id FROM auth.users LIMIT 1)
),
(
  'Onboarding de Cliente',
  'Processo de integração de novos clientes ao serviço.',
  'vendas',
  '{
    "nodes": [
      {"id": "1", "type": "trigger", "position": {"x": 250, "y": 50}, "data": {"label": "Contrato assinado", "triggerType": "automatic"}},
      {"id": "2", "type": "task", "position": {"x": 250, "y": 150}, "data": {"label": "Boas-vindas", "assignedTo": "customer_success"}},
      {"id": "3", "type": "task", "position": {"x": 250, "y": 250}, "data": {"label": "Configuração inicial", "assignedTo": "technical_team"}},
      {"id": "4", "type": "task", "position": {"x": 250, "y": 350}, "data": {"label": "Treinamento", "assignedTo": "customer_success"}},
      {"id": "5", "type": "task", "position": {"x": 250, "y": 450}, "data": {"label": "Primeiro check-in", "assignedTo": "customer_success"}},
      {"id": "6", "type": "delay", "position": {"x": 250, "y": 550}, "data": {"label": "Aguardar 30 dias", "duration": "30d"}},
      {"id": "7", "type": "task", "position": {"x": 250, "y": 650}, "data": {"label": "Pesquisa de satisfação", "assignedTo": "customer_success"}},
      {"id": "8", "type": "notification", "position": {"x": 250, "y": 750}, "data": {"label": "Onboarding concluído", "recipients": ["sales_manager", "cs_manager"]}}
    ],
    "edges": [
      {"id": "e1-2", "source": "1", "target": "2"},
      {"id": "e2-3", "source": "2", "target": "3"},
      {"id": "e3-4", "source": "3", "target": "4"},
      {"id": "e4-5", "source": "4", "target": "5"},
      {"id": "e5-6", "source": "5", "target": "6"},
      {"id": "e6-7", "source": "6", "target": "7"},
      {"id": "e7-8", "source": "7", "target": "8"}
    ]
  }',
  'Configure os materiais de boas-vindas. Defina a equipe de Customer Success. Configure os treinamentos.',
  'Equipe de CS treinada, Materiais de onboarding prontos, Templates de comunicação criados',
  'Cliente assina contrato → recebe boas-vindas → configura sistema → treina → acompanha resultado',
  ARRAY['cliente', 'onboarding', 'treinamento', 'customer-success'],
  'intermediate',
  'public',
  (SELECT id FROM auth.users LIMIT 1)
),

-- Templates Gerais/Administrativos
(
  'Gestão de Documentos Confidenciais',
  'Fluxo para criação, revisão e aprovação de documentos confidenciais.',
  'geral',
  '{
    "nodes": [
      {"id": "1", "type": "trigger", "position": {"x": 250, "y": 50}, "data": {"label": "Criar documento", "triggerType": "manual"}},
      {"id": "2", "type": "task", "position": {"x": 250, "y": 150}, "data": {"label": "Redigir conteúdo", "assignedTo": "content_creator"}},
      {"id": "3", "type": "task", "position": {"x": 250, "y": 250}, "data": {"label": "Revisão técnica", "assignedTo": "technical_reviewer"}},
      {"id": "4", "type": "task", "position": {"x": 250, "y": 350}, "data": {"label": "Revisão legal", "assignedTo": "legal_team"}},
      {"id": "5", "type": "approval", "position": {"x": 250, "y": 450}, "data": {"label": "Aprovação final", "approver": "director"}},
      {"id": "6", "type": "task", "position": {"x": 250, "y": 550}, "data": {"label": "Classificar documento", "assignedTo": "admin"}},
      {"id": "7", "type": "task", "position": {"x": 250, "y": 650}, "data": {"label": "Arquivar seguramente", "assignedTo": "admin"}},
      {"id": "8", "type": "notification", "position": {"x": 250, "y": 750}, "data": {"label": "Documento disponível", "recipients": ["authorized_users"]}}
    ],
    "edges": [
      {"id": "e1-2", "source": "1", "target": "2"},
      {"id": "e2-3", "source": "2", "target": "3"},
      {"id": "e3-4", "source": "3", "target": "4"},
      {"id": "e4-5", "source": "4", "target": "5"},
      {"id": "e5-6", "source": "5", "target": "6"},
      {"id": "e6-7", "source": "6", "target": "7"},
      {"id": "e7-8", "source": "7", "target": "8"}
    ]
  }',
  'Configure os níveis de confidencialidade. Defina os revisores por área. Configure o sistema de arquivo.',
  'Política de confidencialidade definida, Revisores designados, Sistema de arquivo configurado',
  'Criar contrato → redigir → revisar tecnicamente → revisar legalmente → aprovar → classificar → arquivar',
  ARRAY['documentos', 'confidencial', 'aprovação', 'arquivo', 'revisão'],
  'advanced',
  'directors_admins',
  (SELECT id FROM auth.users LIMIT 1)
);

-- Atualizar usage_count dos templates existentes para simular uso
UPDATE public.workflow_templates 
SET usage_count = floor(random() * 50 + 1)::integer
WHERE usage_count = 0;