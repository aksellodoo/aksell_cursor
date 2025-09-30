import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface FormToFill {
  id: string;
  title: string;
  description?: string;
  publication_status: string;
  publication_settings: any;
  created_by: string;
  created_at: string;
  internal_recipients: any;
  response_deadline?: string;
  has_responded: boolean;
  response_count: number;
  max_responses: number | null;
  // Campos adicionais para identificar subordinados
  assigned_user_id?: string;
  assigned_user_name?: string;
  assigned_department_name?: string;
}

export interface FormsToFillFilters {
  scope: 'my_forms' | 'team_forms';
  department_id?: string;
  user_id?: string;
}

export const useFormsToFill = (filters: FormsToFillFilters = { scope: 'my_forms' }) => {
  const { user } = useAuth();
  const [forms, setForms] = useState<FormToFill[]>([]);
  const [loading, setLoading] = useState(true);
  const [subordinatesData, setSubordinatesData] = useState<{
    subordinates: any[];
    departments: any[];
  }>({ subordinates: [], departments: [] });

  // Função para buscar subordinados e departamentos
  const fetchSubordinatesData = async () => {
    if (!user) return { subordinates: [], departments: [] };

    try {
      // Buscar subordinados recursivamente
      const { data: subordinates, error: subError } = await supabase
        .rpc('get_all_subordinates', { supervisor_uuid: user.id });

      if (subError) {
        console.error('Error fetching subordinates:', subError);
        return { subordinates: [], departments: [] };
      }

      // Buscar detalhes dos subordinados incluindo departamentos
      if (subordinates && subordinates.length > 0) {
        const { data: subordinatesDetails, error: detailsError } = await supabase
          .from('profiles')
          .select(`
            id, name, department_id,
            departments:department_id(id, name)
          `)
          .in('id', subordinates.map((s: any) => s.subordinate_id));

        if (detailsError) {
          console.error('Error fetching subordinates details:', detailsError);
          return { subordinates: [], departments: [] };
        }

        // Extrair departamentos únicos
        const departments = subordinatesDetails
          ?.map((s: any) => s.departments)
          .filter((d: any) => d)
          .reduce((acc: any[], dept: any) => {
            if (!acc.find(d => d.id === dept.id)) {
              acc.push(dept);
            }
            return acc;
          }, []) || [];

        return { 
          subordinates: subordinatesDetails || [], 
          departments 
        };
      }

      return { subordinates: [], departments: [] };
    } catch (error) {
      console.error('Error in fetchSubordinatesData:', error);
      return { subordinates: [], departments: [] };
    }
  };

  const fetchFormsToFill = async () => {
    if (!user) {
      console.log('useFormsToFill: No user found');
      return;
    }

    try {
      setLoading(true);
      console.log('useFormsToFill: Fetching forms for user:', user.id, 'with filters:', filters);
      
      // Buscar dados de subordinados primeiro
      const subData = await fetchSubordinatesData();
      setSubordinatesData(subData);

      // Determinar quais usuários incluir na busca
      let targetUserIds = [user.id]; // Sempre incluir o usuário atual

      if (filters?.scope === 'team_forms' && subData.subordinates.length > 0) {
        const subordinateIds = subData.subordinates.map((s: any) => s.id);
        
        if (filters.department_id) {
          // Filtrar subordinados por departamento específico
          const filteredIds = subData.subordinates
            .filter((s: any) => s.department_id === filters.department_id)
            .map((s: any) => s.id);
          targetUserIds = filteredIds.length > 0 ? filteredIds : [user.id];
        } else if (filters.user_id) {
          // Filtrar subordinado específico
          targetUserIds = subordinateIds.includes(filters.user_id) ? [filters.user_id] : [user.id];
        } else {
          // Incluir todos os subordinados
          targetUserIds = [...targetUserIds, ...subordinateIds];
        }
      }

      console.log('Target user IDs:', targetUserIds);
      
      // Buscar formulários publicados
      const { data: publishedForms, error: formsError } = await supabase
        .from('forms')
        .select(`
          id,
          title,
          description,
          publication_status,
          publication_settings,
          created_by,
          created_at,
          internal_recipients
        `)
        .in('publication_status', ['published_internal', 'published_mixed'])
        .eq('is_published', true);

      if (formsError) {
        console.error('useFormsToFill: Error fetching forms:', formsError);
        throw formsError;
      }

      if (!publishedForms) {
        console.log('useFormsToFill: No published forms found');
        setForms([]);
        return;
      }

      console.log('useFormsToFill: Found published forms:', publishedForms.length);

      // Buscar perfis dos usuários alvo
      const { data: userProfiles, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id, name, role, department_id, is_leader,
          departments:department_id(name)
        `)
        .in('id', targetUserIds);

      if (profileError) {
        console.error('useFormsToFill: Error fetching user profiles:', profileError);
        throw profileError;
      }

      console.log('useFormsToFill: User profiles:', userProfiles);

      // Filtrar formulários que cada usuário alvo deve preencher
      const userForms: FormToFill[] = [];

      for (const targetProfile of userProfiles || []) {
        for (const form of publishedForms) {
          let shouldInclude = false;
          const recipients = form.internal_recipients || {};

          console.log(`useFormsToFill: Checking form ${form.id} (${form.title}) for user ${targetProfile.name}`);
          console.log('Recipients data:', recipients);

          // Verificar se usuário está nas listas de destinatários
          const recipientsObj = recipients as any;
          
          // Verificar usuários específicos
          if (recipientsObj.users && Array.isArray(recipientsObj.users) && recipientsObj.users.includes(targetProfile.id)) {
            console.log('User included by specific user selection');
            shouldInclude = true;
          }

          // Verificar por departamento
          if (recipientsObj.departments && Array.isArray(recipientsObj.departments) && targetProfile.department_id && 
              recipientsObj.departments.includes(targetProfile.department_id)) {
            console.log('User included by department selection');
            shouldInclude = true;
          }

          // Verificar por role
          if (recipientsObj.roles && Array.isArray(recipientsObj.roles)) {
            if (recipientsObj.roles.includes(targetProfile.role)) {
              console.log('User included by role selection:', targetProfile.role);
              shouldInclude = true;
            }
            if (recipientsObj.roles.includes('leader') && targetProfile.is_leader) {
              console.log('User included by leader role');
              shouldInclude = true;
            }
          }

          console.log(`Form ${form.id} should include user ${targetProfile.name}:`, shouldInclude);

          if (shouldInclude) {
            // Buscar respostas do usuário para este formulário
            const { data: responses, error: responsesError } = await supabase
              .from('form_responses')
              .select('id')
              .eq('form_id', form.id)
              .eq('submitted_by', targetProfile.id);

            if (responsesError) {
              console.error('useFormsToFill: Error fetching responses for form', form.id, responsesError);
            }

            const responseCount = responses?.length || 0;
            const maxResponses = (form.publication_settings as any)?.max_responses_per_user || null;
            const hasResponded = responseCount > 0;

            console.log(`Form ${form.id} for ${targetProfile.name}: responses=${responseCount}, max=${maxResponses}, hasResponded=${hasResponded}`);

            // Verificar se ainda pode responder (se há limite de respostas)
            const canStillRespond = maxResponses === null || responseCount < maxResponses;

            // Para scope 'my_forms', excluir formulários já respondidos
            // Para scope 'team_forms', incluir todos para supervisores verem status da equipe
            const shouldIncludeBasedOnScope = filters?.scope === 'team_forms' || !hasResponded;

            // Incluir apenas se ainda pode responder E baseado no scope
            if ((canStillRespond || maxResponses === null) && shouldIncludeBasedOnScope) {
              console.log(`Adding form ${form.id} to user forms list for ${targetProfile.name}`);
              
              // Verificar se o formulário já existe para evitar duplicatas
              const existingForm = userForms.find(f => f.id === form.id && f.assigned_user_id === targetProfile.id);
              if (!existingForm) {
                userForms.push({
                  ...form,
                  has_responded: hasResponded,
                  response_count: responseCount,
                  max_responses: maxResponses,
                  response_deadline: (form.publication_settings as any)?.response_deadline,
                  assigned_user_id: targetProfile.id,
                  assigned_user_name: targetProfile.name,
                  assigned_department_name: targetProfile.departments?.name || 'Sem departamento'
                });
              }
            } else {
              console.log(`Form ${form.id} excluded for ${targetProfile.name} - user reached response limit`);
            }
          }
        }
      }

      console.log('useFormsToFill: Final forms list:', userForms.length);
      setForms(userForms);
    } catch (error) {
      console.error('useFormsToFill: Error fetching forms to fill:', error);
      toast.error('Erro ao carregar formulários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormsToFill();
  }, [user, filters]);

  return {
    forms,
    loading,
    refetch: fetchFormsToFill,
    subordinatesData
  };
};