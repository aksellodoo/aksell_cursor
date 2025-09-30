
import React, { useState, useCallback, useMemo } from 'react';
import { useWorkflows } from '@/hooks/useWorkflows';
import { useWorkflowExecution } from '@/hooks/useWorkflowExecution';
import { useProfiles } from '@/hooks/useProfiles';
import { useDepartments } from '@/hooks/useDepartments';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Play, AlertCircle, CheckCircle, Clock, Users, Zap, Target, Settings, Database, Trash2 } from 'lucide-react';

interface TestResult {
  testName: string;
  category: string;
  workflowId?: string;
  executionId?: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  error?: string;
  duration?: number;
  details?: any;
}

export const WorkflowTester = () => {
  const { createWorkflow, deleteWorkflow } = useWorkflows();
  const { executeWorkflow } = useWorkflowExecution();
  const { profiles } = useProfiles();
  const { departments } = useDepartments();
  
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [currentCategory, setCurrentCategory] = useState<string>('');
  const [isCleaningData, setIsCleaningData] = useState(false);
  const [cleanupResults, setCleanupResults] = useState<{workflows: number, executions: number, tasks: number, messages: number} | null>(null);

  // Get test users and departments - Enhanced with better filtering
  const getTestData = useMemo(() => {
    if (!profiles.length || !departments.length) {
      return { users: {}, departments: {} };
    }
    
    console.log('📋 Available profiles:', profiles.length);
    console.log('📋 Available departments:', departments.length);
    
    // Filter for test users only - use only test accounts
    const testProfiles = profiles.filter(p => 
      p.email.toLowerCase().includes('test') || p.name.includes('[TEST]')
    );
    
    const testUsers = {
      admin: testProfiles.find(p => p.role === 'admin' && p.status === 'active'),
      hr: testProfiles.find(p => p.role === 'hr' && p.status === 'active'),
      director: testProfiles.find(p => p.role === 'director' && p.status === 'active'),
      leader: testProfiles.find(p => p.is_leader && p.status === 'active'),
      user: testProfiles.find(p => p.role === 'user' && p.status === 'active'),
      inactive: testProfiles.find(p => p.status === 'inactive'),
      current: testProfiles[0] || testProfiles.find(p => p.status === 'active') // Only test users
    };

    const testDepts = {
      hr: departments.find(d => d.name === 'Recursos Humanos [TEST]'),
      it: departments.find(d => d.name === 'Tecnologia da Informação [TEST]'),
      sales: departments.find(d => d.name === 'Vendas [TEST]'),
      exec: departments.find(d => d.name === 'Executivo [TEST]'),
      general: departments.find(d => d.name.toLowerCase().includes('geral'))
    };

    console.log('🎯 Test users found:', {
      hr: testUsers.hr?.name,
      director: testUsers.director?.name,
      user: testUsers.user?.name,
      inactive: testUsers.inactive?.name,
      leader: testUsers.leader?.name
    });

    console.log('🎯 Test departments found:', {
      hr: testDepts.hr?.name,
      it: testDepts.it?.name,
      sales: testDepts.sales?.name,
      exec: testDepts.exec?.name,
      general: testDepts.general?.name
    });

    return { users: testUsers, departments: testDepts };
  }, [profiles, departments]);

  const updateTestResult = useCallback((testName: string, updates: Partial<TestResult>) => {
    setTestResults(prev => prev.map(result => 
      result.testName === testName ? { ...result, ...updates } : result
    ));
  }, []);

  const addTestResult = useCallback((result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  }, []);

  // Função para identificar e limpar dados de teste
  const cleanupTestData = async () => {
    setIsCleaningData(true);
    setCleanupResults(null);
    
    try {
      console.log('🧹 Iniciando limpeza de dados de teste...');
      
      // 1. Buscar usuários de teste
      const { data: testUsers } = await supabase
        .from('profiles')
        .select('id')
        .or('name.ilike.%[TEST]%,email.ilike.%test%');
      
      if (!testUsers?.length) {
        toast.info('Nenhum usuário de teste encontrado');
        return;
      }
      
      const testUserIds = testUsers.map(u => u.id);
      
      // 2. Buscar e deletar workflows criados por usuários teste
      const { data: testWorkflows } = await supabase
        .from('workflows')
        .select('id')
        .in('created_by', testUserIds);
      
      const workflowIds = testWorkflows?.map(w => w.id) || [];
      
      // 3. Deletar execuções de workflow relacionadas
      let executionsDeleted = 0;
      if (workflowIds.length > 0) {
        const { count } = await supabase
          .from('workflow_executions')
          .delete({ count: 'exact' })
          .in('workflow_id', workflowIds);
        executionsDeleted = count || 0;
      }
      
      // 4. Buscar executions para deletar steps
      if (workflowIds.length > 0) {
        const { data: executions } = await supabase
          .from('workflow_executions')
          .select('id')
          .in('workflow_id', workflowIds);
        
        if (executions?.length) {
          const executionIds = executions.map(e => e.id);
          await supabase
            .from('workflow_execution_steps')
            .delete()
            .in('execution_id', executionIds);
        }
      }
      
      // 5. Deletar workflows de teste
      let workflowsDeleted = 0;
      if (workflowIds.length > 0) {
        const { count } = await supabase
          .from('workflows')
          .delete({ count: 'exact' })
          .in('id', workflowIds);
        workflowsDeleted = count || 0;
      }
      
      // 6. Deletar tarefas criadas por usuários teste
      const { count: tasksDeleted } = await supabase
        .from('tasks')
        .delete({ count: 'exact' })
        .in('created_by', testUserIds);
      
      // 7. Deletar mensagens de chatter de usuários teste
      const { count: messagesDeleted } = await supabase
        .from('chatter_messages')
        .delete({ count: 'exact' })
        .in('author_id', testUserIds);
      
      const results = {
        workflows: workflowsDeleted || 0,
        executions: executionsDeleted || 0,
        tasks: tasksDeleted || 0,
        messages: messagesDeleted || 0
      };
      
      setCleanupResults(results);
      
      console.log('✅ Limpeza concluída:', results);
      toast.success(
        `Limpeza concluída! Removidos: ${results.workflows} workflows, ${results.executions} execuções, ${results.tasks} tarefas, ${results.messages} mensagens`
      );
      
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
      toast.error('Erro ao limpar dados de teste: ' + (error as Error).message);
    } finally {
      setIsCleaningData(false);
    }
  };

  // Helper function to clean up workflow executions
  const cleanupWorkflowExecutions = async (workflowId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('workflow_executions')
        .delete()
        .eq('workflow_id', workflowId);
      
      if (error) {
        console.warn(`⚠️ Warning cleaning executions for workflow ${workflowId}:`, error.message);
      }
    } catch (error) {
      console.warn(`⚠️ Warning cleaning executions:`, error);
    }
  };

  // Helper function to create and execute workflow
  const executeTest = async (
    testName: string, 
    category: string, 
    workflowDefinition: any, 
    triggerData: any = {},
    workflowConfig: any = {}
  ): Promise<TestResult> => {
    const start = Date.now();
    let workflowId: string | undefined;
    let retryCount = 0;
    const maxRetries = 2;
    
    try {
      console.log(`🧪 Starting test: ${testName}`);
      addTestResult({ testName, category, status: 'running' });
      setCurrentTest(testName);

      const workflow = await createWorkflow({
        name: `[TEST] ${testName}`,
        description: `Teste automatizado: ${category}`,
        workflow_definition: workflowDefinition,
        trigger_type: 'manual',
        workflow_type: 'manual',
        confidentiality_level: 'public',
        priority: 'medium',
        tags: ['test', 'automated'],
        status: 'active',
        ...workflowConfig
      });

      if (!workflow) {
        throw new Error('Falha ao criar workflow');
      }

      workflowId = workflow.id;
      console.log(`📝 Workflow criado: ${workflowId}`);

      // Executar o workflow com retry
      let executionResult;
      while (retryCount <= maxRetries) {
        try {
          executionResult = await executeWorkflow(workflowId, triggerData);
          if (executionResult.success) break;
          
          if (retryCount < maxRetries) {
            console.log(`🔄 Tentativa ${retryCount + 1} falhou, tentando novamente...`);
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            throw new Error(executionResult.error || 'Falha na execução do workflow');
          }
        } catch (error) {
          if (retryCount < maxRetries) {
            console.log(`🔄 Tentativa ${retryCount + 1} falhou, tentando novamente...`);
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            throw error;
          }
        }
      }

      if (!executionResult?.success) {
        throw new Error(executionResult?.error || 'Falha na execução do workflow');
      }

      console.log(`✅ Teste concluído com sucesso: ${testName}`);
      const duration = Date.now() - start;
      
      const result: TestResult = {
        testName,
        category,
        status: 'success',
        workflowId,
        executionId: executionResult.executionId,
        duration,
        details: executionResult
      };

      updateTestResult(testName, result);
      return result;

    } catch (error: any) {
      console.error(`❌ Erro no teste ${testName}:`, error);
      const duration = Date.now() - start;
      
      const result: TestResult = {
        testName,
        category,
        status: 'failed',
        workflowId,
        duration,
        error: error.message || 'Erro desconhecido'
      };

      updateTestResult(testName, result);
      return result;

    } finally {
      // Limpeza do workflow de teste
      if (workflowId) {
        try {
          // Primeiro limpar execuções relacionadas
          await cleanupWorkflowExecutions(workflowId);
          // Aguardar um pouco antes de deletar o workflow
          await new Promise(resolve => setTimeout(resolve, 500));
          // Depois deletar o workflow
          await deleteWorkflow(workflowId);
          console.log(`🗑️ Workflow de teste removido: ${workflowId}`);
        } catch (cleanupError) {
          console.warn(`⚠️ Aviso: Falha ao remover workflow de teste ${workflowId}:`, cleanupError);
        }
      }
      setCurrentTest(null);
    }
  };

  // =============================================================================
  // CATEGORIA A: TESTES BÁSICOS
  // =============================================================================

  const runBasicTests = async () => {
    setCurrentCategory('Testes Básicos');
    const { users, departments } = getTestData;

    if (!users || typeof users !== 'object' || !('user' in users) || !('director' in users) || !users.user || !users.director) {
      toast.error('❌ Usuários de teste não encontrados! Verifique se os perfis foram criados corretamente.');
      return;
    }

    // A1: Workflow Simples
    await executeTest(
      'A1: Workflow Simples (Trigger → Tarefa)',
      'Básico',
      {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: { label: 'Início', triggerType: 'manual' }
          },
          {
            id: 'task-1',
            type: 'task',
            position: { x: 300, y: 100 },
            data: {
              label: 'Tarefa Simples',
              taskTitle: 'Revisar documento de teste',
              taskDescription: 'Revisar documento criado pelo teste automatizado',
              taskAssignee: users.user.id
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'task-1' }
        ]
      },
      { simple_test: true, assigned_user: users.user.name }
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // A2: Workflow com Notificação
    await executeTest(
      'A2: Workflow com Notificação (Trigger → Tarefa → Notificação)',
      'Básico',
      {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: { label: 'Início', triggerType: 'manual' }
          },
          {
            id: 'task-1',
            type: 'task',
            position: { x: 300, y: 100 },
            data: {
              label: 'Criar Relatório',
              taskTitle: 'Criar relatório mensal',
              taskDescription: 'Criar relatório mensal de vendas para teste',
              taskAssignee: users.user.id
            }
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 500, y: 100 },
            data: {
              label: 'Notificar Conclusão',
              notificationTitle: 'Tarefa de relatório concluída',
              notificationMessage: 'O relatório mensal foi criado com sucesso.',
              notificationRecipient: 'task_creator'
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'task-1' },
          { id: 'e2', source: 'task-1', target: 'notification-1' }
        ]
      },
      { notification_test: true, report_type: 'monthly' }
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // A3: Workflow Sequencial
    await executeTest(
      'A3: Workflow Sequencial (3 Tarefas em Sequência)',
      'Básico',
      {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 50, y: 100 },
            data: { label: 'Início', triggerType: 'manual' }
          },
          {
            id: 'task-1',
            type: 'task',
            position: { x: 200, y: 100 },
            data: {
              label: 'Tarefa 1 - Preparação',
              taskTitle: 'Preparar dados para análise',
              taskDescription: 'Coletar e organizar dados para análise',
              taskAssignee: users.user.id
            }
          },
          {
            id: 'task-2',
            type: 'task',
            position: { x: 350, y: 100 },
            data: {
              label: 'Tarefa 2 - Análise',
              taskTitle: 'Analisar dados coletados',
              taskDescription: 'Realizar análise detalhada dos dados',
              taskAssignee: users.leader?.id || users.user.id
            }
          },
          {
            id: 'task-3',
            type: 'task',
            position: { x: 500, y: 100 },
            data: {
              label: 'Tarefa 3 - Relatório',
              taskTitle: 'Gerar relatório final',
              taskDescription: 'Consolidar análise em relatório executivo',
              taskAssignee: users.director.id
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'task-1' },
          { id: 'e2', source: 'task-1', target: 'task-2' },
          { id: 'e3', source: 'task-2', target: 'task-3' }
        ]
      },
      { sequential_test: true, process_type: 'data_analysis' }
    );
  };

  // =============================================================================
  // CATEGORIA B: TESTES CONDICIONAIS
  // =============================================================================

  const runConditionalTests = async () => {
    setCurrentCategory('Testes Condicionais');
    const { users } = getTestData;

    if (!users || typeof users !== 'object' || !('user' in users) || !('director' in users) || !users.user || !users.director) {
      toast.error('❌ Usuários de teste não encontrados!');
      return;
    }

    // B1: Condição Simples
    await executeTest(
      'B1: Condição Simples (Se urgente → Tarefa A, senão → Tarefa B)',
      'Condicional',
      {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 200 },
            data: { label: 'Início', triggerType: 'manual' }
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 300, y: 200 },
            data: {
              label: 'É Urgente?',
              conditionType: 'variable_check',
              variableName: 'priority',
              operator: 'equals',
              value: 'urgent'
            }
          },
          {
            id: 'task-urgent',
            type: 'task',
            position: { x: 500, y: 100 },
            data: {
              label: 'Tarefa Urgente',
              taskTitle: 'Processar Solicitação URGENTE',
              taskDescription: 'Processar com máxima prioridade',
              taskAssignee: users.director.id
            }
          },
          {
            id: 'task-normal',
            type: 'task',
            position: { x: 500, y: 300 },
            data: {
              label: 'Tarefa Normal',
              taskTitle: 'Processar Solicitação Normal',
              taskDescription: 'Processar em tempo normal',
              taskAssignee: users.user.id
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'condition-1' },
          { id: 'e2', source: 'condition-1', target: 'task-urgent', sourceHandle: 'true' },
          { id: 'e3', source: 'condition-1', target: 'task-normal', sourceHandle: 'false' }
        ]
      },
      { priority: 'urgent', conditional_test: true, request_type: 'urgent_processing' }
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // B2: Condições Aninhadas
    await executeTest(
      'B2: Condições Aninhadas (Múltiplas condições)',
      'Condicional',
      {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 50, y: 200 },
            data: { label: 'Início', triggerType: 'manual' }
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 200, y: 200 },
            data: {
              label: 'Condição 1: Departamento',
              conditionType: 'variable_check',
              variableName: 'department',
              operator: 'equals',
              value: 'IT'
            }
          },
          {
            id: 'condition-2',
            type: 'condition',
            position: { x: 350, y: 100 },
            data: {
              label: 'Condição 2: É Líder?',
              conditionType: 'variable_check',
              variableName: 'is_leader',
              operator: 'equals',
              value: 'true'
            }
          },
          {
            id: 'task-it-leader',
            type: 'task',
            position: { x: 500, y: 50 },
            data: {
              label: 'Tarefa IT Líder',
              taskTitle: 'Tarefa para líder de TI',
              taskDescription: 'Tarefa específica para líder de TI',
              taskAssignee: users.director.id
            }
          },
          {
            id: 'task-it-user',
            type: 'task',
            position: { x: 500, y: 150 },
            data: {
              label: 'Tarefa IT Usuário',
              taskTitle: 'Tarefa para usuário de TI',
              taskDescription: 'Tarefa para usuário comum de TI',
              taskAssignee: users.user.id
            }
          },
          {
            id: 'task-other',
            type: 'task',
            position: { x: 500, y: 300 },
            data: {
              label: 'Tarefa Outros',
              taskTitle: 'Tarefa para outros departamentos',
              taskDescription: 'Tarefa para departamentos não-TI',
              taskAssignee: users.user.id
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'condition-1' },
          { id: 'e2', source: 'condition-1', target: 'condition-2', sourceHandle: 'true' },
          { id: 'e3', source: 'condition-1', target: 'task-other', sourceHandle: 'false' },
          { id: 'e4', source: 'condition-2', target: 'task-it-leader', sourceHandle: 'true' },
          { id: 'e5', source: 'condition-2', target: 'task-it-user', sourceHandle: 'false' }
        ]
      },
      { department: 'IT', is_leader: 'true', nested_conditional_test: true }
    );
  };

  // =============================================================================
  // CATEGORIA C: TESTES DE APROVAÇÃO
  // =============================================================================

  const runApprovalTests = async () => {
    setCurrentCategory('Testes de Aprovação');
    const { users } = getTestData;

    if (!users || typeof users !== 'object' || !('user' in users) || !('director' in users) || !('leader' in users) || !users.user || !users.director || !users.leader) {
      toast.error('❌ Usuários de teste não encontrados para testes de aprovação!');
      return;
    }

    // C1: Aprovação Simples
    await executeTest(
      'C1: Aprovação Simples (Tarefa → Aprovação → Resultado)',
      'Aprovação',
      {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 150 },
            data: { label: 'Início', triggerType: 'manual' }
          },
          {
            id: 'task-1',
            type: 'task',
            position: { x: 300, y: 150 },
            data: {
              label: 'Criar Proposta',
              taskTitle: 'Criar proposta comercial',
              taskDescription: 'Elaborar proposta comercial para cliente',
              taskAssignee: users.user.id
            }
          },
          {
            id: 'approval-1',
            type: 'approval',
            position: { x: 500, y: 150 },
            data: {
              label: 'Aprovação Gerencial',
              approvalTitle: 'Aprovar proposta comercial',
              approvalDescription: 'Revisar e aprovar proposta para cliente',
              approver: users.leader.id
            }
          },
          {
            id: 'notification-approved',
            type: 'notification',
            position: { x: 700, y: 100 },
            data: {
              label: 'Notificar Aprovação',
              notificationTitle: 'Proposta aprovada',
              notificationMessage: 'Sua proposta comercial foi aprovada.',
              notificationRecipient: 'task_assignee'
            }
          },
          {
            id: 'notification-rejected',
            type: 'notification',
            position: { x: 700, y: 200 },
            data: {
              label: 'Notificar Rejeição',
              notificationTitle: 'Proposta rejeitada',
              notificationMessage: 'Sua proposta comercial foi rejeitada.',
              notificationRecipient: 'task_assignee'
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'task-1' },
          { id: 'e2', source: 'task-1', target: 'approval-1' },
          { id: 'e3', source: 'approval-1', target: 'notification-approved', sourceHandle: 'approved' },
          { id: 'e4', source: 'approval-1', target: 'notification-rejected', sourceHandle: 'rejected' }
        ]
      },
      { client: 'Empresa XYZ', proposal_value: 50000, approval_test: true }
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // C2: Aprovação Hierárquica
    await executeTest(
      'C2: Aprovação Hierárquica (Usuário → Líder → Diretor)',
      'Aprovação',
      {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 50, y: 200 },
            data: { label: 'Início', triggerType: 'manual' }
          },
          {
            id: 'approval-leader',
            type: 'approval',
            position: { x: 200, y: 200 },
            data: {
              label: 'Aprovação Líder',
              approvalTitle: 'Aprovação do líder',
              approvalDescription: 'Primeira aprovação hierárquica',
              approver: users.leader.id
            }
          },
          {
            id: 'approval-director',
            type: 'approval',
            position: { x: 400, y: 150 },
            data: {
              label: 'Aprovação Diretor',
              approvalTitle: 'Aprovação do diretor',
              approvalDescription: 'Segunda aprovação hierárquica',
              approver: users.director.id
            }
          },
          {
            id: 'task-final',
            type: 'task',
            position: { x: 600, y: 150 },
            data: {
              label: 'Executar Aprovado',
              taskTitle: 'Executar ação aprovada',
              taskDescription: 'Executar após dupla aprovação',
              taskAssignee: users.user.id
            }
          },
          {
            id: 'notification-rejected',
            type: 'notification',
            position: { x: 400, y: 300 },
            data: {
              label: 'Notificar Rejeição',
              notificationTitle: 'Solicitação rejeitada',
              notificationMessage: 'Sua solicitação foi rejeitada na aprovação hierárquica.',
              notificationRecipient: 'workflow_creator'
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'approval-leader' },
          { id: 'e2', source: 'approval-leader', target: 'approval-director', sourceHandle: 'approved' },
          { id: 'e3', source: 'approval-leader', target: 'notification-rejected', sourceHandle: 'rejected' },
          { id: 'e4', source: 'approval-director', target: 'task-final', sourceHandle: 'approved' },
          { id: 'e5', source: 'approval-director', target: 'notification-rejected', sourceHandle: 'rejected' }
        ]
      },
      { hierarchical_approval: true, amount: 100000, request_type: 'high_value' }
    );
  };

  // =============================================================================
  // CATEGORIA D: TESTES DE DESTINATÁRIOS
  // =============================================================================

  const runRecipientTests = async () => {
    setCurrentCategory('Testes de Destinatários');
    const { users } = getTestData;

    if (!users || typeof users !== 'object' || !('user' in users) || !('director' in users) || !users.user || !users.director) {
      toast.error('❌ Usuários de teste não encontrados para testes de destinatários!');
      return;
    }

    // D1: Destinatários Especiais
    await executeTest(
      'D1: Destinatários Especiais (task_assignee, task_creator, workflow_creator)',
      'Destinatários',
      {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 50, y: 150 },
            data: { label: 'Início', triggerType: 'manual' }
          },
          {
            id: 'task-1',
            type: 'task',
            position: { x: 200, y: 150 },
            data: {
              label: 'Tarefa Principal',
              taskTitle: 'Executar tarefa para teste',
              taskDescription: 'Tarefa para testar diferentes tipos de destinatários',
              taskAssignee: users.user.id
            }
          },
          {
            id: 'notification-assignee',
            type: 'notification',
            position: { x: 400, y: 50 },
            data: {
              label: 'Notificar Responsável',
              notificationTitle: 'Notificação para o responsável',
              notificationMessage: 'Esta notificação é para o responsável da tarefa.',
              notificationRecipient: 'task_assignee'
            }
          },
          {
            id: 'notification-creator',
            type: 'notification',
            position: { x: 400, y: 150 },
            data: {
              label: 'Notificar Criador Tarefa',
              notificationTitle: 'Notificação para o criador da tarefa',
              notificationMessage: 'Esta notificação é para o criador da tarefa.',
              notificationRecipient: 'task_creator'
            }
          },
          {
            id: 'notification-workflow',
            type: 'notification',
            position: { x: 400, y: 250 },
            data: {
              label: 'Notificar Criador Workflow',
              notificationTitle: 'Notificação para o criador do workflow',
              notificationMessage: 'Esta notificação é para o criador do workflow.',
              notificationRecipient: 'workflow_creator'
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'task-1' },
          { id: 'e2', source: 'task-1', target: 'notification-assignee' },
          { id: 'e3', source: 'task-1', target: 'notification-creator' },
          { id: 'e4', source: 'task-1', target: 'notification-workflow' }
        ]
      },
      { recipient_test: true, test_type: 'special_recipients' }
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // D2: Notificação por UUID
    await executeTest(
      'D2: Notificação por UUID (Usuário específico)',
      'Destinatários',
      {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: { label: 'Início', triggerType: 'manual' }
          },
          {
            id: 'notification-uuid',
            type: 'notification',
            position: { x: 300, y: 100 },
            data: {
              label: 'Notificar UUID',
              notificationTitle: 'Notificação para usuário específico',
              notificationMessage: 'Esta notificação é direcionada para um usuário específico via UUID.',
              notificationRecipient: users.director.id
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'notification-uuid' }
        ]
      },
      { uuid_notification_test: true, target_user: users.director.name }
    );
  };

  // =============================================================================
  // CATEGORIA E: TESTES DE TIMING/DELAY
  // =============================================================================

  const runTimingTests = async () => {
    setCurrentCategory('Testes de Timing');
    const { users } = getTestData;

    if (!users || typeof users !== 'object' || !('user' in users) || !users.user) {
      toast.error('❌ Usuários de teste não encontrados para testes de timing!');
      return;
    }

    // E1: Delay Simples
    await executeTest(
      'E1: Delay Simples (Trigger → Delay 10s → Tarefa)',
      'Timing',
      {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 150 },
            data: { label: 'Início', triggerType: 'manual' }
          },
          {
            id: 'delay-1',
            type: 'delay',
            position: { x: 300, y: 150 },
            data: {
              label: 'Aguardar 10s',
              delayType: 'duration',
              delayAmount: '10',
              delayUnit: 'seconds'
            }
          },
          {
            id: 'task-1',
            type: 'task',
            position: { x: 500, y: 150 },
            data: {
              label: 'Tarefa Após Delay',
              taskTitle: 'Executar após delay',
              taskDescription: 'Tarefa executada após delay de 10 segundos',
              taskAssignee: users.user.id
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'delay-1' },
          { id: 'e2', source: 'delay-1', target: 'task-1' }
        ]
      },
      { simple_delay_test: true, delay_duration: 10 }
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // E2: Múltiplos Delays
    await executeTest(
      'E2: Múltiplos Delays (Delays em sequência)',
      'Timing',
      {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 50, y: 150 },
            data: { label: 'Início', triggerType: 'manual' }
          },
          {
            id: 'task-1',
            type: 'task',
            position: { x: 200, y: 150 },
            data: {
              label: 'Tarefa Inicial',
              taskTitle: 'Tarefa inicial',
              taskDescription: 'Primeira tarefa antes dos delays',
              taskAssignee: users.user.id
            }
          },
          {
            id: 'delay-1',
            type: 'delay',
            position: { x: 350, y: 150 },
            data: {
              label: 'Delay 5s',
              delayType: 'duration',
              delayAmount: '5',
              delayUnit: 'seconds'
            }
          },
          {
            id: 'task-2',
            type: 'task',
            position: { x: 500, y: 150 },
            data: {
              label: 'Tarefa Intermediária',
              taskTitle: 'Tarefa intermediária',
              taskDescription: 'Tarefa após primeiro delay',
              taskAssignee: users.user.id
            }
          },
          {
            id: 'delay-2',
            type: 'delay',
            position: { x: 650, y: 150 },
            data: {
              label: 'Delay 3s',
              delayType: 'duration',
              delayAmount: '3',
              delayUnit: 'seconds'
            }
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 800, y: 150 },
            data: {
              label: 'Notificação Final',
              notificationTitle: 'Workflow de delays concluído',
              notificationMessage: 'O workflow com múltiplos delays foi concluído com sucesso.',
              notificationRecipient: 'workflow_creator'
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'task-1' },
          { id: 'e2', source: 'task-1', target: 'delay-1' },
          { id: 'e3', source: 'delay-1', target: 'task-2' },
          { id: 'e4', source: 'task-2', target: 'delay-2' },
          { id: 'e5', source: 'delay-2', target: 'notification-1' }
        ]
      },
      { multiple_delays_test: true, total_delay: 8 }
    );
  };

  // =============================================================================
  // CATEGORIA F: TESTES DE EDGE CASES
  // =============================================================================

  const runEdgeCaseTests = async () => {
    setCurrentCategory('Testes de Edge Cases');
    const { users } = getTestData;

    // Validação com fallbacks para edge cases
    const hasUsers = users && typeof users === 'object';

    // F1: Usuário Inexistente
    await executeTest(
      'F1: Usuário Inexistente (UUID inválido)',
      'Edge Cases',
      {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: { label: 'Início', triggerType: 'manual' }
          },
          {
            id: 'task-1',
            type: 'task',
            position: { x: 300, y: 100 },
            data: {
              label: 'Tarefa UUID Inválido',
              taskTitle: 'Tarefa para usuário inexistente',
              taskDescription: 'Teste com UUID inválido para verificar tratamento de erro',
              taskAssignee: '00000000-0000-0000-0000-000000000000'
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'task-1' }
        ]
      },
      { invalid_user_test: true, error_expected: true }
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // F2: Usuário Inativo
    if (hasUsers && 'inactive' in users && users.inactive) {
      await executeTest(
        'F2: Usuário Inativo (Status inactive)',
        'Edge Cases',
        {
          nodes: [
            {
              id: 'trigger-1',
              type: 'trigger',
              position: { x: 100, y: 100 },
              data: { label: 'Início', triggerType: 'manual' }
            },
            {
              id: 'task-1',
              type: 'task',
              position: { x: 300, y: 100 },
              data: {
                label: 'Tarefa Usuário Inativo',
                taskTitle: 'Tarefa para usuário inativo',
                taskDescription: 'Teste com usuário inativo para verificar comportamento',
                taskAssignee: users.inactive.id
              }
            }
          ],
          edges: [
            { id: 'e1', source: 'trigger-1', target: 'task-1' }
          ]
        },
        { inactive_user_test: true, user_status: 'inactive' }
      );
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // F3: Dados JSON Complexos
    await executeTest(
      'F3: Dados JSON Complexos (Payload grande)',
      'Edge Cases',
      {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: { label: 'Início', triggerType: 'manual' }
          },
          {
            id: 'task-1',
            type: 'task',
            position: { x: 300, y: 100 },
            data: {
              label: 'Tarefa JSON Complexo',
              taskTitle: 'Processar dados complexos',
              taskDescription: 'Tarefa com dados JSON complexos para teste de performance',
              taskAssignee: (hasUsers && 'user' in users && users.user?.id) || (hasUsers && 'current' in users && users.current?.id) || '00000000-0000-0000-0000-000000000000'
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'task-1' }
        ]
      },
      {
        complex_json_test: true,
        complex_data: {
          level1: {
            level2: {
              level3: {
                array: Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item-${i}` })),
                strings: Array.from({ length: 50 }, (_, i) => `string-${i}`),
                objects: Array.from({ length: 25 }, (_, i) => ({
                  id: i,
                  name: `Test Object ${i}`,
                  active: i % 2 === 0,
                  metadata: {
                    created: new Date().toISOString(),
                    tags: [`tag-${i}`, `category-${i % 5}`]
                  }
                }))
              }
            }
          },
          metadata: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            test_environment: true,
            statistics: {
              total_objects: 175,
              complexity_level: 'high',
              estimated_size: '~50KB'
            }
          }
        }
      }
    );
  };

  // =============================================================================
  // FUNÇÃO PRINCIPAL PARA EXECUTAR TODOS OS TESTES
  // =============================================================================

  const runAllTests = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setTestResults([]);
    
    // Verificar se temos usuários e departamentos de teste
    const { users, departments } = getTestData;
    
    console.log('🔍 Debug - Dados de teste encontrados:', { 
      users: users ? Object.keys(users) : 'undefined',
      departments: departments ? Object.keys(departments) : 'undefined',
      profilesCount: profiles.length,
      departmentsCount: departments ? Object.keys(departments).length : 0
    });
    
    if (!users || typeof users !== 'object' || !('user' in users) || !('director' in users) || !users.user || !users.director) {
      console.error('❌ Usuários de teste não encontrados:', { users, profiles: profiles.slice(0, 3) });
      toast.error('❌ Usuários de teste não encontrados! Verifique se existem usuários com emails "*@teste.com".');
      setIsRunning(false);
      return;
    }

    if (!departments || typeof departments !== 'object' || !('hr' in departments) || !('it' in departments) || !departments.hr || !departments.it) {
      console.error('❌ Departamentos de teste não encontrados:', { departments, allDepartments: departments });
      toast.error('❌ Departamentos de teste não encontrados! Verifique se existem departamentos com "[TEST]" no nome.');
      setIsRunning(false);
      return;
    }

    toast.success('🚀 Iniciando bateria completa de testes automatizados...', {
      description: `Encontrados ${Object.keys(users).length} usuários e ${Object.keys(departments).length} departamentos de teste`
    });

    const startTime = Date.now();

    try {
      // Executar todas as categorias de teste
      await runBasicTests();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await runConditionalTests();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await runApprovalTests();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await runRecipientTests();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await runTimingTests();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await runEdgeCaseTests();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      const totalTests = testResults.length;
      const successTests = testResults.filter(r => r.status === 'success').length;
      const failedTests = testResults.filter(r => r.status === 'failed').length;
      const successRate = totalTests > 0 ? ((successTests / totalTests) * 100).toFixed(1) : '0';
      
      toast.success(`✅ Bateria de testes concluída em ${duration}s!`, {
        description: `Total: ${totalTests} | Sucessos: ${successTests} | Falhas: ${failedTests} | Taxa: ${successRate}%`
      });
      
    } catch (error) {
      toast.error('❌ Erro durante a execução dos testes', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      console.error('Test execution error:', error);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      setCurrentCategory('');
    }
  };

  // Executar categoria específica
  const runCategoryTests = async (category: string) => {
    if (isRunning) return;
    
    setIsRunning(true);
    setTestResults(prev => prev.filter(r => r.category !== category));
    
    toast.info(`🧪 Executando testes da categoria: ${category}`);

    try {
      switch (category) {
        case 'Básico':
          await runBasicTests();
          break;
        case 'Condicional':
          await runConditionalTests();
          break;
        case 'Aprovação':
          await runApprovalTests();
          break;
        case 'Destinatários':
          await runRecipientTests();
          break;
        case 'Timing':
          await runTimingTests();
          break;
        case 'Edge Cases':
          await runEdgeCaseTests();
          break;
        default:
          throw new Error(`Categoria desconhecida: ${category}`);
      }
      
      const categoryResults = testResults.filter(r => r.category === category);
      const successCount = categoryResults.filter(r => r.status === 'success').length;
      const failedCount = categoryResults.filter(r => r.status === 'failed').length;
      
      toast.success(`✅ Testes da categoria "${category}" concluídos!`, {
        description: `Sucessos: ${successCount} | Falhas: ${failedCount}`
      });
    } catch (error) {
      toast.error(`❌ Erro nos testes da categoria "${category}"`, {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      console.error('Category test error:', error);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      setCurrentCategory('');
    }
  };

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed': return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'running': return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Básico': return <Target className="h-4 w-4" />;
      case 'Condicional': return <Settings className="h-4 w-4" />;
      case 'Aprovação': return <Users className="h-4 w-4" />;
      case 'Destinatários': return <Users className="h-4 w-4" />;
      case 'Timing': return <Clock className="h-4 w-4" />;
      case 'Edge Cases': return <AlertCircle className="h-4 w-4" />;
      case 'Performance': return <Database className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getResultsByCategory = () => {
    const categories = ['Básico', 'Condicional', 'Aprovação', 'Destinatários', 'Timing', 'Edge Cases'];
    return categories.map(category => ({
      category,
      results: testResults.filter(r => r.category === category),
      success: testResults.filter(r => r.category === category && r.status === 'success').length,
      failed: testResults.filter(r => r.category === category && r.status === 'failed').length,
      running: testResults.filter(r => r.category === category && r.status === 'running').length,
      total: testResults.filter(r => r.category === category).length
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Testador Automatizado de Workflows - Sistema Completo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isRunning ? 'Executando Testes...' : 'Executar TODOS os Testes'}
            </Button>
            
            <Button 
              onClick={cleanupTestData} 
              disabled={isCleaningData || isRunning}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isCleaningData ? 'Limpando...' : 'Limpar Dados de Teste'}
            </Button>
            {isRunning && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 animate-spin" />
                <div>
                  <div>Categoria: {currentCategory}</div>
                  <div>Teste: {currentTest}</div>
                </div>
              </div>
            )}
          </div>

          {cleanupResults && (
            <Card className="p-4 border-green-200 bg-green-50 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Limpeza Concluída</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-green-700">{cleanupResults.workflows}</div>
                  <div className="text-green-600">Workflows</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-700">{cleanupResults.executions}</div>
                  <div className="text-green-600">Execuções</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-700">{cleanupResults.tasks}</div>
                  <div className="text-green-600">Tarefas</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-700">{cleanupResults.messages}</div>
                  <div className="text-green-600">Mensagens</div>
                </div>
              </div>
            </Card>
          )}

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="categories">Por Categoria</TabsTrigger>
              <TabsTrigger value="detailed">Resultados Detalhados</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {testResults.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total de Testes</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {testResults.filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Sucessos</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {testResults.filter(r => r.status === 'failed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Falhas</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">
                    {testResults.filter(r => r.status === 'running').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Executando</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {testResults.length > 0 ? 
                      ((testResults.filter(r => r.status === 'success').length / testResults.length) * 100).toFixed(1) + '%' 
                      : '0%'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
                </Card>
              </div>
              
              {cleanupResults && (
                <Card className="p-4 border-green-200 bg-green-50">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">Limpeza Concluída</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-green-700">{cleanupResults.workflows}</div>
                      <div className="text-green-600">Workflows</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-700">{cleanupResults.executions}</div>
                      <div className="text-green-600">Execuções</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-700">{cleanupResults.tasks}</div>
                      <div className="text-green-600">Tarefas</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-700">{cleanupResults.messages}</div>
                      <div className="text-green-600">Mensagens</div>
                    </div>
                  </div>
                </Card>
              )}
              
              {testResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getResultsByCategory().map(categoryData => (
                    <Card key={categoryData.category} className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {getCategoryIcon(categoryData.category)}
                        <h3 className="font-semibold">{categoryData.category}</h3>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-blue-600">{categoryData.total}</div>
                          <div className="text-muted-foreground">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-green-600">{categoryData.success}</div>
                          <div className="text-muted-foreground">✓</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-red-600">{categoryData.failed}</div>
                          <div className="text-muted-foreground">✗</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-yellow-600">{categoryData.running}</div>
                          <div className="text-muted-foreground">⟳</div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => runCategoryTests(categoryData.category)}
                        disabled={isRunning}
                      >
                        Executar {categoryData.category}
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              {getResultsByCategory().map(categoryData => (
                <Card key={categoryData.category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getCategoryIcon(categoryData.category)}
                      {categoryData.category} ({categoryData.success}/{categoryData.total})
                      {categoryData.running > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {categoryData.running} executando
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {categoryData.results.map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(result.status)}
                            <span className="text-sm">{result.testName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {result.duration && (
                              <span className="text-xs text-muted-foreground">
                                {result.duration}ms
                              </span>
                            )}
                            <Badge className={getStatusColor(result.status)}>
                              {result.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="detailed" className="space-y-4">
              {testResults.length > 0 && (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {testResults.map((result, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(result.status)}
                            <div>
                              <h4 className="font-medium">{result.testName}</h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {getCategoryIcon(result.category)}
                                <span>{result.category}</span>
                                {result.duration && <span>• {result.duration}ms</span>}
                              </div>
                            </div>
                          </div>
                          <Badge className={getStatusColor(result.status)}>
                            {result.status}
                          </Badge>
                        </div>
                        
                        {result.workflowId && (
                          <div className="text-xs text-muted-foreground mb-1">
                            Workflow ID: {result.workflowId}
                          </div>
                        )}
                        
                        {result.executionId && (
                          <div className="text-xs text-muted-foreground mb-1">
                            Execution ID: {result.executionId}
                          </div>
                        )}
                        
                        {result.error && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                            <strong>Erro:</strong> {result.error}
                          </div>
                        )}
                        
                        {result.details && result.status === 'success' && (
                          <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                            <strong>Sucesso:</strong> Execution ID {result.details.executionId}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
