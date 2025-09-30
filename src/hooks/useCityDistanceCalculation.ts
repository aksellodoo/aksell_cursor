
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DistanceJob {
  id: string;
  status: 'queued' | 'running' | 'cancelled' | 'completed' | 'failed';
  only_fill_empty: boolean;
  mode?: string;
  total_cities: number;
  processed_cities: number;
  failed_cities: number;
  phase: 'geocoding' | 'matrix';
  geocoded_cities: number;
  geocoding_started_at?: string;
  geocoding_finished_at?: string;
  error_message?: string;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  updated_at?: string;
}

interface DistanceError {
  id: string;
  city_id: string;
  reason: string;
  payload: any;
  created_at: string;
  city?: {
    name: string;
    uf: string;
  };
}

export function useCityDistanceCalculation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current job status
  const { data: currentJob, isLoading: isLoadingJob } = useQuery({
    queryKey: ['city-distance-job'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('city-distance-matrix', {
        body: { action: 'status' }
      });

      if (error) throw error;
      return data?.job as DistanceJob | null;
    },
    refetchInterval: (query) => {
      // Poll every 3 seconds when there's an active job
      const job = query.state.data as DistanceJob | null;
      const isActive = job?.status === 'running' || job?.status === 'queued';
      
      // Invalidate cities list during active job to show updated distances
      if (isActive) {
        queryClient.invalidateQueries({ queryKey: ['site_cities'] });
      }
      
      return isActive ? 3000 : false;
    },
    refetchIntervalInBackground: false,
  });

  // Check if job is running
  const isJobRunning = currentJob?.status === 'running' || currentJob?.status === 'queued';

  // Get job errors
  const { 
    data: jobErrors = [], 
    refetch: refetchErrors 
  } = useQuery({
    queryKey: ['city-distance-errors', currentJob?.id],
    queryFn: async () => {
      if (!currentJob?.id) return [];

      // First get the errors
      const { data: errorsData, error: errorsError } = await supabase
        .from('site_city_distance_errors')
        .select('*')
        .eq('job_id', currentJob.id)
        .order('created_at', { ascending: false });

      if (errorsError) throw errorsError;
      if (!errorsData) return [];

      // Then get city information for each error
      const enrichedErrors = await Promise.all(
        errorsData.map(async (error) => {
          const { data: cityData } = await supabase
            .from('site_cities')
            .select('name, uf')
            .eq('id', error.city_id)
            .single();

          return {
            ...error,
            city: cityData
          };
        })
      );

      return enrichedErrors as DistanceError[];
    },
    enabled: !!currentJob?.id,
    refetchInterval: isJobRunning ? 3000 : false, // Refresh errors every 3 seconds when job is running
  });

  // Start distance calculation
  const startCalculation = useMutation({
    mutationFn: async ({ mode }: { mode: 'fill_empty' | 'overwrite' | 'geocode_non_matrix' }) => {
      const { data, error } = await supabase.functions.invoke('city-distance-matrix', {
        body: { 
          action: 'start',
          mode
        }
      });

      if (error) throw error;
      
      // Trigger immediate tick to show progress faster
      if (data.jobId) {
        setTimeout(async () => {
          try {
            await supabase.functions.invoke('city-distance-matrix', {
              body: { action: 'tick' }
            });
          } catch (error) {
            console.log('Immediate tick failed, worker will handle it:', error);
          }
        }, 1000);
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (data.jobId) {
        toast({
          title: "Cálculo iniciado",
          description: `Processando ${data.totalCities} cidades`,
        });
        queryClient.invalidateQueries({ queryKey: ['city-distance-job'] });
        queryClient.invalidateQueries({ queryKey: ['site_cities'] });
      } else {
        toast({
          title: "Nenhuma cidade para processar",
          description: data.message || "Todas as cidades já foram processadas",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao iniciar cálculo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel calculation
  const cancelCalculation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('city-distance-matrix', {
        body: { action: 'cancel' }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Cálculo cancelado",
        description: "A operação foi interrompida",
      });
      queryClient.invalidateQueries({ queryKey: ['city-distance-job'] });
      queryClient.invalidateQueries({ queryKey: ['site_cities'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Force resume calculation
  const forceResume = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('city-distance-matrix', {
        body: { action: 'tick' }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Processamento retomado",
        description: "A operação foi reiniciada",
      });
      queryClient.invalidateQueries({ queryKey: ['city-distance-job'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao retomar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate progress percentage based on phase and mode
  const progressPercentage = currentJob?.total_cities > 0 
    ? currentJob.mode === 'geocode_non_matrix'
      ? Math.round((currentJob.processed_cities / currentJob.total_cities) * 100) // Single phase for geocode_non_matrix
      : currentJob.phase === 'geocoding'
        ? Math.round((currentJob.geocoded_cities / currentJob.total_cities) * 50) // Geocoding is 50% of total progress
        : Math.round(50 + (currentJob.processed_cities / currentJob.total_cities) * 50) // Matrix calculation is the other 50%
    : 0;

  // Get current phase progress text
  const getPhaseProgress = () => {
    if (!currentJob) return '';
    
    if (currentJob.mode === 'geocode_non_matrix') {
      return `Geocodificando e calculando distâncias ${currentJob.processed_cities}/${currentJob.total_cities} cidades`;
    } else if (currentJob.phase === 'geocoding') {
      return `Geocodificando ${currentJob.geocoded_cities}/${currentJob.total_cities} cidades`;
    } else {
      return `Calculando distâncias ${currentJob.processed_cities}/${currentJob.total_cities} cidades`;
    }
  };

  // Helper function to calculate estimated remaining time and stall detection
  const estimatedRemainingMinutes = useMemo(() => {
    if (!currentJob || currentJob.status !== 'running' || !currentJob.processed_cities || !currentJob.total_cities) {
      return null;
    }

    const processed = currentJob.processed_cities;
    const total = currentJob.total_cities;
    const startTime = new Date(currentJob.started_at).getTime();
    const now = Date.now();
    const elapsed = now - startTime;
    
    if (processed === 0) return null;
    
    const avgTimePerCity = elapsed / processed;
    const remaining = total - processed;
    const estimatedMs = remaining * avgTimePerCity;
    
    return Math.round(estimatedMs / (1000 * 60)); // Convert to minutes
  }, [currentJob]);

  // Detect if job appears stalled (no progress in last 10 minutes)
  const isJobStalled = useMemo(() => {
    if (!currentJob || currentJob.status !== 'running') return false;
    
    const lastUpdate = currentJob.updated_at || currentJob.started_at;
    const timeSinceUpdate = Date.now() - new Date(lastUpdate).getTime();
    const TEN_MINUTES = 10 * 60 * 1000;
    
    return timeSinceUpdate > TEN_MINUTES;
  }, [currentJob]);

  const minutesSinceLastUpdate = useMemo(() => {
    if (!currentJob || currentJob.status !== 'running') return 0;
    
    const lastUpdate = currentJob.updated_at || currentJob.started_at;
    const timeSinceUpdate = Date.now() - new Date(lastUpdate).getTime();
    
    return Math.floor(timeSinceUpdate / (60 * 1000));
  }, [currentJob]);

  return {
    currentJob,
    jobErrors,
    isLoadingJob,
    isJobRunning,
    progressPercentage,
    getPhaseProgress,
    estimatedRemainingMinutes,
    isJobStalled,
    minutesSinceLastUpdate,
    startCalculation,
    cancelCalculation,
    forceResume,
    refetchErrors,
    isStarting: startCalculation.isPending,
    isCancelling: cancelCalculation.isPending,
    isForceResuming: forceResume.isPending,
  };
}
