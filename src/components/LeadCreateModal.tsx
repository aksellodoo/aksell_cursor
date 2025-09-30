
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuickSegmentSelector } from "@/components/QuickSegmentSelector";
import { CityCombobox } from "@/components/CityCombobox";
import { EconomicGroupSelector } from "@/components/EconomicGroupSelector";
import { VendorSelector } from "@/components/VendorSelector";
import { RepresentativeSelector } from "@/components/RepresentativeSelector";
import { useLeads } from "@/hooks/useLeads";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TagInput } from "@/components/TagInput";
import { useEmailTags, EmailTag } from "@/hooks/useEmailTags";

interface Segment {
  id: string;
  name: string;
}

interface LeadCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId?: string;
  groupId?: number;
  onCreated?: (payload: { leadId: string; economicGroupId: number }) => void;
}

export function LeadCreateModal({ isOpen, onClose, tableId, groupId, onCreated }: LeadCreateModalProps) {
  const [formData, setFormData] = useState({
    nome: "",
    empresa: "",
    website: "",
    source_channel: "",
    source_subchannel: "",
    referral_name: "",
    city_id: "",
    observacoes: "",
    status: "novo" as const,
    attendance_type: "direct" as "direct" | "representative"
  });
  const [selectedSegments, setSelectedSegments] = useState<Segment[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>();
  const [selectedVendor, setSelectedVendor] = useState<{ cod: string; filial: string } | null>(null);
  const [selectedRepresentative, setSelectedRepresentative] = useState<string | undefined>();
  const [selectedTags, setSelectedTags] = useState<EmailTag[]>([]);
  const [creating, setCreating] = useState(false);

  const { createLead, loading } = useLeads();

  // Set the group ID if provided
  useEffect(() => {
    if (groupId && isOpen) {
      setSelectedGroupId(groupId);
    }
  }, [groupId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    
    if (!selectedGroupId) {
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
    
    setCreating(true);
    try {
      // 1. Create the lead
      const leadData = {
        source_channel: (formData.source_channel as any) || 'website',
        source_subchannel: formData.source_subchannel || undefined,
        referral_name: formData.referral_name || undefined,
        trade_name: formData.nome,
        legal_name: formData.empresa || undefined,
        website: formData.website || undefined,
        city_id: formData.city_id || undefined,
        segment_ids: selectedSegments.map(s => s.id),
        attendance_type: formData.attendance_type,
        tag_ids: selectedTags.map(tag => tag.id),
        economic_group_id: selectedGroupId,
        assigned_vendor_cod: selectedVendor.cod,
        assigned_vendor_filial: selectedVendor.filial,
        representative_id: formData.attendance_type === "representative" ? selectedRepresentative : undefined
      };

      const newLead = await createLead(leadData);
      
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

      // Call onCreated callback if provided
      if (onCreated && selectedGroupId) {
        onCreated({ leadId: newLead.id, economicGroupId: selectedGroupId });
      }
      
      setTimeout(onClose, 0);
      setFormData({
        nome: "",
        empresa: "",
        website: "",
        source_channel: "",
        source_subchannel: "",
        referral_name: "",
        city_id: "",
        observacoes: "",
        status: "novo",
        attendance_type: "direct"
      });
      setSelectedSegments([]);
      setSelectedGroupId(undefined);
      setSelectedVendor(null);
      setSelectedRepresentative(undefined);
      setSelectedTags([]);
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      toast.error("Erro ao criar lead");
    } finally {
      setCreating(false);
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Tipo de Atendimento *</Label>
            <Select
              value={formData.attendance_type}
              onValueChange={(value: "direct" | "representative") => {
                setFormData(prev => ({ ...prev, attendance_type: value }));
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
            <div>
              <RepresentativeSelector
                value={selectedRepresentative}
                onValueChange={setSelectedRepresentative}
                label="Representante Comercial de Vendas"
                placeholder="Selecione um representante comercial..."
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="source_channel">Canal de Origem *</Label>
            <Select 
              value={formData.source_channel} 
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, source_channel: value, source_subchannel: "" }));
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
            <div>
              <Label htmlFor="source_subchannel">Detalhamento</Label>
              <Select
                value={formData.source_subchannel}
                onValueChange={(value) => setFormData(prev => ({ ...prev, source_subchannel: value }))}
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
            <div>
              <Label htmlFor="source_subchannel">Especificar Canal</Label>
              <Input
                id="source_subchannel"
                value={formData.source_subchannel}
                onChange={(e) => setFormData(prev => ({ ...prev, source_subchannel: e.target.value }))}
                placeholder="Digite o canal de origem"
              />
            </div>
          )}

          {formData.source_channel === 'referral' && (
            <div>
              <Label htmlFor="referral_name">Nome do Indicador</Label>
              <Input
                id="referral_name"
                value={formData.referral_name}
                onChange={(e) => setFormData(prev => ({ ...prev, referral_name: e.target.value }))}
                placeholder="Digite o nome de quem indicou"
              />
            </div>
          )}

          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Nome do lead"
              required
            />
          </div>

          <div>
            <Label htmlFor="empresa">Empresa</Label>
            <Input
              id="empresa"
              value={formData.empresa}
              onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
              placeholder="Nome da empresa"
            />
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://exemplo.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Cidade</Label>
              <CityCombobox
                value={formData.city_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, city_id: value }))}
                placeholder="Selecione uma cidade..."
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags</Label>
              <TagInput
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                placeholder="Digite uma tag e pressione Enter..."
              />
            </div>
          </div>

          <div>
            <EconomicGroupSelector
              value={selectedGroupId}
              onValueChange={setSelectedGroupId}
              label="Grupo Econômico"
              placeholder="Selecione um grupo econômico..."
              required
              helperText="Selecione o grupo econômico relacionado a este lead"
            />
          </div>

          <div>
            <Label>Vendedor Designado *</Label>
            <VendorSelector
              value={selectedVendor ? `${selectedVendor.cod}|${selectedVendor.filial}` : ""}
              onValueChange={(vendor) => {
                if (vendor) {
                  setSelectedVendor({ cod: vendor.a3_cod, filial: vendor.a3_filial });
                } else {
                  setSelectedVendor(null);
                }
              }}
              label=""
              placeholder="Selecione um vendedor..."
              required
              showLabel={false}
            />
            {!selectedVendor && (
              <p className="text-sm text-destructive mt-1">Selecione um vendedor</p>
            )}
          </div>

          <div>
            <Label>Segmentos de Interesse *</Label>
            {selectedSegments.length === 0 && (
              <p className="text-sm text-destructive mb-2">Selecione pelo menos um segmento</p>
            )}
            <QuickSegmentSelector
              selectedSegments={selectedSegments}
              onSegmentsChange={setSelectedSegments}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="contato_inicial">Contato Inicial</SelectItem>
                <SelectItem value="qualificado">Qualificado</SelectItem>
                <SelectItem value="proposta">Proposta</SelectItem>
                <SelectItem value="negociacao">Negociação</SelectItem>
                <SelectItem value="fechado_ganho">Fechado - Ganho</SelectItem>
                <SelectItem value="fechado_perdido">Fechado - Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações sobre o lead"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={
              loading || creating || 
              !formData.nome.trim() || 
              !selectedGroupId || 
              selectedSegments.length === 0 || 
              !selectedVendor || 
              (formData.attendance_type === "representative" && !selectedRepresentative)
            }>
              {creating ? "Criando..." : "Criar Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
