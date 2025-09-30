import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SyncAutomationStatus {
  isActive: boolean;
  lastSchedulerRun: string | null;
  loading: boolean;
}

export const useSyncAutomationStatus = () => {
  const [status, setStatus] = useState<SyncAutomationStatus>({
    isActive: false,
    lastSchedulerRun: null,
    loading: true,
  });

  useEffect(() => {
    const checkAutomationStatus = async () => {
      try {
        // Verificar último log do scheduler nos últimos 10 minutos
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        const { data: recentLogs, error } = await supabase
          .from('cron_job_logs')
          .select('executed_at, status')
          .eq('job_name', 'protheus_sync_scheduler')
          .gte('executed_at', tenMinutesAgo.toISOString())
          .order('executed_at', { ascending: false })
          .limit(1);

        if (error) {
          console.warn('Error checking automation status:', error);
          setStatus(prev => ({ ...prev, loading: false }));
          return;
        }

        // Buscar o último log geral do scheduler
        const { data: lastLog, error: lastLogError } = await supabase
          .from('cron_job_logs')
          .select('executed_at, status')
          .eq('job_name', 'protheus_sync_scheduler')
          .order('executed_at', { ascending: false })
          .limit(1);

        if (lastLogError) {
          console.warn('Error fetching last scheduler log:', lastLogError);
        }

        const isActive = recentLogs && recentLogs.length > 0;
        const lastSchedulerRun = lastLog && lastLog.length > 0 
          ? lastLog[0].executed_at 
          : null;

        setStatus({
          isActive,
          lastSchedulerRun,
          loading: false,
        });
      } catch (error) {
        console.error('Error checking sync automation status:', error);
        setStatus(prev => ({ ...prev, loading: false }));
      }
    };

    checkAutomationStatus();
    
    // Verificar a cada 30 segundos
    const interval = setInterval(checkAutomationStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const triggerManualScheduler = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true }));
      
      const { data, error } = await supabase.functions.invoke('activate-scheduler', {
        body: { triggered_by: 'manual_activation' }
      });

      if (error) {
        console.error('Erro ao ativar scheduler:', error);
        toast.error(`Erro ao ativar sincronização: ${error.message || 'Erro desconhecido'}`);
        return { success: false, error };
      }

      console.log('Scheduler ativado:', data);
      toast.success('Sincronização automática ativada com sucesso');

      // Aguardar um pouco e verificar novamente o status
      setTimeout(() => {
        const checkStatus = async () => {
          const { data: newLog } = await supabase
            .from('cron_job_logs')
            .select('executed_at, status')
            .eq('job_name', 'protheus_sync_scheduler')
            .order('executed_at', { ascending: false })
            .limit(1);

          if (newLog && newLog.length > 0) {
            setStatus(prev => ({
              ...prev,
              isActive: true,
              lastSchedulerRun: newLog[0].executed_at,
              loading: false,
            }));
          } else {
            setStatus(prev => ({ ...prev, loading: false }));
          }
        };
        checkStatus();
      }, 3000);

      return { success: true, data };
    } catch (error: any) {
      console.error('Erro inesperado:', error);
      toast.error(`Erro inesperado: ${error.message || 'Falha na comunicação'}`);
      setStatus(prev => ({ ...prev, loading: false }));
      return { success: false, error };
    }
  };

  return {
    ...status,
    triggerManualScheduler,
  };
};