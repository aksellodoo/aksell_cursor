
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VendorUserLink {
  id: string;
  vendor_code: string;
  user_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVendorUserLinkPayload {
  vendor_code: string;
  user_id: string;
}

export function useVendorUserLinks() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["vendor_user_links"],
    queryFn: async (): Promise<VendorUserLink[]> => {
      console.log("[useVendorUserLinks] Fetching vendor-user links...");
      
      const { data, error } = await supabase
        .from("vendor_user_links")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("[useVendorUserLinks] Error fetching links", error);
        throw new Error(error.message);
      }
      
      return data as VendorUserLink[] ?? [];
    },
  });

  const createMutation = useMutation({
    mutationKey: ["vendor_user_links:create"],
    mutationFn: async (payload: CreateVendorUserLinkPayload) => {
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
        .from("vendor_user_links")
        .insert(insertPayload)
        .select("*")
        .single();

      if (error) {
        console.error("[useVendorUserLinks] Error creating link", error);
        throw new Error(error.message);
      }
      
      return data as VendorUserLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor_user_links"] });
    },
  });

  const updateMutation = useMutation({
    mutationKey: ["vendor_user_links:update"],
    mutationFn: async (input: { id: string } & Partial<CreateVendorUserLinkPayload>) => {
      const { id, ...updateData } = input;
      
      const { data, error } = await supabase
        .from("vendor_user_links")
        .update(updateData)
        .eq("id", id)
        .select("*")
        .single();
      
      if (error) {
        console.error("[useVendorUserLinks] Error updating link", error);
        throw new Error(error.message);
      }
      
      return data as VendorUserLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor_user_links"] });
    },
  });

  const deleteMutation = useMutation({
    mutationKey: ["vendor_user_links:delete"],
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("vendor_user_links")
        .delete()
        .eq("id", id);
      
      if (error) {
        console.error("[useVendorUserLinks] Error deleting link", error);
        throw new Error(error.message);
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor_user_links"] });
    },
  });

  const getLinkByVendorCode = (vendorCode: string) => {
    return listQuery.data?.find(link => link.vendor_code === vendorCode);
  };

  return {
    listQuery,
    createMutation,
    updateMutation,
    deleteMutation,
    getLinkByVendorCode,
  };
}
