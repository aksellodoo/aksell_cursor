import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CustomFullscreenModal } from "@/components/ui/custom-fullscreen-modal";
import { X, Building2, Settings } from "lucide-react";
import { usePotentialSuppliers, type CreatePotentialSupplierPayload } from "@/hooks/usePotentialSuppliers";
import { supabase } from "@/integrations/supabase/client";
import { useMaterialTypes } from "@/hooks/useMaterialTypes";
import { useEmailTags, type EmailTag } from "@/hooks/useEmailTags";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

import { BuyerSelector } from "@/components/BuyerSelector";
import { CitySelector } from "@/components/CitySelector";
import { TagInput } from "@/components/TagInput";
import { TagsManager } from "@/components/TagsManager";
import { RepresentativeSelector } from "@/components/RepresentativeSelector";
import { PurchasesEconomicGroupSelector } from "@/components/PurchasesEconomicGroupSelector";

const sourceChannelOptions = [
  { value: "indicacao_referencia", label: "Indicação / Referência" },
  { value: "pesquisa_propria", label: "Pesquisa Própria" },
  { value: "abordagem_proativa", label: "Abordagem Proativa" },
  { value: "base_interna", label: "Base Interna" },
  { value: "outros", label: "Outros" }
];

const sourceSubchannelOptions = {
  indicacao_referencia: [
    { value: "indicacao_cliente", label: "Cliente" },
    { value: "indicacao_fornecedor_atual", label: "Fornecedor atual" },
    { value: "parceiro_consultor", label: "Parceiro / Consultor" },
    { value: "funcionario_interno", label: "Funcionário interno" },
    { value: "outro_contato", label: "Outro contato" }
  ],
  pesquisa_propria: [
    { value: "google_internet", label: "Google / Internet" },
    { value: "feira_evento", label: "Feira / Evento" },
    { value: "associacao_sindicato_entidade", label: "Associação / Sindicato / Entidade de Classe" },
    { value: "plataforma_b2b_marketplace", label: "Plataforma B2B / Marketplace (ex: Alibaba, Made-in-China, etc.)" },
    { value: "linkedin_rede_profissional", label: "LinkedIn / Rede social profissional" },
    { value: "visita_tecnica_viagem", label: "Visita técnica / Viagem" }
  ],
  abordagem_proativa: [
    { value: "contato_direto_fornecedor", label: "Contato direto do fornecedor (email, telefone, visita)" },
    { value: "prospeccao_comercial", label: "Prospecção comercial (cold call/email)" }
  ],
  base_interna: [
    { value: "banco_dados_historico", label: "Banco de dados histórico" },
    { value: "fornecedor_homologado_outra_unidade_grupo", label: "Fornecedor já homologado em outra unidade / grupo" },
    { value: "documentos_tecnicos_projetos_antigos", label: "Documentos técnicos / projetos antigos" }
  ],
  outros: [
    { value: "origem_nao_especificada", label: "Origem não especificada" },
    { value: "outro_especificar", label: "Outro (especificar)" }
  ]
};

// Schema creation function with conditional validation
const createFormSchema = (isEditing: boolean) => z.object({
  trade_name: z.string().min(1, "Nome fantasia é obrigatório"),
  legal_name: z.string().optional(),
  cnpj: z.string().optional(),
  website: z.string().optional().transform((val) => {
    if (!val || val.trim() === "") return undefined;
    const trimmed = val.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }).pipe(z.string().url("URL inválida").optional()),
  city_id: z.string().optional(),
  assigned_buyer_cod: z.string().optional(),
  assigned_buyer_filial: z.string().optional(),
  purchases_economic_group_id: isEditing 
    ? z.number().nullable().optional()
    : z.number({
        required_error: "Grupo econômico é obrigatório",
        invalid_type_error: "Selecione um grupo econômico válido"
      }).min(1, "Grupo econômico é obrigatório"),
  attendance_type: z.enum(['direct', 'representative']).default('direct'),
  representative_id: z.string().optional(),
  material_type_ids: z.array(z.string()).min(1, "Selecione pelo menos um tipo de material"),
  source_channel: z.enum(["indicacao_referencia", "pesquisa_propria", "abordagem_proativa", "base_interna", "outros"]).optional(),
  source_subchannel: z.string().optional(),
  source_detail: z.string().optional()
}).refine((data) => {
  // Source detail is required for "indicacao_referencia" channel
  if (data.source_channel === "indicacao_referencia") {
    return data.source_detail && data.source_detail.trim() !== "";
  }
  // Source detail is required for "outros" channel with "outro_especificar" subchannel
  if (data.source_channel === "outros" && data.source_subchannel === "outro_especificar") {
    return data.source_detail && data.source_detail.trim() !== "";
  }
  return true;
}, {
  message: "Campo de detalhe é obrigatório para esta origem",
  path: ["source_detail"]
}).refine((data) => {
  // Representative is required when attendance_type is 'representative'
  if (data.attendance_type === 'representative') {
    return data.representative_id && data.representative_id.trim() !== "";
  }
  return true;
}, {
  message: "Representante é obrigatório quando o tipo de atendimento é por representante",
  path: ["representative_id"]
});

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

interface PotentialSupplierCreateFullscreenProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId?: string | null;
  onCreated?: (payload: { groupId: number }) => void;
}

export function PotentialSupplierCreateFullscreen({ 
  isOpen, 
  onClose, 
  supplierId,
  onCreated
}: PotentialSupplierCreateFullscreenProps) {
  const [selectedMaterialTypeIds, setSelectedMaterialTypeIds] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<EmailTag[]>([]);
  const [showTagsManager, setShowTagsManager] = useState(false);
  const { createMutation, updateMutation, getByIdQuery, getSupplierTagsQuery } = usePotentialSuppliers();
  const { materialTypes } = useMaterialTypes();
  const isEditing = Boolean(supplierId);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<FormData>({
    resolver: zodResolver(createFormSchema(isEditing)),
    defaultValues: {
      trade_name: "",
      legal_name: "",
      cnpj: "",
      website: "",
      city_id: "",
      assigned_buyer_cod: "",
      assigned_buyer_filial: "",
      purchases_economic_group_id: null,
      attendance_type: 'direct' as const,
      representative_id: "",
      material_type_ids: [],
      source_channel: undefined,
      source_subchannel: "",
      source_detail: ""
    }
  });

  const selectedSourceChannel = form.watch("source_channel");
  const selectedSourceSubchannel = form.watch("source_subchannel");
  const attendanceType = form.watch("attendance_type");

  // Load supplier data for editing
  const supplierQuery = getByIdQuery(supplierId || "");
  const supplierTagsQuery = getSupplierTagsQuery(supplierId || "");
  
  useEffect(() => {
    if (isEditing && supplierQuery.data) {
      const supplier = supplierQuery.data;
      form.reset({
        trade_name: supplier.trade_name,
        legal_name: supplier.legal_name || "",
        cnpj: supplier.cnpj || "",
        website: supplier.website || "",
        city_id: supplier.city_id || "",
        assigned_buyer_cod: supplier.assigned_buyer_cod || "",
        assigned_buyer_filial: supplier.assigned_buyer_filial || "",
        purchases_economic_group_id: null, // Will be loaded separately
        attendance_type: supplier.attendance_type || 'direct',
        representative_id: supplier.representative_id || "",
        material_type_ids: supplier.material_types?.map(mt => mt.id) || [],
        source_channel: supplier.source_channel,
        source_subchannel: supplier.source_subchannel || "",
        source_detail: supplier.source_detail || ""
      });
      setSelectedMaterialTypeIds(supplier.material_types?.map(mt => mt.id) || []);
    }
  }, [isEditing, supplierQuery.data, form]);

  // Load supplier tags for editing
  useEffect(() => {
    if (isEditing && supplierTagsQuery.data) {
      setSelectedTags(supplierTagsQuery.data);
    }
  }, [isEditing, supplierTagsQuery.data]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setSelectedMaterialTypeIds([]);
      setSelectedTags([]);
    }
  }, [isOpen, form]);

  // Clear subchannel when channel changes
  useEffect(() => {
    if (selectedSourceChannel) {
      form.setValue("source_subchannel", "");
    }
  }, [selectedSourceChannel, form]);

  const handleMaterialTypeChange = (materialTypeId: string, checked: boolean) => {
    let newIds: string[];
    if (checked) {
      newIds = [...selectedMaterialTypeIds, materialTypeId];
    } else {
      newIds = selectedMaterialTypeIds.filter(id => id !== materialTypeId);
    }
    setSelectedMaterialTypeIds(newIds);
    form.setValue("material_type_ids", newIds);
  };

  const onSubmit = async (data: FormData) => {
    // Validate economic group for new suppliers
    if (!isEditing && !data.purchases_economic_group_id) {
      form.setError("purchases_economic_group_id", {
        type: "required",
        message: "Grupo econômico é obrigatório"
      });
      // Find and focus the economic group field
      const economicGroupField = document.querySelector('[data-field="purchases_economic_group_id"]');
      if (economicGroupField) {
        economicGroupField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      const payload: CreatePotentialSupplierPayload = {
        trade_name: data.trade_name,
        legal_name: data.legal_name || undefined,
        cnpj: data.cnpj || undefined,
        website: data.website || undefined,
        city_id: data.city_id || undefined,
        assigned_buyer_cod: data.assigned_buyer_cod || undefined,
        assigned_buyer_filial: data.assigned_buyer_filial || undefined,
        attendance_type: data.attendance_type,
        representative_id: data.attendance_type === 'representative' ? data.representative_id : undefined,
        material_type_ids: selectedMaterialTypeIds,
        source_channel: data.source_channel || undefined,
        source_subchannel: data.source_subchannel || undefined,
        source_detail: data.source_detail || undefined,
        tag_ids: selectedTags.map(tag => tag.id)
      };

      let supplierId_actual = supplierId;
      
      if (supplierId) {
        await updateMutation.mutateAsync({ id: supplierId, data: payload });
      } else {
        const newSupplier = await createMutation.mutateAsync(payload);
        supplierId_actual = newSupplier.id;
      }
      
      // If economic group was selected, ensure unified supplier and assign to group
      if (data.purchases_economic_group_id && supplierId_actual) {
        try {
          const { data: result, error } = await supabase.rpc('ensure_unified_supplier_and_assign_group', {
            p_potential_id: supplierId_actual,
            p_group_id: data.purchases_economic_group_id
          });
          
          if (error) {
            console.error("Error assigning to economic group:", error);
            // Don't throw here to avoid failing the whole operation
          }
          
          // Call onCreated callback if provided (for contact linking flow)
          if (onCreated && !isEditing) {
            onCreated({ groupId: data.purchases_economic_group_id });
            return; // Don't close modal, let the parent handle it
          }
        } catch (error) {
          console.error("Error in economic group assignment:", error);
          // Don't throw here to avoid failing the whole operation
        }
      }
      
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  // Options do tipos de material (now from material types table)
  const materialTypeOptions = materialTypes?.map(mt => ({
    value: mt.id,
    label: mt.name,
    color: mt.color
  })) || [];

  const requiresSourceDetail = 
    selectedSourceChannel === "indicacao_referencia" ||
    (selectedSourceChannel === "outros" && selectedSourceSubchannel === "outro_especificar");

  const handleViewLinkedGroup = async () => {
    if (!supplierId) {
      toast({ title: "Erro", description: "ID do fornecedor não encontrado.", variant: "destructive" });
      return;
    }

    try {
      // Buscar o fornecedor unificado a partir do potencial
      const { data: unified, error: uErr } = await supabase
        .from('purchases_unified_suppliers')
        .select('id')
        .eq('potential_supplier_id', supplierId)
        .maybeSingle();

      if (uErr) throw uErr;
      if (!unified) {
        toast({ title: 'Aviso', description: 'Fornecedor unificado não encontrado.', variant: 'destructive' });
        return;
      }

      // Buscar a associação de grupo
      const { data: membership, error: mErr } = await supabase
        .from('purchases_economic_group_members')
        .select('group_id')
        .eq('unified_supplier_id', unified.id)
        .maybeSingle();

      if (mErr) throw mErr;
      if (!membership?.group_id) {
        toast({ title: 'Aviso', description: 'Este fornecedor não está vinculado a nenhum grupo econômico.', variant: 'destructive' });
        return;
      }

      // Salvar no sessionStorage e navegar
      sessionStorage.setItem('reopenGroupModal', membership.group_id.toString());
      onClose();
      navigate('/compras/grupos-economicos');
    } catch (err) {
      console.error('Erro ao abrir grupo vinculado:', err);
      toast({ title: 'Erro', description: 'Não foi possível abrir o grupo econômico vinculado.', variant: 'destructive' });
    }
  };

  return (
    <CustomFullscreenModal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-card">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">
                {isEditing ? "Editar Potencial Fornecedor" : "Novo Potencial Fornecedor"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isEditing ? "Edite as informações do fornecedor" : "Cadastre um novo potencial fornecedor"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Canal de Origem */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Canal de Origem</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="source_channel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Canal Principal</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o canal" />
                            </SelectTrigger>
                            <SelectContent>
                              {sourceChannelOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedSourceChannel && (
                    <FormField
                      control={form.control}
                      name="source_subchannel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subcanal</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o subcanal" />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedSourceChannel && sourceSubchannelOptions[selectedSourceChannel]?.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {requiresSourceDetail && (
                    <FormField
                      control={form.control}
                      name="source_detail"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Detalhe da Origem</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Especifique a origem..." 
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="trade_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Fantasia *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome fantasia do fornecedor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="legal_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razão Social</FormLabel>
                      <FormControl>
                        <Input placeholder="Razão social do fornecedor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000/0000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="exemplo.com.br ou https://exemplo.com.br" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <CitySelector 
                          value={field.value}
                          onValueChange={(cityId) => field.onChange(cityId || "")}
                          placeholder="Selecione uma cidade..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <BuyerSelector
                  codeName="assigned_buyer_cod"
                  filialName="assigned_buyer_filial"
                />
              </div>

              {/* Grupo Econômico */}
              <div className="space-y-4" data-field="purchases_economic_group_id">
                {!isEditing ? (
                  <FormField
                    control={form.control}
                    name="purchases_economic_group_id"
                    render={({ field }) => (
                      <FormItem>
                        <PurchasesEconomicGroupSelector
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Clear any existing error when a value is selected
                            if (value && form.formState.errors.purchases_economic_group_id) {
                              form.clearErrors("purchases_economic_group_id");
                            }
                          }}
                          label="Grupo Econômico (Compras) *"
                          placeholder="Selecione um grupo econômico..."
                          helperText="Grupo econômico é obrigatório para novos fornecedores"
                          showCreateButton={true}
                          required={true}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Grupo Econômico</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleViewLinkedGroup}
                      className="w-full justify-start"
                    >
                      Ver grupo econômico vinculado
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Clique para visualizar o grupo econômico vinculado a este fornecedor
                    </p>
                  </div>
                )}
              </div>

              {/* Tipo de Atendimento */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tipo de Atendimento</h3>
                
                <FormField
                  control={form.control}
                  name="attendance_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Como será o atendimento</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value} 
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Clear representative when switching to direct
                            if (value === 'direct') {
                              form.setValue('representative_id', '');
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="direct">Direto</SelectItem>
                            <SelectItem value="representative">Por Representante</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {attendanceType === 'representative' && (
                  <FormField
                    control={form.control}
                    name="representative_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Representante Comercial *</FormLabel>
                        <FormControl>
                          <RepresentativeSelector
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Selecione um representante"
                            context="purchases"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Material Types */}
              <div className="space-y-3">
                <FormLabel>Tipo de Material Fornecido *</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {materialTypeOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.value}
                        checked={selectedMaterialTypeIds.includes(option.value)}
                        onCheckedChange={(checked) => 
                          handleMaterialTypeChange(option.value, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={option.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: option.color }}
                        />
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
                {form.formState.errors.material_type_ids && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.material_type_ids.message}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel>Tags</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTagsManager(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Gerenciar Tags
                  </Button>
                </div>
                <TagInput
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending 
                    ? "Salvando..." 
                    : isEditing 
                    ? "Atualizar" 
                    : "Criar Fornecedor"
                  }
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Tags Manager Modal */}
      <TagsManager
        isOpen={showTagsManager}
        onClose={() => setShowTagsManager(false)}
      />
    </CustomFullscreenModal>
  );
}