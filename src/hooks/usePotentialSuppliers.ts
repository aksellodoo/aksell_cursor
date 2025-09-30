import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type SupplierSourceChannel = "indicacao_referencia" | "pesquisa_propria" | "abordagem_proativa" | "base_interna" | "outros";
export type SupplierSourceSubchannel = string;

export interface PotentialSupplier {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  pf_number?: number;
  pf_code?: string;
  trade_name: string;
  legal_name?: string;
  cnpj?: string;
  website?: string;
  city_id?: string;
  assigned_buyer_cod?: string;
  assigned_buyer_filial?: string;
  attendance_type?: 'direct' | 'representative';
  representative_id?: string;
  material_types?: { id: string; name: string; color: string }[];
  source_channel?: SupplierSourceChannel;
  source_subchannel?: SupplierSourceSubchannel;
  source_detail?: string;
}

export interface CreatePotentialSupplierPayload {
  trade_name: string;
  legal_name?: string;
  cnpj?: string;
  website?: string;
  city_id?: string;
  assigned_buyer_cod?: string;
  assigned_buyer_filial?: string;
  attendance_type?: 'direct' | 'representative';
  representative_id?: string;
  material_type_ids: string[];
  source_channel?: SupplierSourceChannel;
  source_subchannel?: SupplierSourceSubchannel;
  source_detail?: string;
  tag_ids?: string[];
}

export function usePotentialSuppliers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Lista de potenciais fornecedores
  const listQuery = useQuery({
    queryKey: ["potential-suppliers"],
    queryFn: async (): Promise<PotentialSupplier[]> => {
      console.log("[usePotentialSuppliers] Fetching potential suppliers...");
      
      const { data, error } = await supabase
        .from("purchases_potential_suppliers")
        .select(`
          *,
          purchases_potential_supplier_material_types(
            material_type_id,
            purchases_material_types(
              id,
              name,
              color
            )
          )
        `)
        .order("trade_name");
      
      if (error) {
        console.error("[usePotentialSuppliers] Error fetching potential suppliers:", error);
        throw new Error(error.message);
      }

      return data?.map(supplier => ({
        ...supplier,
        attendance_type: supplier.attendance_type as 'direct' | 'representative',
        // Override the old material_types enum with new relational data
        material_types: supplier.purchases_potential_supplier_material_types?.map(mt => ({
          id: mt.purchases_material_types.id,
          name: mt.purchases_material_types.name,
          color: mt.purchases_material_types.color
        })) || []
      })) || [];
    },
  });

  // Criar potencial fornecedor
  const createMutation = useMutation({
    mutationFn: async (data: CreatePotentialSupplierPayload): Promise<PotentialSupplier> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { tag_ids, material_type_ids, ...supplierData } = data;

      // If attendance_type is direct, clear representative_id
      const finalSupplierData = {
        ...supplierData,
        representative_id: supplierData.attendance_type === 'direct' ? null : supplierData.representative_id,
        created_by: user.id
      };
      
      const { data: supplier, error } = await supabase
        .from("purchases_potential_suppliers")
        .insert(finalSupplierData as any)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Inserir vínculos de tipos de materiais
      if (material_type_ids && material_type_ids.length > 0) {
        const materialTypeLinks = material_type_ids.map(materialTypeId => ({
          supplier_id: supplier.id,
          material_type_id: materialTypeId,
          created_by: user.id
        }));

        const { error: materialTypesError } = await supabase
          .from("purchases_potential_supplier_material_types")
          .insert(materialTypeLinks);

        if (materialTypesError) throw new Error(materialTypesError.message);
      }

      // Inserir vínculos de tags se fornecidas
      if (tag_ids && tag_ids.length > 0) {
        const tagLinks = tag_ids.map(tagId => ({
          supplier_id: supplier.id,
          tag_id: tagId,
          created_by: user.id
        }));

        const { error: tagsError } = await supabase
          .from("purchases_potential_supplier_tags")
          .insert(tagLinks);

        if (tagsError) throw new Error(tagsError.message);
      }

      return supplier as unknown as PotentialSupplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["potential-suppliers"] });
      toast({
        title: "Sucesso",
        description: "Potencial fornecedor criado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Atualizar potencial fornecedor
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreatePotentialSupplierPayload> }): Promise<PotentialSupplier> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { tag_ids, material_type_ids, ...supplierData } = data;

      // If attendance_type is direct, clear representative_id
      const finalSupplierData = {
        ...supplierData,
        representative_id: supplierData.attendance_type === 'direct' ? null : supplierData.representative_id
      };

      const { data: supplier, error } = await supabase
        .from("purchases_potential_suppliers")
        .update(finalSupplierData as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Atualizar vínculos de tipos de materiais se fornecidos
      if (material_type_ids !== undefined) {
        // Remover vínculos existentes
        await supabase
          .from("purchases_potential_supplier_material_types")
          .delete()
          .eq("supplier_id", id);

        // Inserir novos vínculos se houver tipos
        if (material_type_ids.length > 0) {
          const materialTypeLinks = material_type_ids.map(materialTypeId => ({
            supplier_id: id,
            material_type_id: materialTypeId,
            created_by: user.id
          }));

          const { error: materialTypesError } = await supabase
            .from("purchases_potential_supplier_material_types")
            .insert(materialTypeLinks);

          if (materialTypesError) throw new Error(materialTypesError.message);
        }
      }

      // Atualizar vínculos de tags se fornecidas
      if (tag_ids !== undefined) {
        // Remover vínculos existentes
        await supabase
          .from("purchases_potential_supplier_tags")
          .delete()
          .eq("supplier_id", id);

        // Inserir novos vínculos se houver tags
        if (tag_ids.length > 0) {
          const tagLinks = tag_ids.map(tagId => ({
            supplier_id: id,
            tag_id: tagId,
            created_by: user.id
          }));

          const { error: tagsError } = await supabase
            .from("purchases_potential_supplier_tags")
            .insert(tagLinks);

          if (tagsError) throw new Error(tagsError.message);
        }
      }

      return supplier as unknown as PotentialSupplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["potential-suppliers"] });
      toast({
        title: "Sucesso",
        description: "Potencial fornecedor atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Deletar potencial fornecedor
  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from("purchases_potential_suppliers")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["potential-suppliers"] });
      toast({
        title: "Sucesso",
        description: "Potencial fornecedor removido com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Buscar por ID
  const getByIdQuery = (id: string) => useQuery({
    queryKey: ["potential-supplier", id],
    queryFn: async (): Promise<PotentialSupplier> => {
      const { data, error } = await supabase
        .from("purchases_potential_suppliers")
        .select(`
          *,
          purchases_potential_supplier_material_types(
            material_type_id,
            purchases_material_types(
              id,
              name,
              color
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw new Error(error.message);
      
      return {
        ...data,
        attendance_type: data.attendance_type as 'direct' | 'representative',
        // Override the old material_types enum with new relational data
        material_types: data.purchases_potential_supplier_material_types?.map(mt => ({
          id: mt.purchases_material_types.id,
          name: mt.purchases_material_types.name,
          color: mt.purchases_material_types.color
        })) || []
      };
    },
    enabled: !!id,
  });

  // Buscar tags de um fornecedor
  const getSupplierTagsQuery = (supplierId: string) => useQuery({
    queryKey: ["potential-supplier-tags", supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases_potential_supplier_tags")
        .select(`
          tag_id,
          email_tags!inner(id, name)
        `)
        .eq("supplier_id", supplierId);

      if (error) throw new Error(error.message);
      
      return data?.map(item => ({
        id: item.email_tags.id,
        name: item.email_tags.name
      })) || [];
    },
    enabled: !!supplierId,
  });

  return {
    listQuery,
    createMutation,
    updateMutation,
    deleteMutation,
    getByIdQuery,
    getSupplierTagsQuery,
  };
}