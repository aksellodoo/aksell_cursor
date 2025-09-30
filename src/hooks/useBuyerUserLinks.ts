
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BuyerUserLink {
  id: string;
  buyer_code: string;
  user_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBuyerUserLinkPayload {
  buyer_code: string;
  user_id: string;
}

export function useBuyerUserLinks() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["buyer_user_links"],
    queryFn: async (): Promise<BuyerUserLink[]> => {
      console.log("[useBuyerUserLinks] Fetching buyer-user links...");
      
      const { data, error } = await supabase
        .from("buyer_user_links")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("[useBuyerUserLinks] Error fetching links", error);
        throw new Error(error.message);
      }
      
      return data as BuyerUserLink[] ?? [];
    },
  });

  const createMutation = useMutation({
    mutationKey: ["buyer_user_links:create"],
    mutationFn: async (payload: CreateBuyerUserLinkPayload) => {
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
        .from("buyer_user_links")
        .insert(insertPayload)
        .select("*")
        .single();

      if (error) {
        console.error("[useBuyerUserLinks] Error creating link", error);
        throw new Error(error.message);
      }
      
      return data as BuyerUserLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyer_user_links"] });
    },
  });

  const updateMutation = useMutation({
    mutationKey: ["buyer_user_links:update"],
    mutationFn: async (input: { id: string } & Partial<CreateBuyerUserLinkPayload>) => {
      const { id, ...updateData } = input;
      
      const { data, error } = await supabase
        .from("buyer_user_links")
        .update(updateData)
        .eq("id", id)
        .select("*")
        .single();
      
      if (error) {
        console.error("[useBuyerUserLinks] Error updating link", error);
        throw new Error(error.message);
      }
      
      return data as BuyerUserLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyer_user_links"] });
    },
  });

  const deleteMutation = useMutation({
    mutationKey: ["buyer_user_links:delete"],
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("buyer_user_links")
        .delete()
        .eq("id", id);
      
      if (error) {
        console.error("[useBuyerUserLinks] Error deleting link", error);
        throw new Error(error.message);
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyer_user_links"] });
    },
  });

  const getLinkByBuyerCode = (buyerCode: string) => {
    return listQuery.data?.find(link => link.buyer_code === buyerCode);
  };

  return {
    listQuery,
    createMutation,
    updateMutation,
    deleteMutation,
    getLinkByBuyerCode,
  };
}
