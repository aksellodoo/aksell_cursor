import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface FormResponseWithUser {
  id: string;
  form_id: string;
  response_data: any;
  submitted_by?: string;
  submitted_at: string;
  ip_address?: string;
  user_agent?: string;
  metadata: any;
  user_name?: string;
  user_email?: string;
  user_department?: string;
}

export interface FormResultsAnalytics {
  totalResponses: number;
  completionRate: number;
  averageCompletionTime: number;
  responsesByDate: Array<{ date: string; count: number }>;
  responsesByUser: Array<{ user_name: string; count: number }>;
  fieldAnalytics: Array<{ field: string; mostCommon: string; responses: number }>;
}

export const useFormResults = (formId?: string) => {
  const { user } = useAuth();
  const [responses, setResponses] = useState<FormResponseWithUser[]>([]);
  const [analytics, setAnalytics] = useState<FormResultsAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>(null);

  const fetchFormDetails = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setForm(data);
      return data;
    } catch (error) {
      console.error('Error fetching form details:', error);
      return null;
    }
  };

  const fetchFormResponses = async (id: string) => {
    setLoading(true);
    try {
      // Buscar respostas simples primeiro
      const { data: responsesData, error: responsesError } = await supabase
        .from('form_responses')
        .select('*')
        .eq('form_id', id)
        .order('submitted_at', { ascending: false });

      if (responsesError) throw responsesError;

      // Buscar informações dos usuários separadamente
      const userIds = responsesData?.map(r => r.submitted_by).filter(Boolean) || [];
      let profilesData: any[] = [];
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email, department')
          .in('id', userIds);
        
        if (!profilesError) {
          profilesData = profiles || [];
        }
      }

      // Mapear dados para incluir informações do usuário
      const enrichedResponses: FormResponseWithUser[] = (responsesData || []).map(response => {
        const userProfile = profilesData.find(p => p.id === response.submitted_by);
        return {
          ...response,
          ip_address: response.ip_address as string,
          user_name: userProfile?.name || 'Usuário Anônimo',
          user_email: userProfile?.email || 'N/A',
          user_department: userProfile?.department || 'N/A'
        };
      });

      setResponses(enrichedResponses);
      
      // Calcular analytics básicas
      const totalResponses = enrichedResponses.length;
      const completionRate = totalResponses > 0 ? 100 : 0; // Assumindo que todas as respostas são completas
      
      // Respostas por data (últimos 30 dias)
      const responsesByDate = generateDateAnalytics(enrichedResponses);
      
      // Respostas por usuário
      const responsesByUser = generateUserAnalytics(enrichedResponses);
      
      // Analytics de campos (básico)
      const fieldAnalytics = generateFieldAnalytics(enrichedResponses);

      setAnalytics({
        totalResponses,
        completionRate,
        averageCompletionTime: 0, // TODO: calcular tempo médio
        responsesByDate,
        responsesByUser,
        fieldAnalytics
      });

    } catch (error) {
      console.error('Error fetching form responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDateAnalytics = (responses: FormResponseWithUser[]) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last30Days.map(date => ({
      date,
      count: responses.filter(r => r.submitted_at.startsWith(date)).length
    }));
  };

  const generateUserAnalytics = (responses: FormResponseWithUser[]) => {
    const userCounts: { [key: string]: number } = {};
    
    responses.forEach(response => {
      const userName = response.user_name || 'Anônimo';
      userCounts[userName] = (userCounts[userName] || 0) + 1;
    });

    return Object.entries(userCounts)
      .map(([user_name, count]) => ({ user_name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 usuários
  };

  const generateFieldAnalytics = (responses: FormResponseWithUser[]) => {
    if (responses.length === 0) return [];

    const fieldStats: { [key: string]: { [value: string]: number } } = {};
    
    responses.forEach(response => {
      Object.entries(response.response_data || {}).forEach(([field, value]) => {
        if (!fieldStats[field]) fieldStats[field] = {};
        const stringValue = String(value || 'Vazio');
        fieldStats[field][stringValue] = (fieldStats[field][stringValue] || 0) + 1;
      });
    });

    return Object.entries(fieldStats).map(([field, values]) => {
      const mostCommon = Object.entries(values)
        .sort(([,a], [,b]) => b - a)[0];
      
      return {
        field,
        mostCommon: mostCommon ? mostCommon[0] : 'N/A',
        responses: Object.values(values).reduce((sum, count) => sum + count, 0)
      };
    });
  };

  const exportToCSV = () => {
    if (responses.length === 0) return;

    const headers = ['Data de Envio', 'Usuário', 'E-mail', 'Departamento'];
    const responseFields = Object.keys(responses[0]?.response_data || {});
    const allHeaders = [...headers, ...responseFields];

    const csvContent = [
      allHeaders.join(','),
      ...responses.map(response => [
        new Date(response.submitted_at).toLocaleString('pt-BR'),
        response.user_name || 'Anônimo',
        response.user_email || 'N/A',
        response.user_department || 'N/A',
        ...responseFields.map(field => 
          JSON.stringify(response.response_data?.[field] || '')
        )
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `respostas-${form?.title || 'formulario'}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (formId) {
      fetchFormDetails(formId);
      fetchFormResponses(formId);
    }
  }, [formId]);

  return {
    form,
    responses,
    analytics,
    loading,
    refetch: () => formId && fetchFormResponses(formId),
    exportToCSV
  };
};