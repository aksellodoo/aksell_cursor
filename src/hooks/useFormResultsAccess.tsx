import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

export interface FormResultsAccess {
  id: string;
  title: string;
  description?: string;
  publication_status: string;
  created_by: string;
  created_at: string;
  response_count: number;
  confidentiality_level: string;
  creator_name: string;
  has_responses: boolean;
}

export const useFormResultsAccess = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [forms, setForms] = useState<FormResultsAccess[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccessibleForms = async () => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('useFormResultsAccess: Fetching accessible forms for user:', user.id);

      // Buscar formulários onde o usuário tem acesso aos resultados
      const { data: formsData, error: formsError } = await supabase
        .from('forms')
        .select(`
          id,
          title,
          description,
          publication_status,
          created_by,
          created_at,
          confidentiality_level,
          allowed_users,
          allowed_departments,
          allowed_roles,
          has_responses
        `)
        .in('publication_status', ['published_internal', 'published_external', 'published_mixed']);

      if (formsError) {
        console.error('Error fetching forms:', formsError);
        throw formsError;
      }

      if (!formsData) {
        setForms([]);
        return;
      }

      // Filtrar formulários baseado em permissões de confidencialidade
      const accessibleForms = formsData.filter(form => {
        // Se é o criador do formulário, sempre tem acesso
        if (form.created_by === user.id) {
          return true;
        }

        // Verificar confidencialidade
        switch (form.confidentiality_level) {
          case 'public':
            return true;
          
          case 'department_leaders':
            return profile.is_leader || 
                   profile.role === 'director' || 
                   profile.role === 'admin' || 
                   profile.role === 'hr';
          
          case 'directors_admins':
            return profile.role === 'director' || profile.role === 'admin';
          
          default:
            return false;
        }
      });

      // Buscar informações dos criadores
      const creatorIds = [...new Set(accessibleForms.map(f => f.created_by))];
      const { data: creatorsData, error: creatorsError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', creatorIds);

      if (creatorsError) {
        console.error('Error fetching creators:', creatorsError);
      }

      // Buscar contagem de respostas para cada formulário
      const formsWithData: FormResultsAccess[] = [];

      for (const form of accessibleForms) {
        const creator = creatorsData?.find(c => c.id === form.created_by);
        
        // Buscar contagem de respostas
        const { count: responseCount, error: countError } = await supabase
          .from('form_responses')
          .select('*', { count: 'exact', head: true })
          .eq('form_id', form.id);

        if (countError) {
          console.error('Error counting responses for form', form.id, countError);
        }

        formsWithData.push({
          ...form,
          creator_name: creator?.name || 'Usuário desconhecido',
          response_count: responseCount || 0,
          has_responses: (responseCount || 0) > 0
        });
      }

      console.log('useFormResultsAccess: Found accessible forms:', formsWithData.length);
      setForms(formsWithData);
    } catch (error) {
      console.error('useFormResultsAccess: Error fetching accessible forms:', error);
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessibleForms();
  }, [user, profile]);

  return {
    forms,
    loading,
    refetch: fetchAccessibleForms
  };
};