
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PortalStakeholder = "cliente" | "fornecedor" | "funcionario" | "outro";

export interface Portal {
  id: string;
  name: string;
  stakeholder: PortalStakeholder;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const mapError = (error: unknown) => {
  const message = (error as { message?: string })?.message || "Erro desconhecido";
  return new Error(message);
};

export function usePortals() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["portals"],
    queryFn: async (): Promise<Portal[]> => {
      console.log("[usePortals] Fetching portals...");
      const { data, error } = await supabase
        .from("portals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("[usePortals] Error fetching portals", error);
        throw mapError(error);
      }
      return (data as Portal[]) ?? [];
    },
  });

  const createMutation = useMutation({
    mutationKey: ["portals:create"],
    mutationFn: async (payload: { name: string; stakeholder: PortalStakeholder }) => {
      console.log("[usePortals] Creating portal...", payload);
      // created_by é preenchido com auth.uid() pela própria requisição
      // conforme RLS exige que created_by = auth.uid() e que o usuário seja admin/director.
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) {
        throw new Error("Usuário não autenticado.");
      }

      const insertPayload = {
        name: payload.name,
        stakeholder: payload.stakeholder,
        is_active: true,
        created_by: user.id,
      };

      const { data, error } = await supabase.from("portals").insert(insertPayload).select("*").single();
      if (error) {
        console.error("[usePortals] Error creating portal", error);
        throw mapError(error);
      }
      return data as Portal;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["portals"] });
    },
    meta: {
      onError: (err: unknown) => {
        console.error("[usePortals] create error (meta)", err);
      },
    },
  });

  return {
    listQuery,
    createMutation,
  };
}

