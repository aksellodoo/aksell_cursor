import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type TaskSeriesRow = Database['public']['Tables']['task_series']['Row'];
type TaskSeriesInsert = Database['public']['Tables']['task_series']['Insert'];
type FixedTaskType = Database['public']['Enums']['fixed_task_type'];

export interface TaskSeries extends TaskSeriesRow {}

export interface CreateTaskSeriesData {
  title: string;
  description?: string;
  fixed_type: FixedTaskType;
  base_payload?: any;
  base_template_id?: string;
  base_template_snapshot?: any;
  timezone?: string;
  dtstart: string;
  rrule: string;
  exdates?: string[];
  until_date?: string;
  count_limit?: number;
  lookahead_count?: number;
  catch_up_limit?: number;
  generation_mode?: 'on_schedule' | 'on_prev_complete';
  adjust_policy?: 'none' | 'previous_business_day' | 'next_business_day';
  days_before_due?: number;
}

export const useTaskSeries = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [series, setSeries] = useState<TaskSeries[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSeries = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('task_series')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSeries(data || []);
    } catch (error: any) {
      console.error('Error fetching task series:', error);
      toast({
        title: "Erro ao carregar séries",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSeries = async (seriesData: CreateTaskSeriesData): Promise<TaskSeries | null> => {
    if (!user) return null;

    try {
      const nextRunAt = new Date(seriesData.dtstart);
      
      const { data, error } = await supabase
        .from('task_series')
        .insert({
          ...seriesData,
          owner_id: user.id,
          timezone: seriesData.timezone || 'America/Sao_Paulo',
          base_payload: seriesData.base_payload || {},
          base_template_snapshot: seriesData.base_template_snapshot || {},
          lookahead_count: seriesData.lookahead_count || 1,
          catch_up_limit: seriesData.catch_up_limit || 1,
          generation_mode: seriesData.generation_mode || 'on_schedule',
          adjust_policy: seriesData.adjust_policy || 'none',
          days_before_due: seriesData.days_before_due || 0,
          next_run_at: nextRunAt.toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      
      setSeries(prev => [data, ...prev]);
      
      toast({
        title: "Série criada",
        description: `Série "${data.title}" criada com sucesso!`,
      });

      return data;
    } catch (error: any) {
      console.error('Error creating task series:', error);
      toast({
        title: "Erro ao criar série",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateSeries = async (seriesId: string, updates: Partial<TaskSeries>): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('task_series')
        .update(updates)
        .eq('id', seriesId)
        .select()
        .single();

      if (error) throw error;
      
      setSeries(prev => prev.map(s => s.id === seriesId ? data : s));
      
      toast({
        title: "Série atualizada",
        description: "Série atualizada com sucesso!",
      });

      return true;
    } catch (error: any) {
      console.error('Error updating task series:', error);
      toast({
        title: "Erro ao atualizar série",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const pauseSeries = async (seriesId: string): Promise<boolean> => {
    return updateSeries(seriesId, { status: 'paused' });
  };

  const resumeSeries = async (seriesId: string): Promise<boolean> => {
    return updateSeries(seriesId, { status: 'active' });
  };

  const deleteSeries = async (seriesId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('task_series')
        .delete()
        .eq('id', seriesId);

      if (error) throw error;
      
      setSeries(prev => prev.filter(s => s.id !== seriesId));
      
      toast({
        title: "Série excluída",
        description: "Série excluída com sucesso!",
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting task series:', error);
      toast({
        title: "Erro ao excluir série",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Preview next dates based on RRULE
  const previewDates = (rrule: string, dtstart: string, exdates?: string[], until_date?: string, count_limit?: number) => {
    try {
      // This is a simplified preview - in production you'd use the same RRule logic as the Edge Function
      const dates: Date[] = [];
      const start = new Date(dtstart);
      const now = new Date();
      
      // Simple daily recurrence preview (expand this for full RRULE support)
      if (rrule.includes('FREQ=DAILY')) {
        const interval = rrule.includes('INTERVAL=') ? 
          parseInt(rrule.match(/INTERVAL=(\d+)/)?.[1] || '1') : 1;
        
        let current = new Date(Math.max(start.getTime(), now.getTime()));
        const limit = count_limit || 6;
        const until = until_date ? new Date(until_date) : new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000));
        
        for (let i = 0; i < limit && current <= until; i++) {
          if (!exdates?.some(exdate => new Date(exdate).getTime() === current.getTime())) {
            dates.push(new Date(current));
          }
          current = new Date(current.getTime() + (interval * 24 * 60 * 60 * 1000));
        }
      }
      
      return dates.slice(0, 6); // Return max 6 preview dates
    } catch (error) {
      console.error('Error previewing dates:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchSeries();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('task_series_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'task_series',
          filter: `owner_id=eq.${user.id}`
        }, 
        () => {
          fetchSeries();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return {
    series,
    loading,
    fetchSeries,
    createSeries,
    updateSeries,
    pauseSeries,
    resumeSeries,
    deleteSeries,
    previewDates
  };
};