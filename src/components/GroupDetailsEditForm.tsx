
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomerGroupsWithId } from '@/hooks/useCustomerGroupsWithId';
import { useCustomerGroupSegments } from '@/hooks/useCustomerGroupSegments';
import { useGroupBasicDetails } from '@/hooks/useGroupBasicDetails';
import { useVendors } from '@/hooks/useVendors';
import { QuickSegmentSelector } from '@/components/QuickSegmentSelector';
import { Loader2, Save, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GroupDetailsEditFormProps {
  group: any;
  onUpdate: () => void;
}

interface Segment {
  id: string;
  name: string;
}

export const GroupDetailsEditForm: React.FC<GroupDetailsEditFormProps> = ({
  group,
  onUpdate
}) => {
  const [groupName, setGroupName] = useState(group?.nome_grupo || '');
  const [filial, setFilial] = useState('');
  const [cod, setCod] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  
  const { updateGroupName, generateAINameSuggestion, getGroupMembers } = useCustomerGroupsWithId();
  const { segments, loading: segmentsLoading, updateGroupSegments } = useCustomerGroupSegments(group?.id_grupo);
  const { details, loading: detailsLoading, updateGroupBasicDetails } = useGroupBasicDetails(group?.id_grupo);
  const { listQuery: vendorsQuery } = useVendors();
  
  const [selectedSegments, setSelectedSegments] = useState<Segment[]>([]);

  useEffect(() => {
    if (group) {
      setGroupName(group.nome_grupo || '');
    }
  }, [group]);

  useEffect(() => {
    if (details) {
      setFilial(details.filial || '');
      setCod(details.cod || '');
      setSelectedVendor(details.vendors?.[0] || undefined);
    }
  }, [details]);

  useEffect(() => {
    setSelectedSegments(segments);
  }, [segments]);

  const handleSave = async () => {
    if (!group?.id_grupo) return;
    
    setSaving(true);
    try {
      // Atualizar nome do grupo se foi alterado
      if (groupName !== group.nome_grupo) {
        await updateGroupName(group.id_grupo, groupName);
      }

      // Atualizar detalhes básicos se foram alterados
      const detailsChanged = 
        filial !== (details?.filial || '') ||
        cod !== (details?.cod || '') ||
        (selectedVendor ?? '') !== (details?.vendors?.[0] || '');
      
      if (detailsChanged) {
        await updateGroupBasicDetails({
          filial,
          cod,
          vendors: selectedVendor ? [selectedVendor] : null
        });
      }
      
      // Atualizar segmentos se foram alterados
      const currentSegmentIds = Array.isArray(segments) ? segments.map(s => s?.id).filter(Boolean).sort() : [];
      const newSegmentIds = Array.isArray(selectedSegments) ? selectedSegments.map(s => s?.id).filter(Boolean).sort() : [];
      
      if (JSON.stringify(currentSegmentIds) !== JSON.stringify(newSegmentIds)) {
        await updateGroupSegments(selectedSegments);
      }
      
      onUpdate();
    } catch (error) {
      console.error('Erro ao salvar detalhes do grupo:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAISuggestion = async () => {
    if (!group?.id_grupo) return;
    
    setSaving(true);
    try {
      const suggestion = await generateAINameSuggestion(group.id_grupo);
      if (suggestion) {
        setGroupName(suggestion);
      }
    } catch (error) {
      console.error('Erro ao gerar sugestão de IA:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleVendorAISuggestion = async () => {
    if (!group?.id_grupo) return;
    
    setSaving(true);
    try {
      // Buscar membros do grupo
      const members = await getGroupMembers(group.id_grupo);
      
      if (members.length === 0) {
        setSelectedVendor(undefined);
        return;
      }

      // Contar vendedores por frequência
      const vendorCounts: { [key: string]: number } = {};
      
      members.forEach(member => {
        if (member.vendor_name && member.vendor_name.trim() !== '') {
          const vendorKey = member.vendor_name.trim();
          vendorCounts[vendorKey] = (vendorCounts[vendorKey] || 0) + 1;
        }
      });

      // Se não há vendedores vinculados, sugerir nenhum
      if (Object.keys(vendorCounts).length === 0) {
        setSelectedVendor(undefined);
        return;
      }

      // Encontrar o vendedor mais frequente
      const mostCommonVendor = Object.entries(vendorCounts)
        .sort(([,a], [,b]) => b - a)[0][0];

      // Tentar encontrar o código do vendedor na lista de vendedores disponíveis
      const matchingVendor = vendorsQuery.data?.find(v => 
        v.vendor.a3_cod === mostCommonVendor || 
        v.vendor.a3_nome === mostCommonVendor ||
        v.vendor.a3_nreduz === mostCommonVendor
      );

      if (matchingVendor) {
        setSelectedVendor(matchingVendor.vendor.a3_cod);
      } else {
        // Se não encontrou correspondência exata, usar o primeiro que contém o nome
        const partialMatch = vendorsQuery.data?.find(v => 
          v.vendor.a3_nome?.includes(mostCommonVendor) ||
          v.vendor.a3_nreduz?.includes(mostCommonVendor) ||
          mostCommonVendor.includes(v.vendor.a3_cod)
        );
        
        if (partialMatch) {
          setSelectedVendor(partialMatch.vendor.a3_cod);
        } else {
          setSelectedVendor(undefined);
        }
      }
    } catch (error) {
      console.error('Erro ao gerar sugestão de vendedor:', error);
      setSelectedVendor(undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleSegmentsAISuggestion = async () => {
    if (!group?.id_grupo) return;
    
    setSaving(true);
    try {
      // Buscar todos os segmentos dos membros deste grupo
      const { data: memberSegments, error: segmentsError } = await supabase
        .from('unified_account_segments_map')
        .select(`
          segment_id,
          site_product_segments:segment_id (
            id,
            name
          ),
          unified_accounts!inner (
            economic_group_id
          )
        `)
        .eq('unified_accounts.economic_group_id', group.id_grupo);

      if (segmentsError) throw segmentsError;

      // Extrair segmentos únicos dos membros
      const memberSegmentMap: { [key: string]: Segment } = {};

      memberSegments?.forEach(mapping => {
        const segment = mapping.site_product_segments;
        if (segment && segment.id && segment.name) {
          memberSegmentMap[segment.id] = {
            id: segment.id,
            name: segment.name
          };
        }
      });

      const memberSegmentsList = Object.values(memberSegmentMap);

      // Filtrar segmentos que ainda não estão selecionados
      const currentSegmentIds = selectedSegments.map(s => s.id);
      const newSegments = memberSegmentsList.filter(segment => 
        !currentSegmentIds.includes(segment.id)
      );

      // Adicionar novos segmentos aos já selecionados
      setSelectedSegments(prev => [...prev, ...newSegments]);
      
    } catch (error) {
      console.error('Erro ao gerar sugestão de segmentos:', error);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    try {
      const nameChanged = groupName !== (group?.nome_grupo || '');
      const filialChanged = filial !== (details?.filial || '');
      const codChanged = cod !== (details?.cod || '');
      
      // Safe vendor comparison
      const currentVendor = Array.isArray(details?.vendors) && details.vendors.length > 0 
        ? details.vendors[0] 
        : '';
      const vendorChanged = (selectedVendor ?? '') !== currentVendor;
      
      // Safe segments comparison
      const currentSegmentIds = Array.isArray(segments) ? segments.map(s => s?.id).filter(Boolean).sort() : [];
      const newSegmentIds = Array.isArray(selectedSegments) ? selectedSegments.map(s => s?.id).filter(Boolean).sort() : [];
      const segmentsChanged = JSON.stringify(currentSegmentIds) !== JSON.stringify(newSegmentIds);
      
      return nameChanged || filialChanged || codChanged || vendorChanged || segmentsChanged;
    } catch (error) {
      console.warn('Erro ao verificar mudanças:', error);
      return false;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhes do Grupo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="groupName">Nome do Grupo</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAISuggestion}
              disabled={saving || !group?.id_grupo}
              className="h-6 px-2 py-1 text-xs"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              IA
            </Button>
          </div>
          <Input
            id="groupName"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Digite o nome do grupo"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="filial">Filial</Label>
            <Input
              id="filial"
              value={filial}
              onChange={(e) => setFilial(e.target.value)}
              placeholder="Código da filial"
              disabled={detailsLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cod">Código</Label>
            <Input
              id="cod"
              value={cod}
              onChange={(e) => setCod(e.target.value)}
              placeholder="Código do grupo"
              disabled={detailsLoading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="vendor">Vendedor do Grupo</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleVendorAISuggestion}
                disabled={saving || !group?.id_grupo}
                className="h-6 px-2 py-1 text-xs"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                IA
              </Button>
            </div>
            <Select 
              value={selectedVendor ?? undefined} 
              onValueChange={(value) => setSelectedVendor(value === 'none' ? undefined : value)}
              disabled={detailsLoading || vendorsQuery.isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  detailsLoading || vendorsQuery.isLoading 
                    ? "Carregando..." 
                    : vendorsQuery.isError
                    ? "Falha ao carregar vendedores"
                    : "Selecione um vendedor"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum vendedor</SelectItem>
                {vendorsQuery.data?.map((vendorWithUser) => (
                  <SelectItem key={vendorWithUser.vendor.a3_cod} value={vendorWithUser.vendor.a3_cod}>
                    {vendorWithUser.vendor.a3_nreduz || vendorWithUser.vendor.a3_nome} ({vendorWithUser.vendor.a3_cod})
                  </SelectItem>
                )) || []}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Segmentos</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSegmentsAISuggestion}
              disabled={saving || !group?.id_grupo}
              className="h-6 px-2 py-1 text-xs"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              IA
            </Button>
          </div>
          <QuickSegmentSelector
            selectedSegments={selectedSegments}
            onSegmentsChange={setSelectedSegments}
          />
          {segmentsLoading && (
            <p className="text-sm text-muted-foreground">Carregando segmentos...</p>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges()}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
