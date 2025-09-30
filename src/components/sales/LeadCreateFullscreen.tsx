import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FullscreenDialogContent } from "@/components/ui/fullscreen-dialog";
import { QuickSegmentSelector } from "@/components/QuickSegmentSelector";
import { CityCombobox } from "@/components/CityCombobox";
import { EconomicGroupSelector } from "@/components/EconomicGroupSelector";
import { useLeads, Lead } from "@/hooks/useLeads";
import { VendorSelector } from "@/components/VendorSelector";
import { RepresentativeSelector } from "@/components/RepresentativeSelector";
import { ArrowLeft, Save, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TagInput } from "@/components/TagInput";
import { useEmailTags, EmailTag } from "@/hooks/useEmailTags";

interface Segment {
  id: string;
  name: string;
}

interface LeadCreateFullscreenProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
  leadData?: Lead | null;
  onCreated?: (payload: { leadId: string; economicGroupId: number }) => void;
}

export const LeadCreateFullscreen = ({ open, onOpenChange, onSave, leadData, onCreated }: LeadCreateFullscreenProps) => {
  const { createLead, updateLead } = useLeads();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    trade_name: "",
    legal_name: "",
    cnpj: "",
    website: "",
    source_channel: "",
    source_subchannel: "",
    referral_name: "",
    city_id: "",
    observations: "",
    attendance_type: "direct" as "direct" | "representative",
  });
  const [selectedSegments, setSelectedSegments] = useState<Segment[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>();
  const [selectedVendor, setSelectedVendor] = useState<{ cod: string; filial: string } | null>(null);
  const [selectedTags, setSelectedTags] = useState<EmailTag[]>([]);
  const [selectedRepresentative, setSelectedRepresentative] = useState<string | undefined>();
  const [isDirty, setIsDirty] = useState(false);
  const isEditing = !!leadData;

  // Load lead data for editing
  useEffect(() => {
    if (leadData && open) {
      const loadLeadData = async () => {
        setFormData({
          trade_name: leadData.trade_name || "",
          legal_name: leadData.legal_name || "",
          cnpj: leadData.cnpj || "",
          website: leadData.website || "",
          source_channel: leadData.source_channel || "",
          source_subchannel: leadData.source_subchannel || "",
          referral_name: leadData.referral_name || "",
          city_id: leadData.city_id || "",
          observations: "",
          attendance_type: (leadData.attendance_type as "direct" | "representative") || "direct",
        });
        setSelectedSegments(leadData.segments || []);
        setSelectedVendor(
          leadData.assigned_vendor_cod && leadData.assigned_vendor_filial
            ? { cod: leadData.assigned_vendor_cod, filial: leadData.assigned_vendor_filial }
            : null
        );
        setSelectedRepresentative(leadData.representative_id || undefined);
        
        // Load tags
        if (leadData.tags) {
          setSelectedTags(leadData.tags);
        }
        
        // Check economic group from sales_leads first, then fallback to unified_accounts
        let economicGroupId = leadData.economic_group_id;
        
        if (!economicGroupId && leadData.id) {
          console.log('LeadCreateFullscreen - checking unified_accounts for economic_group_id:', leadData.id);
          try {
            const { data: unifiedAccount } = await supabase
              .from('unified_accounts')
              .select('economic_group_id')
              .eq('lead_id', leadData.id)
              .single();
            
            if (unifiedAccount?.economic_group_id) {
              economicGroupId = unifiedAccount.economic_group_id;
              console.log('LeadCreateFullscreen - found economic_group_id in unified_accounts:', economicGroupId);
            }
          } catch (error) {
            console.log('LeadCreateFullscreen - no unified_account found for lead:', leadData.id);
          }
        }
        
        console.log('LeadCreateFullscreen - setting economic group:', economicGroupId);
        setSelectedGroupId(economicGroupId || undefined);
        setIsDirty(false);
      };
      
      loadLeadData();
    } else if (!leadData && open) {
      resetForm();
    }
  }, [leadData, open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleClose = () => {
    if (isDirty) {
      if (confirm("Existem alterações não salvas. Deseja realmente sair?")) {
        resetForm();
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setFormData({
      trade_name: "",
      legal_name: "",
      cnpj: "",
      website: "",
      source_channel: "",
      source_subchannel: "",
      referral_name: "",
      city_id: "",
      observations: "",
      attendance_type: "direct",
    });
    setSelectedSegments([]);
    setSelectedGroupId(undefined);
    setSelectedVendor(null);
    setSelectedRepresentative(undefined);
    setSelectedTags([]);
    setIsDirty(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.trade_name.trim()) {
      toast.error("Nome fantasia é obrigatório");
      return;
    }
    if (!isEditing && !selectedGroupId) {
      toast.error("Selecione um grupo econômico");
      return;
    }
    if (selectedSegments.length === 0) {
      toast.error("Selecione pelo menos um segmento");
      return;
    }
    if (!selectedVendor) {
      toast.error("Selecione um vendedor");
      return;
    }
    if (formData.attendance_type === "representative" && !selectedRepresentative) {
      toast.error("Selecione um representante comercial");
      return;
    }

    const isCurrentlyCreating = !isEditing;
    setLoading(true);
    if (isCurrentlyCreating) setCreating(true);
    
    try {
      if (isEditing && leadData) {
        await updateLead(leadData.id, {
          trade_name: formData.trade_name,
          legal_name: formData.legal_name || undefined,
          cnpj: formData.cnpj || undefined,
          website: formData.website || undefined,
          source_channel: (formData.source_channel as any) || 'other',
          source_subchannel: formData.source_subchannel || undefined,
          referral_name: formData.referral_name || undefined,
          city_id: formData.city_id || undefined,
          segment_ids: selectedSegments.map(s => s.id),
          tag_ids: selectedTags.map(tag => tag.id),
          economic_group_id: selectedGroupId,
          assigned_vendor_cod: selectedVendor.cod,
          assigned_vendor_filial: selectedVendor.filial,
          attendance_type: formData.attendance_type,
          representative_id: formData.attendance_type === "representative" ? selectedRepresentative : undefined,
        });
        toast.success("Lead atualizado com sucesso!");
      } else {
        // 1. Create the lead
        const newLead = await createLead({
          trade_name: formData.trade_name,
          legal_name: formData.legal_name || undefined,
          cnpj: formData.cnpj || undefined,
          website: formData.website || undefined,
          source_channel: (formData.source_channel as any) || 'other',
          source_subchannel: formData.source_subchannel || undefined,
          referral_name: formData.referral_name || undefined,
          city_id: formData.city_id || undefined,
          segment_ids: selectedSegments.map(s => s.id),
          attendance_type: formData.attendance_type,
          tag_ids: selectedTags.map(tag => tag.id),
          economic_group_id: selectedGroupId,
          assigned_vendor_cod: selectedVendor.cod,
          assigned_vendor_filial: selectedVendor.filial,
          representative_id: formData.attendance_type === "representative" ? selectedRepresentative : undefined,
        });

        if (!newLead) {
          toast.error("Falha ao criar lead");
          return;
        }

        // 2. Create unified account
        const { error: rpcError } = await supabase.rpc('create_missing_unified_accounts');
        if (rpcError) {
          console.error('Error creating unified accounts:', rpcError);
          toast.error("Erro ao criar cliente unificado");
          return;
        }

        // 3. Find and update the unified account
        let unifiedAccount = null;
        let retries = 3;
        
        while (retries > 0 && !unifiedAccount) {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { data: unified } = await supabase
            .from('unified_accounts')
            .select('*')
            .eq('lead_id', newLead.id)
            .single();
            
          if (unified) {
            unifiedAccount = unified;
            break;
          }
          retries--;
        }

        if (!unifiedAccount) {
          toast.error("Erro ao encontrar cliente unificado criado");
          return;
        }

        // 4. Update service_type and representative_id
        const { error: updateError } = await supabase
          .from('unified_accounts')
          .update({
            service_type: formData.attendance_type,
            representative_id: formData.attendance_type === "representative" ? selectedRepresentative : null
          })
          .eq('id', unifiedAccount.id);

        if (updateError) {
          console.error('Error updating unified account:', updateError);
        }

        // 5. Update segments
        await supabase
          .from('unified_account_segments_map')
          .delete()
          .eq('account_id', unifiedAccount.id);

        if (selectedSegments.length > 0) {
          const segmentMappings = selectedSegments.map(segment => ({
            account_id: unifiedAccount.id,
            segment_id: segment.id,
            created_by: newLead.created_by || null
          }));

          const { error: segmentError } = await supabase
            .from('unified_account_segments_map')
            .insert(segmentMappings);

          if (segmentError) {
            console.error('Error adding segments:', segmentError);
          }
        }

        // 6. Link to economic group
        if (selectedGroupId && unifiedAccount.id) {
          const { error: groupError } = await supabase.rpc('add_unified_to_group', {
            p_id_grupo: selectedGroupId,
            p_unified_id: unifiedAccount.id
          });

          if (groupError) {
            console.error('Error linking to group:', groupError);
            toast.error("Erro ao vincular ao grupo econômico");
          }
        }

        // Call onCreated callback if provided and creating new lead
        if (onCreated && !isEditing && selectedGroupId) {
          onCreated({ leadId: newLead.id, economicGroupId: selectedGroupId });
        }
      }

      resetForm();
      onSave?.();
      setTimeout(() => onOpenChange(false), 0);
    } catch (error) {
      console.error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} lead:`, error);
      toast.error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} lead. Tente novamente.`);
    } finally {
      setLoading(false);
      setCreating(false);
    }
  };

  const getSourceChannelLabel = (channel: string) => {
    const labels: Record<string, string> = {
      referral: "Indicação / Referral",
      website: "Site oficial",
      social: "Redes sociais",
      organic_search: "Google / Pesquisa orgânica",
      paid_search: "Google Ads / Links patrocinados", 
      event: "Eventos / Feiras / Palestras",
      outbound: "Contato ativo da equipe",
      marketplace: "Marketplace / Plataforma parceira",
      other: "Outro"
    };
    return labels[channel] || channel;
  };

  const getSubchannelOptions = (channel: string) => {
    const options: Record<string, string[]> = {
      referral: ["Cliente atual", "Parceiro", "Funcionário", "Amigo"],
      website: ["Formulário de contato", "Chat do site", "WhatsApp", "Download de material"],
      social: ["Instagram", "Facebook", "LinkedIn", "TikTok", "YouTube"],
      organic_search: ["Google", "Bing", "Outros buscadores"],
      paid_search: ["Google Ads", "Facebook Ads", "LinkedIn Ads", "Instagram Ads"],
      event: ["Feira de negócios", "Palestra", "Workshop", "Networking"],
      outbound: ["Cold call", "Cold email", "LinkedIn", "WhatsApp"],
      marketplace: ["Mercado Livre", "Amazon", "B2B Hub", "Outros"]
    };
    return options[channel] || [];
  };

  const handleViewEconomicGroup = async () => {
    let groupIdToNavigate = selectedGroupId;
    
    // If no group ID is currently loaded, try to fetch from unified_accounts as fallback
    if (!groupIdToNavigate && leadData?.id) {
      try {
        const { data: unifiedAccount } = await supabase
          .from('unified_accounts')
          .select('economic_group_id')
          .eq('lead_id', leadData.id)
          .single();
        
        if (unifiedAccount?.economic_group_id) {
          groupIdToNavigate = unifiedAccount.economic_group_id;
        }
      } catch (error) {
        console.log('No unified account found for lead:', leadData.id);
      }
    }
    
    if (groupIdToNavigate) {
      navigate(`/vendas/cadastros/grupos/${groupIdToNavigate}/gerenciar`);
    } else {
      toast.error("Este lead não está vinculado a nenhum grupo econômico");
    }
  };

  return (
    <FullscreenDialogContent
      open={open}
      onOpenChange={onOpenChange}
      persistent={true}
      className="flex flex-col"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <h1 className="text-2xl font-semibold">{isEditing ? 'Editar Lead' : 'Criar Novo Lead'}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-6">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
            {/* Tipo de Atendimento */}
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Atendimento</Label>
                  <Select
                    value={formData.attendance_type}
                    onValueChange={(value: "direct" | "representative") => {
                      handleInputChange("attendance_type", value);
                      if (value === "direct") {
                        setSelectedRepresentative(undefined);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                      <SelectItem value="direct">Direto</SelectItem>
                      <SelectItem value="representative">Por Representante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.attendance_type === "representative" && (
                  <RepresentativeSelector
                    value={selectedRepresentative}
                    onValueChange={(value) => {
                      setSelectedRepresentative(value);
                      setIsDirty(true);
                    }}
                    label=""
                    placeholder="Selecione um representante comercial..."
                    required
                  />
                )}
              </div>
            </div>

            {/* Origem do Lead */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source_channel">Canal de Origem *</Label>
                  <Select
                    value={formData.source_channel}
                    onValueChange={(value) => {
                      handleInputChange("source_channel", value);
                      handleInputChange("source_subchannel", "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o canal" />
                    </SelectTrigger>
                    <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                      <SelectItem value="referral">Indicação / Referral</SelectItem>
                      <SelectItem value="website">Site oficial</SelectItem>
                      <SelectItem value="social">Redes sociais</SelectItem>
                      <SelectItem value="organic_search">Google / Pesquisa orgânica</SelectItem>
                      <SelectItem value="paid_search">Google Ads / Links patrocinados</SelectItem>
                      <SelectItem value="event">Eventos / Feiras / Palestras</SelectItem>
                      <SelectItem value="outbound">Contato ativo da equipe</SelectItem>
                      <SelectItem value="marketplace">Marketplace / Plataforma parceira</SelectItem>
                      <SelectItem value="other">Outro (especificar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.source_channel && formData.source_channel !== 'other' && (
                  <div className="space-y-2">
                    <Label htmlFor="source_subchannel">Detalhamento</Label>
                    <Select
                      value={formData.source_subchannel}
                      onValueChange={(value) => handleInputChange("source_subchannel", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o detalhamento" />
                      </SelectTrigger>
                      <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                        {getSubchannelOptions(formData.source_channel).map((option) => (
                          <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, '_')}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.source_channel === 'other' && (
                  <div className="space-y-2">
                    <Label htmlFor="source_subchannel">Especificar Canal</Label>
                    <Input
                      id="source_subchannel"
                      value={formData.source_subchannel}
                      onChange={(e) => handleInputChange("source_subchannel", e.target.value)}
                      placeholder="Digite o canal de origem"
                    />
                  </div>
                )}
              </div>
              
              {formData.source_channel === 'referral' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="referral_name">Nome do Indicador</Label>
                    <Input
                      id="referral_name"
                      value={formData.referral_name}
                      onChange={(e) => handleInputChange("referral_name", e.target.value)}
                      placeholder="Digite o nome de quem indicou"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Dados da Empresa */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-foreground border-b pb-2">
                Dados da Empresa
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trade_name">Nome Fantasia *</Label>
                  <Input
                    id="trade_name"
                    value={formData.trade_name}
                    onChange={(e) => handleInputChange("trade_name", e.target.value)}
                    placeholder="Digite o nome fantasia"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legal_name">Razão Social</Label>
                  <Input
                    id="legal_name"
                    value={formData.legal_name}
                    onChange={(e) => handleInputChange("legal_name", e.target.value)}
                    placeholder="Digite a razão social"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => handleInputChange("cnpj", e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="https://exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <CityCombobox
                    value={formData.city_id}
                    onValueChange={(value) => handleInputChange("city_id", value)}
                    placeholder="Selecione uma cidade..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <TagInput
                    selectedTags={selectedTags}
                    onTagsChange={(tags) => {
                      setSelectedTags(tags);
                      setIsDirty(true);
                    }}
                    placeholder="Digite uma tag e pressione Enter..."
                  />
                </div>
              </div>
            </div>

            {/* Grupo Econômico */}
            <div className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-medium text-foreground border-b pb-2">
                    Grupo Econômico do Lead
                  </h2>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleViewEconomicGroup}
                      disabled={!selectedGroupId}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ver grupo econômico vinculado
                    </Button>
                    {!selectedGroupId && (
                      <p className="text-sm text-muted-foreground">
                        Nenhum grupo vinculado a este lead
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <EconomicGroupSelector
                  value={selectedGroupId}
                  onValueChange={(value) => {
                    setSelectedGroupId(value);
                    setIsDirty(true);
                  }}
                  label=""
                  placeholder="Selecione um grupo econômico..."
                  required
                  helperText="Selecione o grupo econômico relacionado a este lead"
                />
              )}
            </div>

            {/* Vendedor Designado */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-foreground border-b pb-2">
                Vendedor Designado *
              </h2>
              <VendorSelector
                value={selectedVendor ? `${selectedVendor.cod}|${selectedVendor.filial}` : ""}
                onValueChange={(vendor) => {
                  if (vendor) {
                    setSelectedVendor({ cod: vendor.a3_cod, filial: vendor.a3_filial });
                  } else {
                    setSelectedVendor(null);
                  }
                  setIsDirty(true);
                }}
                label=""
                placeholder="Selecione um vendedor..."
                required
                showLabel={false}
              />
              {!selectedVendor && (
                <p className="text-sm text-destructive">Selecione um vendedor</p>
              )}
            </div>

            {/* Segmentos */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-foreground border-b pb-2">
                Segmentos de Interesse *
              </h2>
              {selectedSegments.length === 0 && (
                <p className="text-sm text-destructive">Selecione pelo menos um segmento</p>
              )}
              <QuickSegmentSelector
                selectedSegments={selectedSegments}
                onSegmentsChange={(segments) => {
                  setSelectedSegments(segments);
                  setIsDirty(true);
                }}
              />
            </div>

            {/* Observações */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-foreground border-b pb-2">
                Observações
              </h2>
              <div className="space-y-2">
                <Label htmlFor="observations">Observações Adicionais</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => handleInputChange("observations", e.target.value)}
                  placeholder="Digite observações sobre o lead..."
                  rows={4}
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 z-10 border-t bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={
                loading || creating ||
                !formData.trade_name.trim() || 
                (!isEditing && !selectedGroupId) || 
                selectedSegments.length === 0 || 
                !selectedVendor || 
                (formData.attendance_type === "representative" && !selectedRepresentative)
              }
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {creating ? "Criando..." : loading ? (isEditing ? "Atualizando..." : "Salvando...") : (isEditing ? "Atualizar Lead" : "Criar Lead")}
            </Button>
          </div>
        </div>
      </div>
    </FullscreenDialogContent>
  );
};