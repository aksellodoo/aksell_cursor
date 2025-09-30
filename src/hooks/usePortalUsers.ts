
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PortalUser {
  id: string;
  portal_id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const mapError = (error: unknown) => {
  const message = (error as { message?: string })?.message || "Erro desconhecido";
  return new Error(message);
};

export function usePortalUsers(portalId?: string) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["portal_users", portalId],
    queryFn: async (): Promise<PortalUser[]> => {
      if (!portalId) return [];
      console.log("[usePortalUsers] Fetching portal users...", { portalId });
      const { data, error } = await supabase
        .from("portal_users")
        .select("*")
        .eq("portal_id", portalId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("[usePortalUsers] Error fetching", error);
        throw mapError(error);
      }
      return (data as PortalUser[]) ?? [];
    },
    enabled: !!portalId,
  });

  const createMutation = useMutation({
    mutationKey: ["portal_users:create", portalId],
    mutationFn: async (payload: { name: string; email: string }) => {
      if (!portalId) throw new Error("portalId ausente");
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) {
        throw new Error("Usuário não autenticado.");
      }

      const insertPayload = {
        portal_id: portalId,
        name: payload.name,
        email: payload.email,
        is_active: true,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from("portal_users")
        .insert(insertPayload)
        .select("*")
        .single();

      if (error) {
        console.error("[usePortalUsers] Error creating", error);
        throw mapError(error);
      }
      return data as PortalUser;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["portal_users", portalId] });
    },
    meta: {
      onError: (err: unknown) => {
        console.error("[usePortalUsers] create error (meta)", err);
      },
    },
  });

  const updateActiveMutation = useMutation({
    mutationKey: ["portal_users:updateActive", portalId],
    mutationFn: async (input: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from("portal_users")
        .update({ is_active: input.is_active })
        .eq("id", input.id)
        .select("*")
        .single();
      if (error) {
        console.error("[usePortalUsers] Error updating active", error);
        throw mapError(error);
      }
      return data as PortalUser;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["portal_users", portalId] });
    },
  });

  const deleteMutation = useMutation({
    mutationKey: ["portal_users:delete", portalId],
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("portal_users").delete().eq("id", id);
      if (error) {
        console.error("[usePortalUsers] Error deleting", error);
        throw mapError(error);
      }
      return true;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["portal_users", portalId] });
    },
  });

  return {
    listQuery,
    createMutation,
    updateActiveMutation,
    deleteMutation,
  };
}
