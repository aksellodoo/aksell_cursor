import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Loader2, Plus, UserMinus, Save, Users, Edit, Sparkles, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CustomFullscreenModal } from "@/components/ui/custom-fullscreen-modal";
import { PurchasesEconomicGroup, usePurchasesEconomicGroups } from '@/hooks/usePurchasesEconomicGroups';
import { usePurchasesGroupMembers } from '@/hooks/usePurchasesGroupMembers';
import { usePurchasesUnifiedSupplierSearch, PurchasesUnifiedSupplier } from '@/hooks/usePurchasesUnifiedSupplierSearch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMaterialTypes } from '@/hooks/useMaterialTypes';
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

interface PurchasesGroupMembersModalProps {
  group: PurchasesEconomicGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onGroupUpdated: () => void;
}

export function PurchasesGroupMembersModal({ group, isOpen, onClose, onGroupUpdated }: PurchasesGroupMembersModalProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState<string | null>(null);
  const [assignedBuyerCod, setAssignedBuyerCod] = useState('');
  const [assignedBuyerFilial, setAssignedBuyerFilial] = useState('');
  const [protheusFilial, setProtheusFilial] = useState('');
  const [protheusCod, setProtheusCod] = useState('');
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<string[]>([]);
  const [isApplyingMaterialTypes, setIsApplyingMaterialTypes] = useState(false);
  const [isSyncingMaterialTypes, setIsSyncingMaterialTypes] = useState(false);
  const [isSuggestingName, setIsSuggestingName] = useState(false);
  const [isSuggestingBuyer, setIsSuggestingBuyer] = useState(false);
  const [originalMaterialTypes, setOriginalMaterialTypes] = useState<string[]>([]);

  const {
    buyers,
    loadingBuyers,
    fetchBuyers,
    updateGroupDetails,
    suggestGroupName,
    applyMaterialTypesToGroupMembers,
    syncGroupMaterialTypesFromMembers
  } = usePurchasesEconomicGroups();

  const {
    materialTypes,
    loading: materialTypesLoading
  } = useMaterialTypes();

  const {
    members,
    loading: membersLoading,
    error: membersError,
    fetchMembers,
    updateGroupName
  } = usePurchasesGroupMembers();

  const {
    searchResults,
    isSearching,
    error: searchError,
    searchSuppliers,
    addSupplierToGroup,
    removeSupplierFromGroup
  } = usePurchasesUnifiedSupplierSearch();

  // Initialize group data when group changes
  useEffect(() => {
    if (group) {
      setGroupName(group.name);
      setAssignedBuyerCod(group.assigned_buyer_cod || '');
      setAssignedBuyerFilial(group.assigned_buyer_filial || '01');
      setProtheusFilial(group.protheus_filial || '');
      setProtheusCod(group.protheus_cod || '');
      setSelectedMaterialTypes([]);
      setOriginalMaterialTypes([]);
      
      // Load existing material types for this group
      const loadGroupMaterialTypes = async () => {
        try {
          const { data: groupMaterialTypes } = await supabase
            .from('purchases_economic_group_material_types')
            .select('material_type_id')
            .eq('group_id', group.id_grupo);
          
          if (groupMaterialTypes) {
            const materialTypeIds = groupMaterialTypes.map(mt => mt.material_type_id);
            setSelectedMaterialTypes(materialTypeIds);
            setOriginalMaterialTypes(materialTypeIds);
          }
        } catch (error) {
          console.error('Error loading group material types:', error);
        }
      };
      
      loadGroupMaterialTypes();
    }
  }, [group]);

  // Load buyers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchBuyers();
    }
  }, [isOpen, fetchBuyers]);

  // Load members when modal opens or group changes
  useEffect(() => {
    if (isOpen && group) {
      fetchMembers(group.id_grupo);
    }
  }, [isOpen, group, fetchMembers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        searchSuppliers(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, searchSuppliers]);

  const handleUpdateGroupDetails = async () => {
    if (!group || isUpdatingName) return;
    
    const trimmedName = groupName.trim();
    const hasNameChange = trimmedName !== group.name;
    const hasBuyerChange = assignedBuyerCod !== (group.assigned_buyer_cod || '') || 
                          assignedBuyerFilial !== (group.assigned_buyer_filial || '01');
    const hasProtheusChange = protheusFilial !== (group.protheus_filial || '') ||
                             protheusCod !== (group.protheus_cod || '');
    
    // Check if material types changed
    const hasMaterialTypesChange = JSON.stringify([...selectedMaterialTypes].sort()) !== 
                                  JSON.stringify([...originalMaterialTypes].sort());
    
    if (!hasNameChange && !hasBuyerChange && !hasProtheusChange && !hasMaterialTypesChange) return;

    setIsUpdatingName(true);
    try {
      // Update basic group details if needed
      if (hasNameChange || hasBuyerChange || hasProtheusChange) {
        await updateGroupDetails(
          group.id_grupo,
          hasNameChange ? trimmedName : undefined,
          hasBuyerChange ? assignedBuyerCod : undefined,
          hasBuyerChange ? assignedBuyerFilial : undefined,
          hasProtheusChange ? protheusFilial : undefined,
          hasProtheusChange ? protheusCod : undefined
        );
      }
      
      // Update material types if changed using RPC function
      if (hasMaterialTypesChange) {
        const { data: result, error: rpcError } = await supabase.rpc(
          'set_purchases_group_material_types',
          {
            p_group_id: group.id_grupo,
            p_material_type_ids: selectedMaterialTypes
          }
        );
        
        if (rpcError) throw rpcError;
        
        console.log('Material types updated:', result);
        
        // Update original material types
        setOriginalMaterialTypes([...selectedMaterialTypes]);
      }
      
      toast({
        title: "Sucesso",
        description: "Informações do grupo atualizadas com sucesso",
        variant: "default"
      });
      onGroupUpdated();
    } catch (error) {
      console.error('Error updating group details:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar informações do grupo",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleApplyMaterialTypes = async () => {
    if (!group || selectedMaterialTypes.length === 0 || isApplyingMaterialTypes) return;

    setIsApplyingMaterialTypes(true);
    try {
      const result = await applyMaterialTypesToGroupMembers(group.id_grupo, selectedMaterialTypes);
      toast({
        title: "Sucesso",
        description: `Tipos de materiais aplicados a ${result.applied_to_members} membros do grupo`,
        variant: "default"
      });
      setSelectedMaterialTypes([]);
    } catch (error) {
      console.error('Error applying material types:', error);
      toast({
        title: "Erro",
        description: "Erro ao aplicar tipos de materiais",
        variant: "destructive"
      });
    } finally {
      setIsApplyingMaterialTypes(false);
    }
  };

  const handleSyncMaterialTypesFromMembers = async () => {
    if (!group) return;

    setIsSyncingMaterialTypes(true);
    try {
      const result = await syncGroupMaterialTypesFromMembers(group.id_grupo);
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: `${result.inserted} novos tipos importados dos membros. Total no grupo: ${result.total_group_types} tipos.`,
          variant: "default"
        });
        
        // Recarregar os tipos do grupo
        const { data: groupMaterialTypes } = await supabase
          .from('purchases_economic_group_material_types')
          .select('material_type_id')
          .eq('group_id', group.id_grupo);
        
        if (groupMaterialTypes) {
          const newMaterialTypes = groupMaterialTypes.map(mt => mt.material_type_id);
          setSelectedMaterialTypes(newMaterialTypes);
          setOriginalMaterialTypes([...newMaterialTypes]);
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar tipos de materiais:', error);
      toast({
        title: "Erro",
        description: "Erro ao importar tipos de materiais dos membros",
        variant: "destructive"
      });
    } finally {
      setIsSyncingMaterialTypes(false);
    }
  };

  const handleSuggestName = async () => {
    if (!group || isSuggestingName) return;
    
    setIsSuggestingName(true);
    try {
      const result = await suggestGroupName(group.id_grupo);
      setGroupName(result.suggestedName);
      const toastTitle = result.warning ? "Sugestão com aviso" : "Sugestão gerada";
      const toastDescription = result.warning || "Nome sugerido pela IA aplicado ao campo";
      
      toast({
        title: toastTitle,
        description: toastDescription,
        variant: result.warning ? "default" : "default"
      });
    } catch (error) {
      console.error('Error suggesting name:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar sugestão de nome",
        variant: "destructive"
      });
    } finally {
      setIsSuggestingName(false);
    }
  };

  const handleSuggestBuyer = async () => {
    if (!group || !members || members.length === 0 || isSuggestingBuyer) return;
    
    setIsSuggestingBuyer(true);
    try {
      // Contar quantas vezes cada comprador aparece nos membros
      const buyerCounts: { [key: string]: { count: number; filial: string; name: string } } = {};
      
      members.forEach(member => {
        const buyerCod = member.assigned_buyer_cod;
        const buyerFilial = member.assigned_buyer_filial;
        const buyerName = member.assigned_buyer_name;
        
        if (buyerCod && buyerFilial) {
          const key = `${buyerCod}-${buyerFilial}`;
          if (!buyerCounts[key]) {
            buyerCounts[key] = { count: 0, filial: buyerFilial, name: buyerName || buyerCod };
          }
          buyerCounts[key].count++;
        }
      });
      
      // Encontrar o comprador mais comum
      let mostCommonBuyer: { cod: string; filial: string; count: number; name: string } | null = null;
      
      Object.entries(buyerCounts).forEach(([key, data]) => {
        const [cod] = key.split('-');
        if (!mostCommonBuyer || data.count > mostCommonBuyer.count) {
          mostCommonBuyer = { cod, filial: data.filial, count: data.count, name: data.name };
        }
      });
      
      if (mostCommonBuyer) {
        setAssignedBuyerCod(mostCommonBuyer.cod);
        setAssignedBuyerFilial(mostCommonBuyer.filial);
        
        toast({
          title: "Sugestão aplicada",
          description: `Comprador ${mostCommonBuyer.name} sugerido (presente em ${mostCommonBuyer.count} membro${mostCommonBuyer.count > 1 ? 's' : ''} do grupo)`,
          variant: "default"
        });
      } else {
        toast({
          title: "Nenhuma sugestão",
          description: "Nenhum comprador encontrado nos membros do grupo",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error suggesting buyer:', error);
      toast({
        title: "Erro",
        description: "Erro ao sugerir comprador",
        variant: "destructive"
      });
    } finally {
      setIsSuggestingBuyer(false);
    }
  };

  const handleAddMember = async (supplier: PurchasesUnifiedSupplier) => {
    if (!group || isAddingMember) return;
    
    setIsAddingMember(true);
    try {
      await addSupplierToGroup(group.id_grupo, supplier.unified_id);
      toast({
        title: "Sucesso",
        description: `${supplier.display_name} adicionado ao grupo`,
        variant: "default"
      });
      
      // Refresh members and clear search
      await fetchMembers(group.id_grupo);
      setSearchTerm('');
      onGroupUpdated();
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar fornecedor ao grupo",
        variant: "destructive"
      });
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!group || isRemovingMember) return;
    
    setIsRemovingMember(memberId);
    try {
      await removeSupplierFromGroup(group.id_grupo, memberId);
      toast({
        title: "Sucesso",
        description: `${memberName} removido do grupo`,
        variant: "default"
      });
      
      // Refresh members
      await fetchMembers(group.id_grupo);
      onGroupUpdated();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover fornecedor do grupo",
        variant: "destructive"
      });
    } finally {
      setIsRemovingMember(null);
    }
  };

  const handleEditMember = (fuId: string) => {
    // Salvar o ID do grupo no sessionStorage para retornar após a edição
    if (group) {
      sessionStorage.setItem('returnToGroupEdit', group.id_grupo.toString());
    }
    navigate(`/compras/fornecedores-unificados?edit=${fuId}`);
    onClose();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'potential_only':
        return 'secondary';
      case 'supplier':
        return 'default';
      case 'potential_and_supplier':
        return 'default';
      case 'archived':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'potential_only':
        return 'Potencial';
      case 'supplier':
        return 'Fornecedor';
      case 'potential_and_supplier':
        return 'Ambos';
      case 'archived':
        return 'Arquivado';
      default:
        return status;
    }
  };

  if (!group) return null;

  return (
    <CustomFullscreenModal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                Editar Grupo Econômico
              </h2>
              <p className="text-sm text-muted-foreground">
                Código: {group.code}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleUpdateGroupDetails}
              disabled={isUpdatingName || (
                groupName.trim() === group.name &&
                assignedBuyerCod === (group.assigned_buyer_cod || '') &&
                assignedBuyerFilial === (group.assigned_buyer_filial || '01') &&
                protheusFilial === (group.protheus_filial || '') &&
                protheusCod === (group.protheus_cod || '') &&
                JSON.stringify([...selectedMaterialTypes].sort()) === JSON.stringify([...originalMaterialTypes].sort())
              )}
              size="sm"
            >
              {isUpdatingName ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Group Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Grupo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Group Name */}
                <div className="space-y-2">
                  <Label htmlFor="groupName">Nome do Grupo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="groupName"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Nome do grupo..."
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSuggestName}
                      disabled={isSuggestingName}
                      variant="outline"
                      size="sm"
                      title="Sugerir nome com IA"
                    >
                      {isSuggestingName ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Assigned Buyer */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="assignedBuyer">Comprador Designado</Label>
                    <Button
                      onClick={handleSuggestBuyer}
                      disabled={isSuggestingBuyer || !members || members.length === 0}
                      variant="outline"
                      size="sm"
                      title="Sugerir comprador baseado nos membros do grupo"
                    >
                      {isSuggestingBuyer ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-1" />
                          Sugestão
                        </>
                      )}
                    </Button>
                  </div>
                  <Select 
                    value={assignedBuyerCod} 
                    onValueChange={(value) => {
                      if (value === 'none') {
                        setAssignedBuyerCod('');
                        setAssignedBuyerFilial('');
                      } else {
                        setAssignedBuyerCod(value);
                        setAssignedBuyerFilial('01'); // Assumindo filial padrão
                      }
                    }}
                  >
                    <SelectTrigger id="assignedBuyer">
                      <SelectValue placeholder="Selecione um comprador..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum comprador</SelectItem>
                      {loadingBuyers ? (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Carregando...
                        </div>
                      ) : (
                        buyers.map((buyer) => (
                          <SelectItem key={buyer.y1_cod} value={buyer.y1_cod}>
                            {buyer.y1_nome} ({buyer.y1_cod})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Protheus Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="protheusFilial">Protheus Filial</Label>
                    <Input
                      id="protheusFilial"
                      value={protheusFilial}
                      onChange={(e) => setProtheusFilial(e.target.value)}
                      placeholder="Filial..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="protheusCod">Protheus Código</Label>
                    <Input
                      id="protheusCod"
                      value={protheusCod}
                      onChange={(e) => setProtheusCod(e.target.value)}
                      placeholder="Código..."
                    />
                  </div>
                </div>

                {/* Material Types Multi-Select */}
                <div className="space-y-3">
                  <Label>Tipos de Materiais</Label>
                  <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                    {materialTypesLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Carregando tipos de materiais...
                      </div>
                    ) : materialTypes.length > 0 ? (
                      materialTypes.map((materialType) => (
                        <div key={materialType.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={materialType.id}
                            checked={selectedMaterialTypes.includes(materialType.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedMaterialTypes(prev => [...prev, materialType.id]);
                              } else {
                                setSelectedMaterialTypes(prev => prev.filter(id => id !== materialType.id));
                              }
                            }}
                          />
                          <Label 
                            htmlFor={materialType.id}
                            className="flex items-center space-x-2 cursor-pointer flex-1"
                          >
                            <div 
                              className="w-3 h-3 rounded-full border" 
                              style={{ backgroundColor: materialType.color }}
                            />
                            <span>{materialType.name}</span>
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhum tipo de material encontrado
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {selectedMaterialTypes.length > 0 && (
                      <Button
                        onClick={handleApplyMaterialTypes}
                        disabled={isApplyingMaterialTypes}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        {isApplyingMaterialTypes ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Wand2 className="h-4 w-4 mr-2" />
                        )}
                        Auto Seleção - Aplicar aos {members.length} membros
                      </Button>
                    )}
                    
                    <Button
                      onClick={handleSyncMaterialTypesFromMembers}
                      disabled={isSyncingMaterialTypes}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {isSyncingMaterialTypes ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Importar dos membros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Members Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Membros Atuais ({members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Carregando membros...</span>
                  </div>
                ) : membersError ? (
                  <div className="text-center py-8 text-destructive">
                    Erro ao carregar membros: {membersError}
                  </div>
                ) : members.length > 0 ? (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>CNPJ</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Protheus</TableHead>
                          <TableHead>Cidade - UF</TableHead>
                          <TableHead>Distância km até Indaiatuba</TableHead>
                          <TableHead>Comprador Designado</TableHead>
                          <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => (
                          <TableRow key={member.unified_id}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {member.trade_name || member.legal_name || member.display_name}
                                </span>
                                {member.legal_name && member.trade_name && member.legal_name !== member.trade_name && (
                                  <span className="text-sm text-muted-foreground">
                                    {member.legal_name}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {member.cnpj ? (
                                <span className="text-sm font-mono">
                                  {member.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(member.unified_status) as any}>
                                {getStatusLabel(member.unified_status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {member.protheus_cod ? (
                                <span className="text-sm font-mono">
                                  {member.protheus_filial}/{member.protheus_cod}/{member.protheus_loja}
                                </span>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              {member.city_label ? (
                                <span className="text-sm">
                                  {member.city_label}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {member.distance_km_to_indaiatuba ? (
                                <span className="text-sm">
                                  {member.distance_km_to_indaiatuba.toFixed(1)} km
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {member.assigned_buyer_name ? (
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">
                                    {member.assigned_buyer_name}
                                  </span>
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {member.assigned_buyer_filial}/{member.assigned_buyer_cod}
                                  </span>
                                </div>
                              ) : member.assigned_buyer_cod ? (
                                <span className="text-sm font-mono">
                                  {member.assigned_buyer_filial}/{member.assigned_buyer_cod}
                                </span>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditMember(member.unified_id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveMember(member.unified_id, member.display_name)}
                                  disabled={isRemovingMember === member.unified_id}
                                >
                                  {isRemovingMember === member.unified_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <UserMinus className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum membro no grupo ainda.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add Members Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Adicionar Fornecedores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar fornecedores por nome, CNPJ, código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {isSearching && (
                    <Button disabled variant="outline" size="sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </Button>
                  )}
                </div>

                {searchError && (
                  <div className="text-destructive text-sm">
                    Erro na busca: {searchError}
                  </div>
                )}

                {searchTerm && (
                  <div className="overflow-auto max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Protheus</TableHead>
                          <TableHead>Grupo Atual</TableHead>
                          <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.length > 0 ? (
                          searchResults
                            .filter(result => !members.some(member => member.unified_id === result.unified_id))
                            .map((result) => (
                              <TableRow key={result.unified_id}>
                                <TableCell className="font-medium">
                                  {result.display_name}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getStatusBadgeVariant(result.unified_status) as any}>
                                    {getStatusLabel(result.unified_status)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {result.protheus_cod ? (
                                    <span className="text-sm font-mono">
                                      {result.protheus_filial}/{result.protheus_cod}/{result.protheus_loja}
                                    </span>
                                  ) : (
                                    '-'
                                  )}
                                </TableCell>
                                <TableCell>
                                  {result.current_group_name ? (
                                    <Badge variant="outline" className="text-xs">
                                      {result.current_group_name}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">Sem grupo</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAddMember(result)}
                                    disabled={isAddingMember}
                                  >
                                    {isAddingMember ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Plus className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center">
                              {isSearching ? 'Buscando...' : 'Nenhum fornecedor encontrado.'}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CustomFullscreenModal>
  );
}