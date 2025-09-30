import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: string;
  trigger_data: any;
  triggered_by: string | null;
  record_type: string | null;
  record_id: string | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

interface WorkflowExecutionStep {
  id: string;
  execution_id: string;
  step_name: string;
  step_type: string;
  node_id: string;
  status: string;
  input_data: any;
  output_data: any;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export const useWorkflowExecution = () => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [executionSteps, setExecutionSteps] = useState<WorkflowExecutionStep[]>([]);
  const [loading, setLoading] = useState(false);

  // Execute a workflow manually
  const executeWorkflow = useCallback(async (
    workflowId: string, 
    triggerData: Record<string, any> = {},
    variables: Record<string, any> = {}
  ): Promise<{ success: boolean; executionId?: string; error?: string }> => {
    try {
      setLoading(true);
      console.log(`Executing workflow ${workflowId} with trigger data:`, triggerData);

      const { data, error } = await supabase.functions.invoke('execute-workflow', {
        body: {
          workflowId,
          triggerData,
          variables
        }
      });

      if (error) {
        console.error('Error executing workflow:', error);
        toast.error('Erro ao executar workflow');
        return { success: false, error: error.message };
      }

      if (data.success) {
        toast.success('Workflow executado com sucesso!');
        // Refresh executions list
        fetchExecutions(workflowId);
        return { success: true, executionId: data.executionId };
      } else {
        toast.error(`Erro na execução: ${data.error}`);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      toast.error('Erro inesperado ao executar workflow');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch workflow executions
  const fetchExecutions = useCallback(async (workflowId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('workflow_executions')
        .select(`
          *,
          workflows!inner(name)
        `)
        .order('started_at', { ascending: false });

      if (workflowId) {
        query = query.eq('workflow_id', workflowId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching executions:', error);
        toast.error('Erro ao buscar execuções');
        return;
      }

      setExecutions(data || []);
    } catch (error) {
      console.error('Error fetching executions:', error);
      toast.error('Erro ao buscar execuções');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch execution steps for a specific execution
  const fetchExecutionSteps = useCallback(async (executionId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workflow_execution_steps')
        .select('*')
        .eq('execution_id', executionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching execution steps:', error);
        toast.error('Erro ao buscar etapas da execução');
        return;
      }

      setExecutionSteps(data || []);
    } catch (error) {
      console.error('Error fetching execution steps:', error);
      toast.error('Erro ao buscar etapas da execução');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cancel a running execution
  const cancelExecution = useCallback(async (executionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('workflow_executions')
        .update({ 
          status: 'cancelled',
          completed_at: new Date().toISOString(),
          error_message: 'Execution cancelled by user'
        })
        .eq('id', executionId);

      if (error) {
        console.error('Error cancelling execution:', error);
        toast.error('Erro ao cancelar execução');
        return false;
      }

      toast.success('Execução cancelada');
      fetchExecutions(); // Refresh list
      return true;
    } catch (error) {
      console.error('Error cancelling execution:', error);
      toast.error('Erro ao cancelar execução');
      return false;
    }
  }, [fetchExecutions]);

  // Retry a failed execution
  const retryExecution = useCallback(async (execution: WorkflowExecution): Promise<boolean> => {
    try {
      const result = await executeWorkflow(
        execution.workflow_id,
        execution.trigger_data,
        {}
      );

      if (result.success) {
        toast.success('Execução reprocessada com sucesso!');
        return true;
      } else {
        toast.error(`Erro ao reprocessar: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error('Error retrying execution:', error);
      toast.error('Erro ao reprocessar execução');
      return false;
    }
  }, [executeWorkflow]);

  // Get execution status summary
  const getExecutionSummary = useCallback((executionId: string) => {
    const steps = executionSteps.filter(step => step.execution_id === executionId);
    const totalSteps = steps.length;
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const failedSteps = steps.filter(step => step.status === 'failed').length;
    const runningSteps = steps.filter(step => step.status === 'running').length;
    const pendingSteps = steps.filter(step => step.status === 'pending').length;

    return {
      totalSteps,
      completedSteps,
      failedSteps,
      runningSteps,
      pendingSteps,
      progress: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
    };
  }, [executionSteps]);

  // Subscribe to real-time updates for executions
  const subscribeToExecutions = useCallback((workflowId?: string) => {
    let channel = supabase
      .channel('workflow-executions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_executions'
        },
        (payload) => {
          console.log('Execution update:', payload);
          fetchExecutions(workflowId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_execution_steps'
        },
        (payload) => {
          console.log('Execution step update:', payload);
          if (payload.new && 'execution_id' in payload.new) {
            fetchExecutionSteps(payload.new.execution_id as string);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchExecutions, fetchExecutionSteps]);

  return {
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
  };
};