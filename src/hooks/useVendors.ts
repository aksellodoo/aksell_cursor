
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Vendor {
  a3_cod: string;
  a3_filial: string;
  a3_nome: string;
  a3_nreduz?: string;
  a3_email?: string;
}

export interface VendorWithUser {
  vendor: Vendor;
  linked_user_id?: string;
}

export function useVendors() {
  const listQuery = useQuery({
    queryKey: ["vendors"],
    queryFn: async (): Promise<VendorWithUser[]> => {
      console.log("[useVendors] Fetching vendors...");
      
      // Buscar vendedores da tabela SA3010
      const { data: vendorsData, error: vendorsError } = await supabase
        .from("protheus_sa3010_fc3d70f6")
        .select("a3_cod, a3_filial, a3_nome, a3_nreduz, a3_email")
        .order("a3_nome");
      
      if (vendorsError) {
        console.error("[useVendors] Error fetching vendors:", vendorsError);
        throw new Error(vendorsError.message);
      }

      // Buscar vínculos de vendedor com usuário
      const { data: linksData, error: linksError } = await supabase
        .from("vendor_user_links")
        .select("vendor_code, user_id");
      
      if (linksError) {
        console.error("[useVendors] Error fetching vendor links:", linksError);
        // Não falhar se não conseguir buscar os vínculos
      }

      // Combinar dados
      const vendorsWithLinks: VendorWithUser[] = (vendorsData || []).map(vendor => {
        const link = linksData?.find(link => link.vendor_code === vendor.a3_cod);
        return {
          vendor: vendor as Vendor,
          linked_user_id: link?.user_id
        };
      });

      return vendorsWithLinks;
    },
  });

  const getSuggestedVendorForUser = (userId: string) => {
    return listQuery.data?.find(vendorWithUser => 
      vendorWithUser.linked_user_id === userId
    )?.vendor;
  };

  return {
    listQuery,
    getSuggestedVendorForUser,
  };
}
