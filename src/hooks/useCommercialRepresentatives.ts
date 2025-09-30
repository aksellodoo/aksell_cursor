
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CommercialRepresentative {
  id: string;
  company_name: string;
  is_sales: boolean;
  is_purchases: boolean;
  is_registered_in_protheus: boolean;
  protheus_table_id?: string;
  supplier_filial?: string;
  supplier_cod?: string;
  supplier_loja?: string;
  supplier_key?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRepresentativePayload {
  company_name: string;
  is_sales: boolean;
  is_purchases: boolean;
  is_registered_in_protheus: boolean;
  protheus_table_id?: string;
  supplier_filial?: string;
  supplier_cod?: string;
  supplier_loja?: string;
  notes?: string;
}

const mapError = (error: unknown) => {
  const message = (error as { message?: string })?.message || "Erro desconhecido";
  return new Error(message);
};

export function useCommercialRepresentatives(type?: 'sales' | 'purchases') {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["commercial_representatives", type],
    queryFn: async (): Promise<CommercialRepresentative[]> => {
      console.log("[useCommercialRepresentatives] Fetching representatives...", { type });
      
      let query = supabase
        .from("commercial_representatives")
        .select("*")
        .order("created_at", { ascending: false });

      if (type === 'sales') {
        query = query.eq('is_sales', true);
      } else if (type === 'purchases') {
        query = query.eq('is_purchases', true);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error("[useCommercialRepresentatives] Error fetching", error);
        throw mapError(error);
      }
      return (data as CommercialRepresentative[]) ?? [];
    },
  });

  const createMutation = useMutation({
    mutationKey: ["commercial_representatives:create"],
    mutationFn: async (payload: CreateRepresentativePayload) => {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) {
        throw new Error("Usuário não autenticado.");
      }

      const insertPayload = {
        ...payload,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from("commercial_representatives")
        .insert(insertPayload)
        .select("*")
        .single();

      if (error) {
        console.error("[useCommercialRepresentatives] Error creating", error);
        throw mapError(error);
      }
      return data as CommercialRepresentative;
    },
    onSuccess: (newRepresentative) => {
      // Update cache directly for immediate availability
      queryClient.setQueryData(["commercial_representatives"], (oldData: CommercialRepresentative[] | undefined) => {
        return oldData ? [newRepresentative, ...oldData] : [newRepresentative];
      });
      
      if (newRepresentative.is_sales) {
        queryClient.setQueryData(["commercial_representatives", "sales"], (oldData: CommercialRepresentative[] | undefined) => {
          return oldData ? [newRepresentative, ...oldData] : [newRepresentative];
        });
      }
      
      if (newRepresentative.is_purchases) {
        queryClient.setQueryData(["commercial_representatives", "purchases"], (oldData: CommercialRepresentative[] | undefined) => {
          return oldData ? [newRepresentative, ...oldData] : [newRepresentative];
        });
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["commercial_representatives"] });
    },
  });

  const updateMutation = useMutation({
    mutationKey: ["commercial_representatives:update"],
    mutationFn: async (input: { id: string } & Partial<CreateRepresentativePayload>) => {
      const { id, ...updateData } = input;
      const { data, error } = await supabase
        .from("commercial_representatives")
        .update(updateData)
        .eq("id", id)
        .select("*")
        .single();
      
      if (error) {
        console.error("[useCommercialRepresentatives] Error updating", error);
        throw mapError(error);
      }
      return data as CommercialRepresentative;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["commercial_representatives"] });
    },
  });

  const deleteMutation = useMutation({
    mutationKey: ["commercial_representatives:delete"],
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("commercial_representatives")
        .delete()
        .eq("id", id);
      
      if (error) {
        console.error("[useCommercialRepresentatives] Error deleting", error);
        throw mapError(error);
      }
      return true;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["commercial_representatives"] });
    },
  });

  return {
    listQuery,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
