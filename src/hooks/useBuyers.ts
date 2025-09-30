import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Buyer {
  y1_cod: string;
  y1_filial: string;
  y1_nome: string;
  y1_email?: string;
}

export interface BuyerWithUser {
  buyer: Buyer;
  linked_user_id?: string;
}

export function useBuyers() {
  const listQuery = useQuery({
    queryKey: ["buyers"],
    queryFn: async (): Promise<BuyerWithUser[]> => {
      console.log("[useBuyers] Fetching buyers...");
      
      // Buscar compradores da tabela SY1010
      const { data: buyersData, error: buyersError } = await supabase
        .from("protheus_sy1010_3249e97a")
        .select("y1_cod, y1_filial, y1_nome, y1_email")
        .order("y1_nome");
      
      if (buyersError) {
        console.error("[useBuyers] Error fetching buyers:", buyersError);
        throw new Error(buyersError.message);
      }

      // Buscar vínculos de comprador com usuário
      const { data: linksData, error: linksError } = await supabase
        .from("buyer_user_links")
        .select("buyer_code, user_id");
      
      if (linksError) {
        console.error("[useBuyers] Error fetching buyer links:", linksError);
        // Não falhar se não conseguir buscar os vínculos
      }

      // Combinar dados
      const buyersWithLinks: BuyerWithUser[] = (buyersData || []).map(buyer => {
        const link = linksData?.find(link => link.buyer_code === buyer.y1_cod);
        return {
          buyer: buyer as Buyer,
          linked_user_id: link?.user_id
        };
      });

      return buyersWithLinks;
    },
  });

  const getSuggestedBuyerForUser = (userId: string) => {
    return listQuery.data?.find(buyerWithUser => 
      buyerWithUser.linked_user_id === userId
    )?.buyer;
  };

  return {
    listQuery,
    getSuggestedBuyerForUser,
  };
}