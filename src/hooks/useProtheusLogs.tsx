import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProtheusLog {
  id: string;
  user_id: string;
  config_id: string;
  endpoint_used: string;
  request_data: any;
  response_status: 'success' | 'error' | 'timeout';
  response_data?: any;
  response_time_ms?: number;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
  executed_at: string;
  created_at: string;
}

export interface LogFilters {
  startDate?: Date;
  endDate?: Date;
  endpoint?: string;
  status?: string;
}

export const useProtheusLogs = (filters: LogFilters = {}) => {
  return useQuery({
    queryKey: ['protheus-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('protheus_usage_logs')
        .select('*')
        .order('executed_at', { ascending: false });

      if (filters.startDate) {
        query = query.gte('executed_at', filters.startDate.toISOString());
      }
      
      if (filters.endDate) {
        query = query.lte('executed_at', filters.endDate.toISOString());
      }
      
      if (filters.endpoint) {
        query = query.eq('endpoint_used', filters.endpoint);
      }
      
      if (filters.status) {
        query = query.eq('response_status', filters.status);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data as ProtheusLog[];
    },
  });
};

export const useProtheusLogStats = () => {
  return useQuery({
    queryKey: ['protheus-log-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('protheus_usage_logs')
        .select('response_status, response_time_ms, endpoint_used, executed_at')
        .gte('executed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // últimos 30 dias

      if (error) throw error;

      const totalLogs = data.length;
      const successLogs = data.filter(log => log.response_status === 'success').length;
      const errorLogs = data.filter(log => log.response_status === 'error').length;
      const timeoutLogs = data.filter(log => log.response_status === 'timeout').length;
      
      const avgResponseTime = data
        .filter(log => log.response_time_ms)
        .reduce((acc, log) => acc + (log.response_time_ms || 0), 0) / 
        (data.filter(log => log.response_time_ms).length || 1);

      const endpointUsage = data.reduce((acc, log) => {
        acc[log.endpoint_used] = (acc[log.endpoint_used] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalLogs,
        successLogs,
        errorLogs,
        timeoutLogs,
        successRate: totalLogs > 0 ? (successLogs / totalLogs) * 100 : 0,
        avgResponseTime: Math.round(avgResponseTime),
        endpointUsage,
      };
    },
  });
};