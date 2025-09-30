import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";
import { getErrorMessage } from '../_shared/errorUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MonitorStats {
  total_tables: number;
  active_tables: number;
  recent_syncs: number;
  failed_syncs: number;
  avg_sync_time: number;
  last_scheduler_run: string | null;
  health_status: 'healthy' | 'warning' | 'critical';
  issues: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Starting Protheus sync monitor...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current timestamp for analysis
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Get table statistics
    const { data: allTables, error: tablesError } = await supabase
      .from('protheus_tables')
      .select('id, table_name, is_active, last_sync_at, query_interval_value, query_interval_unit');

    if (tablesError) {
      throw new Error(`Error fetching tables: ${tablesError.message}`);
    }

    const totalTables = allTables?.length || 0;
    const activeTables = allTables?.filter(t => t.is_active).length || 0;

    // 2. Get recent sync statistics
    const { data: recentSyncs, error: syncsError } = await supabase
      .from('protheus_sync_logs')
      .select('id, status, started_at, finished_at, error_message')
      .gte('started_at', oneHourAgo.toISOString())
      .order('started_at', { ascending: false });

    if (syncsError) {
      console.warn('Error fetching recent syncs:', syncsError.message);
    }

    const recentSyncCount = recentSyncs?.length || 0;
    const failedSyncCount = recentSyncs?.filter(s => s.status === 'error').length || 0;

    // 3. Calculate average sync time
    const completedSyncs = recentSyncs?.filter(s => 
      s.status === 'completed' && s.started_at && s.finished_at
    ) || [];
    
    let avgSyncTime = 0;
    if (completedSyncs.length > 0) {
      const totalTime = completedSyncs.reduce((sum, sync) => {
        const start = new Date(sync.started_at).getTime();
        const end = new Date(sync.finished_at).getTime();
        return sum + (end - start);
      }, 0);
      avgSyncTime = Math.round(totalTime / completedSyncs.length / 1000); // seconds
    }

    // 4. Get last scheduler run
    const { data: lastSchedulerRun, error: schedulerError } = await supabase
      .from('cron_job_logs')
      .select('created_at, status')
      .eq('job_name', 'protheus_sync_scheduler')
      .order('created_at', { ascending: false })
      .limit(1);

    if (schedulerError) {
      console.warn('Error fetching scheduler logs:', schedulerError.message);
    }

    const lastSchedulerTime = lastSchedulerRun?.[0]?.created_at || null;

    // 5. Health assessment
    const issues: string[] = [];
    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check for failed syncs
    if (failedSyncCount > 0) {
      issues.push(`${failedSyncCount} sync(s) falharam na última hora`);
      healthStatus = failedSyncCount > 2 ? 'critical' : 'warning';
    }

    // Check scheduler frequency
    if (lastSchedulerTime) {
      const timeSinceLastRun = now.getTime() - new Date(lastSchedulerTime).getTime();
      const minutesSinceLastRun = Math.round(timeSinceLastRun / (1000 * 60));
      
      if (minutesSinceLastRun > 10) {
        issues.push(`Scheduler não executou há ${minutesSinceLastRun} minutos`);
        healthStatus = minutesSinceLastRun > 30 ? 'critical' : 'warning';
      }
    } else {
      issues.push('Nenhuma execução do scheduler encontrada');
      healthStatus = 'critical';
    }

    // Check for tables overdue for sync
    const overdueTables = allTables?.filter(table => {
      if (!table.is_active || !table.last_sync_at) return false;
      
      const lastSync = new Date(table.last_sync_at);
      const intervalMs = convertIntervalToMs(table.query_interval_value, table.query_interval_unit);
      const nextSyncDue = new Date(lastSync.getTime() + intervalMs);
      
      return now > nextSyncDue;
    }) || [];

    if (overdueTables.length > 0) {
      issues.push(`${overdueTables.length} tabela(s) atrasada(s) para sincronização`);
      if (healthStatus === 'healthy') healthStatus = 'warning';
    }

    // Check for very slow syncs
    if (avgSyncTime > 300) { // > 5 minutes
      issues.push(`Tempo médio de sync alto: ${avgSyncTime}s`);
      if (healthStatus === 'healthy') healthStatus = 'warning';
    }

    // 6. Compile monitoring stats
    const stats: MonitorStats = {
      total_tables: totalTables,
      active_tables: activeTables,
      recent_syncs: recentSyncCount,
      failed_syncs: failedSyncCount,
      avg_sync_time: avgSyncTime,
      last_scheduler_run: lastSchedulerTime,
      health_status: healthStatus,
      issues: issues
    };

    console.log('📊 Monitor stats compiled:', stats);

    // 7. Log monitor execution
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: 'protheus_sync_monitor',
        status: 'success',
        details: stats
      });

    // 8. Create alerts for critical issues
    if (healthStatus === 'critical') {
      await createSystemAlert(supabase, stats);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Monitor executado com sucesso',
        data: stats
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in sync monitor:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: getErrorMessage(error) || 'Erro interno do monitor'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function convertIntervalToMs(value: number, unit: string): number {
  const multipliers = {
    'seconds': 1000,
    'minutes': 60 * 1000,
    'hours': 60 * 60 * 1000,
    'days': 24 * 60 * 60 * 1000
  };

  const multiplier = multipliers[unit as keyof typeof multipliers] || multipliers.minutes;
  return value * multiplier;
}

async function createSystemAlert(supabase: any, stats: MonitorStats) {
  try {
    // Create alert for system administrators
    const { data: admins, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .eq('status', 'active');

    if (adminError || !admins || admins.length === 0) {
      console.warn('No admin users found for alert');
      return;
    }

    const alertMessage = `Sistema de sincronização Protheus com status CRÍTICO: ${stats.issues.join(', ')}`;

    for (const admin of admins) {
      await supabase
        .from('app_notifications')
        .insert({
          user_id: admin.id,
          type: 'system_alert',
          title: 'Alerta: Sincronização Protheus',
          message: alertMessage,
          data: {
            monitor_stats: stats,
            alert_level: 'critical',
            timestamp: new Date().toISOString()
          }
        });
    }

    console.log('🚨 System alert created for admins');
  } catch (error: any) {
    console.error('Error creating system alert:', error?.message || error);
  }
}