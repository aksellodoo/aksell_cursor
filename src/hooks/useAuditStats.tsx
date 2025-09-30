import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuditStats {
  size: number;
  count: number;
  sizeFormatted: string;
  monthlyGrowth: number;
}

export const useAuditStats = () => {
  const [stats, setStats] = useState<AuditStats>({
    size: 0,
    count: 0,
    sizeFormatted: '0 KB',
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const fetchStats = async () => {
    try {
      // Get size and count
      const [sizeResult, countResult] = await Promise.all([
        supabase.rpc('get_audit_log_size'),
        supabase.rpc('get_audit_log_count')
      ]);

      // Get monthly growth (logs from last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: monthlyData } = await supabase
        .from('field_audit_log')
        .select('id')
        .gte('timestamp', thirtyDaysAgo.toISOString());

      const size = sizeResult.data || 0;
      const count = countResult.data || 0;
      const monthlyGrowth = monthlyData?.length || 0;

      setStats({
        size,
        count,
        sizeFormatted: formatBytes(size),
        monthlyGrowth
      });
    } catch (error) {
      console.error('Error fetching audit stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const cleanOldLogs = async (daysToKeep: number = 90) => {
    try {
      const { data } = await supabase.rpc('clean_audit_logs', { days_to_keep: daysToKeep });
      await fetchStats(); // Refresh stats after cleaning
      return data || 0;
    } catch (error) {
      console.error('Error cleaning audit logs:', error);
      throw error;
    }
  };

  return {
    stats,
    loading,
    refetch: fetchStats,
    cleanOldLogs
  };
};