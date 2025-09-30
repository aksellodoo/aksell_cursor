import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkflowExecution } from '@/hooks/useWorkflowExecution';
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Activity,
  Eye,
  Calendar,
  Database,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WorkflowMonitorProps {
  workflowId?: string;
  className?: string;
}

export const WorkflowMonitor: React.FC<WorkflowMonitorProps> = ({
  workflowId,
  className = ''
}) => {
  const {
    executions,
    executionSteps,
    loading,
    executeWorkflow,
    fetchExecutions,
    fetchExecutionSteps,
    cancelExecution,
    retryExecution,
    getExecutionSummary,
    subscribeToExecutions
  } = useWorkflowExecution();

  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [triggerLogs, setTriggerLogs] = useState<any[]>([]);
  const [triggerFilter, setTriggerFilter] = useState<string>('all');
  const [loadingTriggers, setLoadingTriggers] = useState(false);

  const fetchTriggerLogs = async () => {
    setLoadingTriggers(true);
    try {
      let query = supabase
        .from('workflow_trigger_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (workflowId) {
        query = query.eq('workflow_id', workflowId);
      }

      if (triggerFilter === 'protheus') {
        query = query.eq('trigger_type', 'protheus_record_change');
      }

      const { data, error } = await query;
      if (error) throw error;
      setTriggerLogs(data || []);
    } catch (error) {
      console.error('Error fetching trigger logs:', error);
    } finally {
      setLoadingTriggers(false);
    }
  };

  useEffect(() => {
    fetchExecutions(workflowId);
    fetchTriggerLogs();
    const unsubscribe = subscribeToExecutions(workflowId);
    return unsubscribe;
  }, [workflowId, fetchExecutions, subscribeToExecutions, triggerFilter]);

  useEffect(() => {
    if (selectedExecution) {
      fetchExecutionSteps(selectedExecution);
    }
  }, [selectedExecution, fetchExecutionSteps]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled':
        return <Pause className="w-4 h-4 text-yellow-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExecuteWorkflow = async () => {
    if (!workflowId) return;
    
    await executeWorkflow(workflowId, {
      user_id: 'manual-trigger',
      timestamp: new Date().toISOString()
    });
  };

  const selectedExecutionData = selectedExecution 
    ? executions.find(ex => ex.id === selectedExecution)
    : null;

  const summary = selectedExecution ? getExecutionSummary(selectedExecution) : null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Monitor de Execuções</h3>
          <p className="text-sm text-muted-foreground">
            Acompanhe o status das execuções de workflow em tempo real
          </p>
        </div>
        {workflowId && (
          <Button 
            onClick={handleExecuteWorkflow}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Executar Manualmente
          </Button>
        )}
      </div>

      <Tabs defaultValue="executions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="executions">Execuções</TabsTrigger>
          <TabsTrigger value="triggers">Triggers</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedExecution}>
            Detalhes da Execução
          </TabsTrigger>
        </TabsList>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Histórico de Execuções
              </CardTitle>
              <CardDescription>
                Lista de todas as execuções do workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {loading && executions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Carregando execuções...
                    </div>
                  ) : executions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma execução encontrada
                    </div>
                  ) : (
                    executions.map((execution) => (
                      <Card 
                        key={execution.id} 
                        className={`cursor-pointer transition-colors hover:bg-accent ${
                          selectedExecution === execution.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedExecution(execution.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(execution.status)}
                              <div>
                                <div className="font-medium">
                                  Execução #{execution.id.slice(0, 8)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Iniciado em {format(new Date(execution.started_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className={getStatusColor(execution.status)}>
                                {execution.status === 'running' && 'Em execução'}
                                {execution.status === 'completed' && 'Concluído'}
                                {execution.status === 'failed' && 'Falhou'}
                                {execution.status === 'cancelled' && 'Cancelado'}
                                {execution.status === 'pending' && 'Pendente'}
                              </Badge>
                              <div className="flex items-center gap-1">
                                {execution.status === 'running' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      cancelExecution(execution.id);
                                    }}
                                  >
                                    <Pause className="w-3 h-3" />
                                  </Button>
                                )}
                                {execution.status === 'failed' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      retryExecution(execution);
                                    }}
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedExecution(execution.id);
                                  }}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          {execution.error_message && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                              {execution.error_message}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="triggers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Histórico de Triggers
                  </CardTitle>
                  <CardDescription>
                    Eventos que dispararam ou tentaram disparar workflows
                  </CardDescription>
                </div>
                <Select value={triggerFilter} onValueChange={setTriggerFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="protheus">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Protheus
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {loadingTriggers ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Carregando triggers...
                    </div>
                  ) : triggerLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum trigger encontrado</p>
                      {triggerFilter === 'protheus' && (
                        <p className="text-sm mt-1">
                          Execute uma sincronização de tabela Protheus para ver eventos aqui
                        </p>
                      )}
                    </div>
                  ) : (
                    triggerLogs.map((log) => (
                      <Card key={log.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={log.status === 'triggered' ? 'default' : 'destructive'}>
                                {log.trigger_type}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                              </span>
                            </div>
                            <div className="mt-2 text-sm">
                              <p><strong>Status:</strong> {log.status}</p>
                              {log.trigger_data?.table_name && (
                                <p><strong>Tabela:</strong> {log.trigger_data.table_name}</p>
                              )}
                              {log.trigger_data?.record_status && (
                                <p><strong>Tipo:</strong> {log.trigger_data.record_status}</p>
                              )}
                              {log.execution_id && (
                                <p><strong>Execução:</strong> {log.execution_id.slice(0, 8)}...</p>
                              )}
                            </div>
                            {log.trigger_data && (
                              <details className="mt-2">
                                <summary className="text-sm font-medium cursor-pointer">
                                  Ver Dados Completos
                                </summary>
                                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                                  {JSON.stringify(log.trigger_data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedExecutionData && (
            <>
              {/* Execution Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Resumo da Execução
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {summary?.totalSteps || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total de Etapas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {summary?.completedSteps || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Concluídas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {summary?.failedSteps || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Falharam</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {summary?.runningSteps || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Em Execução</div>
                    </div>
                  </div>
                  
                  {summary && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span>{Math.round(summary.progress)}%</span>
                      </div>
                      <Progress value={summary.progress} className="w-full" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Execution Steps */}
              <Card>
                <CardHeader>
                  <CardTitle>Etapas da Execução</CardTitle>
                  <CardDescription>
                    Detalhes de cada etapa executada no workflow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {executionSteps
                        .filter(step => step.execution_id === selectedExecution)
                        .map((step) => (
                          <Card key={step.id} className="p-4">
                            <div className="flex items-start gap-3">
                              {getStatusIcon(step.status)}
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium">{step.step_name}</div>
                                  <Badge variant="outline" className={getStatusColor(step.status)}>
                                    {step.status}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Tipo: {step.step_type} • Node ID: {step.node_id}
                                </div>
                                {step.started_at && (
                                  <div className="text-xs text-muted-foreground">
                                    Iniciado: {format(new Date(step.started_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                                  </div>
                                )}
                                {step.completed_at && (
                                  <div className="text-xs text-muted-foreground">
                                    Concluído: {format(new Date(step.completed_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                                  </div>
                                )}
                                {step.error_message && (
                                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                    Erro: {step.error_message}
                                  </div>
                                )}
                                {step.output_data && Object.keys(step.output_data).length > 0 && (
                                  <details className="mt-2">
                                    <summary className="text-sm font-medium cursor-pointer">
                                      Dados de Saída
                                    </summary>
                                    <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto">
                                      {JSON.stringify(step.output_data, null, 2)}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};