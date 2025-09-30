import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAutomaticSyncStatus = () => {
  return useQuery({
    queryKey: ['automatic-sync-status'],
    queryFn: async () => {
      // Verificar se houve execução do scheduler nos últimos 10 minutos
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      const { data: recentSchedulerRuns, error } = await supabase
        .from('cron_job_logs')
        .select('*')
        .eq('job_name', 'protheus_sync_scheduler')
        .gte('executed_at', tenMinutesAgo)
        .order('executed_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Erro ao verificar status automático:', error);
        return { isActive: false, lastRun: null };
      }

      return {
        isActive: recentSchedulerRuns && recentSchedulerRuns.length > 0,
        lastRun: recentSchedulerRuns?.[0]?.executed_at || null
      };
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
};