import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';
import { convertTemplateToBuilder } from '@/utils/workflowTemplateUtils';

type WorkflowTemplateRow = Database['public']['Tables']['workflow_templates']['Row'];

export interface WorkflowTemplate extends Omit<WorkflowTemplateRow, 'workflow_definition'> {
  workflow_definition: any;
}

export const useWorkflowTemplates = () => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTemplates = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching workflow templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const useTemplate = async (templateId: string, customizations: any = {}) => {
    try {
      // First fetch the template data
      const { data: template, error: fetchError } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (fetchError) throw fetchError;

      // Increment usage count
      const { error: updateError } = await supabase
        .from('workflow_templates')
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq('id', templateId);

      if (updateError) console.warn('Error updating usage count:', updateError);

      // Convert template format to builder format and apply customizations
      const convertedWorkflow = convertTemplateToBuilder(template.workflow_definition);
      const customizedDefinition = {
        ...convertedWorkflow,
        ...customizations
      };

      return {
        ...template,
        workflow_definition: customizedDefinition
      } as WorkflowTemplate;
    } catch (error) {
      console.error('Error using template:', error);
      throw error;
    }
  };

  const createTemplateFromWorkflow = async (workflow: any, templateData: Partial<WorkflowTemplate>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('workflow_templates')
        .insert({
          name: templateData.name,
          description: templateData.description,
          category: templateData.category || 'general',
          workflow_definition: workflow.workflow_definition,
          instructions: templateData.instructions,
          prerequisites: templateData.prerequisites,
          example_usage: templateData.example_usage,
          tags: templateData.tags || [],
          complexity_level: templateData.complexity_level || 'basic',
          department_ids: templateData.department_ids || [],
          confidentiality_level: templateData.confidentiality_level || 'public',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchTemplates();
      return data;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('workflow_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      await fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  return {
    templates,
    loading,
    fetchTemplates,
    useTemplate,
    createTemplateFromWorkflow,
    deleteTemplate,
  };
};