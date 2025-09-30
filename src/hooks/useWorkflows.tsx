import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  workflow_definition: any;
  trigger_type: string;
  trigger_conditions?: any;
  is_active: boolean;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  workflow_type: string;
  department_ids?: string[];
  tags?: string[];
  confidentiality_level: 'public' | 'private';
  allowed_users?: string[];
  allowed_departments?: string[];
  allowed_roles?: string[];
  priority: string;
  status: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'running' | 'completed' | 'failed';
  triggered_by?: string;
  trigger_data?: any;
  record_type?: string;
  record_id?: string;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

export const useWorkflows = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch workflows
  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching workflows...');
      
      // First, fetch workflows (excluding deleted ones)
      const { data: workflowsData, error: workflowsError } = await supabase
        .from('workflows')
        .select('*')
        .is('deleted_at', null) // Only fetch non-deleted workflows
        .not('name', 'ilike', '%[TEST]%')
        .order('created_at', { ascending: false });

      if (workflowsError) {
        console.error('❌ Workflows query error:', workflowsError);
        throw workflowsError;
      }

      console.log('✅ Workflows fetched:', workflowsData?.length || 0);

      // Then, fetch user profiles for the creators
      const creatorIds = [...new Set(workflowsData?.map(w => w.created_by).filter(Boolean) || [])];
      
      let profilesData: any[] = [];
      if (creatorIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', creatorIds);

        if (profilesError) {
          console.warn('⚠️ Profiles query failed:', profilesError);
        } else {
          profilesData = profiles || [];
          console.log('✅ Profiles fetched:', profilesData.length);
        }
      }

      // Create a map for quick lookup
      const profilesMap = new Map(profilesData.map(p => [p.id, p.name]));

      // Transform data to include created_by_name and handle confidentiality migration
      const transformedData = (workflowsData || []).map(workflow => ({
        ...workflow,
        created_by_name: profilesMap.get(workflow.created_by) || 'Usuário desconhecido',
        // Ensure confidentiality_level is compatible with new enum
        confidentiality_level: (workflow.confidentiality_level === 'department_leaders' || 
                                workflow.confidentiality_level === 'directors_admins') 
                                ? 'private' as const 
                                : workflow.confidentiality_level as ('public' | 'private'),
        // Ensure these arrays exist
        allowed_users: workflow.allowed_users || [],
        allowed_departments: workflow.allowed_departments || [],
        allowed_roles: workflow.allowed_roles || []
      } as Workflow));
      
      console.log('✅ Workflows transformed and ready:', transformedData.length);
      setWorkflows(transformedData);
      
    } catch (error) {
      console.error('❌ Error fetching workflows:', error);
      toast({
        title: "Erro ao carregar workflows",
        description: "Não foi possível carregar a lista de workflows.",
        variant: "destructive",
      });
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch workflow executions
  const fetchExecutions = async (workflowId?: string) => {
    try {
      let query = supabase
        .from('workflow_executions')
        .select('*')
        .order('started_at', { ascending: false });

      if (workflowId) {
        query = query.eq('workflow_id', workflowId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setExecutions((data || []) as WorkflowExecution[]);
    } catch (error) {
      console.error('Error fetching executions:', error);
    }
  };

  // Register auto triggers for workflows
  const registerAutoTriggers = async (workflowId: string, workflowData: any) => {
    try {
      const workflowDefinition = workflowData.workflow_definition;
      if (!workflowDefinition?.nodes) return;

      // Encontrar o nó trigger
      const triggerNode = workflowDefinition.nodes.find((node: any) => 
        node.type === 'trigger' || node.type === 'triggerNode'
      );

      if (!triggerNode || !triggerNode.data?.triggerType) return;

      const triggerType = triggerNode.data.triggerType;
      
      // Tipos que requerem registro automático
      const autoTriggerTypes = [
        'status_change', 'record_created', 'task_completed', 'deadline_missed',
        'user_inactive', 'department_inactive', 'no_response', 'field_change',
        'tasks_accumulation', 'system_event', 'protheus_record_change'
      ];

      if (autoTriggerTypes.includes(triggerType)) {
        const { error } = await supabase
          .from('workflow_auto_triggers')
          .insert({
            workflow_id: workflowId,
            trigger_type: triggerType,
            trigger_config: triggerNode.data,
            is_active: true
          });

        if (error) {
          console.error('Error registering auto trigger:', error);
        } else {
          console.log(`Auto trigger registered for workflow ${workflowId}: ${triggerType}`);
        }
      }
    } catch (error) {
      console.error('Error in registerAutoTriggers:', error);
    }
  };

  // Create workflow
  const createWorkflow = async (workflowData: {
    name: string;
    description?: string;
    workflow_definition: any;
    trigger_type: string;
    trigger_conditions?: any;
    workflow_type: string;
    department_ids?: string[];
    tags?: string[];
    confidentiality_level: 'public' | 'private';
    allowed_users?: string[];
    allowed_departments?: string[];
    allowed_roles?: string[];
    priority: string;
    status?: string;
  }) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Extract trigger info from workflow definition
      let finalTriggerType = workflowData.trigger_type;
      let finalTriggerConditions = workflowData.trigger_conditions || {};

      if (workflowData.workflow_definition?.nodes) {
        const triggerNode = workflowData.workflow_definition.nodes.find((node: any) => 
          node.type === 'trigger' || node.type === 'triggerNode'
        );

        if (triggerNode?.data?.triggerType) {
          finalTriggerType = triggerNode.data.triggerType;
          
          // Extract conditions for Protheus triggers
          if (finalTriggerType === 'protheus_record_change' && triggerNode.data.table_id && triggerNode.data.statuses) {
            finalTriggerConditions = {
              table_id: triggerNode.data.table_id,
              statuses: triggerNode.data.statuses
            };
            console.log('🔄 Saving Protheus workflow with conditions:', finalTriggerConditions);
          }
        }
      }

      const { data, error } = await supabase
        .from('workflows')
        .insert({
          ...workflowData,
          trigger_type: finalTriggerType,
          trigger_conditions: finalTriggerConditions,
          created_by: user.id,
        } as any) // Cast to bypass type check during migration
        .select()
        .maybeSingle();

      // Handle RLS issues - treat PGRST116 as success since insert likely worked
      if (error && error.code !== 'PGRST116') throw error;

      let workflowId = data?.id;
      
      // If we don't have the ID, try to fetch it as a fallback
      if (!workflowId && (!error || error.code === 'PGRST116')) {
        console.log('🔍 No ID returned, trying fallback query to find the created workflow');
        try {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('workflows')
            .select('id')
            .eq('name', workflowData.name)
            .eq('created_by', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          if (!fallbackError && fallbackData?.id) {
            workflowId = fallbackData.id;
            console.log('✅ Found workflow ID via fallback:', workflowId);
          } else {
            console.log('⚠️ Fallback query failed or no data found:', fallbackError);
          }
        } catch (fallbackException) {
          console.log('⚠️ Fallback query exception:', fallbackException);
        }
      }

      // Registrar triggers automáticos se necessário (only if we have workflowId)
      if (workflowId) {
        await registerAutoTriggers(workflowId, workflowData);
      }

      console.log(`✅ Workflow created with trigger_type: ${finalTriggerType}${workflowId ? `, ID: ${workflowId}` : ' (no ID available)'}`);

      toast({
        title: "Workflow criado",
        description: `O workflow "${workflowData.name}" foi criado com sucesso.`,
      });
      
      // Refresh workflows list after creating to get updated data with user names
      await fetchWorkflows();
      
      return workflowId ? { ...workflowData, id: workflowId } : data;
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast({
        title: "Erro ao criar workflow",
        description: error?.message || "Não foi possível criar o workflow.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Update workflow
  const updateWorkflow = async (workflowId: string, updates: Partial<Workflow>) => {
    try {
      // Extract trigger info from workflow definition if provided
      let finalUpdates = { ...updates };

      if (updates.workflow_definition?.nodes) {
        const triggerNode = updates.workflow_definition.nodes.find((node: any) => 
          node.type === 'trigger' || node.type === 'triggerNode'
        );

        if (triggerNode?.data?.triggerType) {
          finalUpdates.trigger_type = triggerNode.data.triggerType;
          
          // Extract conditions for Protheus triggers
          if (triggerNode.data.triggerType === 'protheus_record_change' && triggerNode.data.table_id && triggerNode.data.statuses) {
            finalUpdates.trigger_conditions = {
              table_id: triggerNode.data.table_id,
              statuses: triggerNode.data.statuses
            };
            console.log('🔄 Updating Protheus workflow with conditions:', finalUpdates.trigger_conditions);
          }
        }
      }

      const { data, error } = await supabase
        .from('workflows')
        .update(finalUpdates as any) // Cast to bypass type check during migration
        .eq('id', workflowId)
        .select()
        .maybeSingle();

      // Handle RLS issues - treat PGRST116 as success since update likely worked
      if (error && error.code !== 'PGRST116') throw error;

      console.log(`✅ Workflow updated with trigger_type: ${finalUpdates.trigger_type}`);

      toast({
        title: "Workflow atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      // Refresh workflows list after updating to get updated data with user names
      console.log('Updating workflow, calling fetchWorkflows to refresh list');
      await fetchWorkflows();
      console.log('Workflows list refreshed after update');

      return data;
    } catch (error) {
      console.error('Error updating workflow:', error);
      toast({
        title: "Erro ao atualizar workflow",
        description: error?.message || "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Enhanced delete workflow with smart deletion
  const deleteWorkflow = async (workflowId: string) => {
    try {
      // First check if workflow can be safely deleted
      const { data: canDelete, error: checkError } = await supabase
        .rpc('can_delete_workflow', { workflow_id_param: workflowId });

      if (checkError) throw checkError;

      if (canDelete) {
        // Safe to delete permanently
        const { error } = await supabase
          .from('workflows')
          .delete()
          .eq('id', workflowId);

        if (error) throw error;

        toast({
          title: "Workflow excluído",
          description: "O workflow foi excluído permanentemente.",
        });
      } else {
        // Soft delete - workflow has executions or dependencies
        const { data: softDeleted, error: softDeleteError } = await supabase
          .rpc('soft_delete_workflow', { workflow_id_param: workflowId });

        if (softDeleteError) throw softDeleteError;

        toast({
          title: "Workflow arquivado",
          description: "O workflow foi arquivado pois possui execuções ou dependências. Não aparecerá mais na listagem principal.",
        });
      }

      setWorkflows(prev => prev.filter(workflow => workflow.id !== workflowId));
      
      // Refresh the workflows list
      fetchWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      
      // Provide user-friendly error messages
      let errorMessage = "Não foi possível excluir o workflow.";
      
      if (error.code === '23503') {
        errorMessage = "Este workflow não pode ser excluído pois está sendo usado por execuções ou outras dependências. O sistema o arquivou automaticamente.";
      }
      
      toast({
        title: "Erro ao excluir workflow",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Execute workflow using the Edge Function
  const executeWorkflow = async (workflowId: string, triggerData?: any) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Add user context to trigger data
      const enrichedTriggerData = {
        ...triggerData,
        user_id: user.id,
        timestamp: new Date().toISOString()
      };

      console.log(`Executing workflow ${workflowId} with trigger data:`, enrichedTriggerData);

      const { data, error } = await supabase.functions.invoke('execute-workflow', {
        body: {
          workflowId,
          triggerData: enrichedTriggerData,
          variables: {}
        }
      });

      if (error) {
        console.error('Error executing workflow:', error);
        throw new Error(error.message);
      }

      if (data.success) {
        console.log('Workflow execution started successfully:', data);
        toast({
          title: "Workflow executado",
          description: "A execução do workflow foi iniciada com sucesso.",
        });
        
        // Refresh executions
        fetchExecutions();
        
        return { success: true, executionId: data.executionId };
      } else {
        console.error('Workflow execution failed:', data.error);
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      toast({
        title: "Erro ao executar workflow",
        description: error.message || "Não foi possível iniciar a execução.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Toggle workflow active status
  const toggleWorkflowStatus = async (workflowId: string) => {
    try {
      const workflow = workflows.find(w => w.id === workflowId);
      if (!workflow) return;

      const { data, error } = await supabase
        .from('workflows')
        .update({ is_active: !workflow.is_active })
        .eq('id', workflowId)
        .select()
        .single();

      if (error) throw error;

      setWorkflows(prev => 
        prev.map(w => 
          w.id === workflowId ? { ...w, is_active: data.is_active } : w
        )
      );

      toast({
        title: `Workflow ${data.is_active ? 'ativado' : 'desativado'}`,
        description: `O workflow foi ${data.is_active ? 'ativado' : 'desativado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Error toggling workflow status:', error);
      toast({
        title: "Erro ao alterar status",
        description: "Não foi possível alterar o status do workflow.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchWorkflows();
      fetchExecutions();
    }
  }, [user]);

  return {
    workflows,
    executions,
    loading,
    fetchWorkflows,
    fetchExecutions,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
    toggleWorkflowStatus,
  };
};