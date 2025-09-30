
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SiteCity {
  id: string;
  name: string;
  cod_munic: string;
  cod_uf: string;
  uf: string;
  country?: string;
  population_est?: number;
  codigo_ibge?: string;
  latitude?: number;
  longitude?: number;
  capital?: number;
  siafi_id?: string;
  ddd?: string;
  fuso_horario?: string;
  distance_km_to_indaiatuba?: number;
  average_truck_travel_time_hours?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export function useSiteCities() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["site_cities"],
    queryFn: async (): Promise<SiteCity[]> => {
      console.log("[useSiteCities] Fetching site cities...");
      const { data, error } = await supabase
        .from("site_cities")
        .select("*")
        .order("name");

      if (error) {
        console.error("[useSiteCities] Error fetching", error);
        throw error;
      }

      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (city: Omit<SiteCity, "id" | "created_at" | "updated_at">) => {
      console.log("[useSiteCities] Creating city...", city);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("site_cities")
        .insert({
          ...city,
          created_by: user.user.id,
        })
        .select("*")
        .single();

      if (error) {
        console.error("[useSiteCities] Error creating", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site_cities"] });
      toast({
        title: "Cidade cadastrada",
        description: "A cidade foi cadastrada com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error("[useSiteCities] Create error", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar cidade.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SiteCity> & { id: string }) => {
      console.log("[useSiteCities] Updating city...", id, updates);
      
      const { data, error } = await supabase
        .from("site_cities")
        .update(updates)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        console.error("[useSiteCities] Error updating", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site_cities"] });
      toast({
        title: "Cidade atualizada",
        description: "A cidade foi atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error("[useSiteCities] Update error", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar cidade.",
        variant: "destructive",
      });
    },
  });

  return {
    cities: listQuery.data || [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createCity: createMutation.mutate,
    updateCity: updateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
