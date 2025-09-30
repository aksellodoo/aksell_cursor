import { useState, useEffect, useCallback, Dispatch, SetStateAction, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Edit, Copy, Trash, Loader2, Settings, RefreshCw, Filter, Search, X } from "lucide-react"
import { ColumnFilterPopover } from "@/components/ColumnFilterPopover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCustomerGroupsWithId, CustomerGroupWithId } from "@/hooks/useCustomerGroupsWithId";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from '@/integrations/supabase/client';
import { PROTHEUS_TABLES } from '@/lib/config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from 'sonner';
import { useLeads } from '@/hooks/useLeads';
import { UnifiedGroupMember } from '@/types/unifiedGroupTypes';
import { UnifiedSearchResult } from '@/types/unifiedGroupTypes';
import { useAISuggest } from '@/hooks/useAISuggest';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Circle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LeadCreateModal } from '../LeadCreateModal';
import { useNavigate } from 'react-router-dom';

interface ClientGroupUnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: any;
  onViewRecord: () => void;
}

function ClientGroupUnitsModal({ isOpen, onClose, group, onViewRecord }: ClientGroupUnitsModalProps) {
  const [members, setMembers] = useState<UnifiedGroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const { getGroupMembers } = useCustomerGroupsWithId();

  useEffect(() => {
    const fetchMembers = async () => {
      if (group && group.id_grupo) {
        setLoading(true);
        try {
          const fetchedMembers = await getGroupMembers(group.id_grupo);
          setMembers(fetchedMembers);
        } catch (error) {
          console.error("Failed to fetch group members", error);
          toast.error("Falha ao carregar membros do grupo");
        } finally {
          setLoading(false);
        }
      }
    };

    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen, group, getGroupMembers]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Membros do Grupo: {group?.nome_grupo}</DialogTitle>
          <DialogDescription>
            Lista de todos os clientes unificados pertencentes a este grupo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid w-full gap-4">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID Unificado</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Filial</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vendedor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : members.length > 0 ? (
                  members.map((member) => (
                    <TableRow key={member.unified_id}>
                      <TableCell className="font-medium">{member.unified_id}</TableCell>
                      <TableCell>{member.display_name}</TableCell>
                      <TableCell>{member.protheus_filial}</TableCell>
                      <TableCell>{member.protheus_cod}</TableCell>
                      <TableCell>{member.protheus_loja}</TableCell>
                      <TableCell>{member.unified_status}</TableCell>
                      <TableCell>{member.vendor_name}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Nenhum membro encontrado neste grupo.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const formSchema = z.object({
  groupName: z.string().min(2, {
    message: "Nome do grupo deve ter pelo menos 2 caracteres.",
  }),
})

function SalesClientGroups() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isLeadsModalOpen, setIsLeadsModalOpen] = useState(false);
  const [isCreatingMissing, setIsCreatingMissing] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [missingMembersCount, setMissingMembersCount] = useState<number>(0);

  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matchedGroupIds, setMatchedGroupIds] = useState<Set<number>>(new Set());

  // Filter states
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({
    id_grupo: '',
    nome_grupo: '',
    filial: '',
    cod: '',
    member_count: '',
    vendor_names: '',
    group_vendor_name: '',
  });

  const {
    groups,
    loading,
    error,
    fetchGroups,
    createGroup,
    generateAINameSuggestion,
    updateGroupName,
    deleteGroup,
    searchCustomers,
  } = useCustomerGroupsWithId();

  const { leads } = useLeads();
  const { toast } = useToast();
  const { getSuggestion } = useAISuggest();

  // Fetch missing members count
  useEffect(() => {
    const fetchMissingMembersCount = async () => {
      try {
        const { count, error } = await supabase
          .from('unified_accounts')
          .select('*', { count: 'exact', head: true })
          .is('economic_group_id', null);
          
        if (error) throw error;
        setMissingMembersCount(count || 0);
      } catch (error) {
        console.error('Error fetching missing members count:', error);
        setMissingMembersCount(0);
      }
    };

    fetchMissingMembersCount();
  }, [groups]); // Refresh when groups change

  const handleRefreshGroups = async () => {
    try {
      await fetchGroups();
      toast({ 
        title: "Sucesso", 
        description: "Lista de grupos atualizada", 
        variant: "default" 
      });
    } catch (error) {
      console.error('Error refreshing groups:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao atualizar lista de grupos", 
        variant: "destructive" 
      });
    }
  };

  const handleOpenLeadsModal = () => {
    setIsLeadsModalOpen(true);
  };

  const handleCloseLeadsModal = () => {
    setIsLeadsModalOpen(false);
  };

  const handleViewGroupUnits = useCallback((group: CustomerGroupWithId) => {
    setSelectedGroup(group);
    setShowUnitsModal(true);
  }, []);

  const handleEditGroupName = useCallback((group: CustomerGroupWithId) => {
    setEditingGroup(group);
    setEditGroupName(group.nome_grupo);
    setShowUpdateModal(true);
  }, []);

  const handleManageGroup = useCallback((group: CustomerGroupWithId) => {
    navigate(`/vendas/cadastros/grupos/${group.id_grupo}/gerenciar`);
  }, [navigate]);

  const handleSaveGroupName = useCallback(async () => {
    if (!editingGroup) return;

    try {
      await updateGroupName(editingGroup.id_grupo, editGroupName);
      setShowUpdateModal(false);
      setEditingGroup(null);
      setEditGroupName('');
      fetchGroups();
    } catch (error) {
      console.error('Error updating group name:', error);
    }
  }, [editingGroup, editGroupName, updateGroupName, fetchGroups]);

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setEditingGroup(null);
    setEditGroupName('');
  };

  // Utility function to sanitize AI-generated names
  const sanitizeAIName = useCallback((name: string, fallbackId: number): string => {
    if (!name || typeof name !== 'string') {
      return `Grupo ${fallbackId}`;
    }

    let sanitized = name.trim();
    
    // Remove "grupo"/"group" prefixes (case insensitive)
    sanitized = sanitized.replace(/^(grupo\s+|group\s+)/gi, '');
    
    // Remove common legal suffixes
    sanitized = sanitized.replace(/\s+(ltda\.?|s\.?a\.?|me|epp|eireli)\.?$/gi, '');
    
    // Normalize spaces
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    // If empty after sanitization, use fallback
    if (!sanitized) {
      return `Grupo ${fallbackId}`;
    }
    
    return sanitized;
  }, []);

  const handleSuggestName = useCallback(async (group: CustomerGroupWithId) => {
    try {
      // Collect member names for AI suggestion
      let memberNames: string[] = [];

      // First: Get names from unified_accounts + sales_leads
      const { data: unifiedData } = await supabase
        .from('unified_accounts')
        .select(`
          id,
          protheus_filial,
          protheus_cod,
          protheus_loja,
          sales_leads(trade_name, legal_name)
        `)
        .eq('economic_group_id', group.id_grupo)
        .limit(10);

      if (unifiedData && unifiedData.length > 0) {
        // Get lead names
        const leadNames = unifiedData
          .map(u => u.sales_leads?.trade_name || u.sales_leads?.legal_name)
          .filter(Boolean)
          .slice(0, 5);
        
        memberNames.push(...leadNames);

        // Second: If we need more names, get Protheus names from SA1010
        if (memberNames.length < 3) {
          for (const unified of unifiedData.slice(0, 5)) {
            if (unified.protheus_filial && unified.protheus_cod && unified.protheus_loja) {
              try {
                const { data: protheusNames } = await supabase.rpc('get_protheus_group_unit_names', {
                  p_table_id: PROTHEUS_TABLES.SA1010_CLIENTES,
                  p_filial: unified.protheus_filial,
                  p_cod: unified.protheus_cod
                });

                if (protheusNames && protheusNames.length > 0) {
                  const names = protheusNames
                    .map(p => p.short_name || p.unit_name)
                    .filter(Boolean)
                    .slice(0, 2);
                  
                  memberNames.push(...names);
                }
              } catch (protheusError) {
                console.log(`Error getting Protheus names for ${unified.protheus_cod}:`, protheusError);
              }
            }
          }
        }
      }

      // Remove duplicates and limit to 5 names
      memberNames = [...new Set(memberNames)].slice(0, 5);

      if (memberNames.length > 0) {
        // Generate AI suggestion with improved prompt
        const aiResult = await getSuggestion({
          sourceValues: memberNames,
          task: 'generate',
          instructions: 'Analise os nomes comerciais e razões sociais fornecidos e crie um nome único e representativo para a empresa ou marca principal. O nome deve ser conciso (máximo 3-4 palavras), profissional e capturar a essência da empresa. NÃO inclua a palavra "grupo" ou "group". Ignore sufixos jurídicos como LTDA, S/A, ME, EPP. Retorne apenas o nome da empresa/marca, sem explicações.',
          outputType: 'text'
        });

        if (aiResult && aiResult.suggestion) {
          const sanitizedName = sanitizeAIName(aiResult.suggestion, group.id_grupo);
          await updateGroupName(group.id_grupo, sanitizedName);
          fetchGroups();
          toast({ 
            title: "Sucesso", 
            description: `Nome sugerido: "${sanitizedName}"`, 
            variant: "default" 
          });
        } else {
          toast({ 
            title: "Erro", 
            description: "Não foi possível gerar sugestão de nome", 
            variant: "destructive" 
          });
        }
      } else {
        toast({ 
          title: "Erro", 
          description: "Nenhum nome de membro encontrado para análise", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error('Error generating name suggestion:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao gerar sugestão de nome", 
        variant: "destructive" 
      });
    }
  }, [getSuggestion, sanitizeAIName, updateGroupName, fetchGroups, toast]);

  const handleDeleteGroup = useCallback(async (group: CustomerGroupWithId) => {
    if (window.confirm(`Tem certeza que deseja excluir o grupo "${group.nome_grupo}"?`)) {
      try {
        await deleteGroup(group.id_grupo);
        fetchGroups();
      } catch (error) {
        console.error('Error deleting group:', error);
      }
    }
  }, [deleteGroup, fetchGroups]);

  const handleCreateGroup = useCallback(async (groupName: string) => {
    try {
      await createGroup(groupName);
      setIsDrawerOpen(false);
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  }, [createGroup, fetchGroups]);

  // Utility function to check if a group name is a fallback name
  const isFallbackName = useCallback((name: string | null | undefined, groupId: number): boolean => {
    if (!name || name.trim() === '') return true;
    const trimmedName = name.trim();
    // Check for patterns like "Grupo 123" or just numbers
    return (
      trimmedName === `Grupo ${groupId}` ||
      !!trimmedName.match(/^Grupo\s+\d+$/i) ||
      !!trimmedName.match(/^\d+$/) ||
      trimmedName.toLowerCase() === 'sem nome' ||
      trimmedName.toLowerCase() === 'unnamed'
    );
  }, []);

  const handleCreateMissingGroups = async () => {
    setIsCreatingMissing(true);
    try {
      toast({ 
        title: "Processando", 
        description: "Criando grupos e sugerindo nomes com IA...", 
        variant: "default" 
      });

      // Step 1: Execute rebuild function first
      const { data: result, error } = await supabase.rpc('rebuild_economic_groups_from_unified');
      
      if (error) {
        console.error('Error creating missing groups:', error);
        toast({ 
          title: "Erro", 
          description: "Erro ao processar grupos econômicos", 
          variant: "destructive" 
        });
        return;
      }
      
      if (!(result as any)?.success) {
        toast({ 
          title: "Erro", 
          description: (result as any)?.message || 'Erro durante o processamento', 
          variant: "destructive" 
        });
        return;
      }

      const data = result as any;
      const groupsCreated = data?.groups_created || 0;

      // Step 2: Get all current groups to identify which need AI names
      const { data: allGroupsData } = await supabase.rpc('get_customer_groups_with_id', {
        p_table_id: PROTHEUS_TABLES.SA1010_CLIENTES
      });
      
      if (!allGroupsData || allGroupsData.length === 0) {
        toast({ 
          title: "Concluído", 
          description: groupsCreated > 0 ? `${groupsCreated} grupos criados, mas nenhum grupo encontrado para processamento` : "Nenhum grupo encontrado", 
          variant: "default" 
        });
        await fetchGroups();
        return;
      }

      // Step 3: Filter groups that need AI name suggestions (fallback names)
      const groupsNeedingNames = allGroupsData.filter((g: any) => 
        isFallbackName(g.nome_grupo, g.id_grupo)
      );

      // Show immediate progress
      await fetchGroups();

      if (groupsNeedingNames.length === 0) {
        toast({ 
          title: "Concluído", 
          description: groupsCreated > 0 ? `${groupsCreated} grupos criados, todos já possuem nomes adequados` : "Todos os grupos já possuem nomes adequados", 
          variant: "default" 
        });
        return;
      }

      toast({ 
        title: "Processando Nomes", 
        description: `${groupsCreated} grupos criados. Gerando nomes com IA para ${groupsNeedingNames.length} grupos...`, 
        variant: "default" 
      });

      // Step 4: Process groups that need AI names in batches
      let aiNamesGenerated = 0;
      const batchSize = 3;
      
      for (let i = 0; i < groupsNeedingNames.length; i += batchSize) {
        const batch = groupsNeedingNames.slice(i, i + batchSize);
        
        toast({ 
          title: "Gerando Nomes com IA", 
          description: `Processando ${Math.min(i + batchSize, groupsNeedingNames.length)} de ${groupsNeedingNames.length} grupos...`, 
          variant: "default" 
        });

        const batchPromises = batch.map(async (group: any) => {
          try {
            let memberNames: string[] = [];

            // First: Collect names from unified_accounts + sales_leads
            const { data: unifiedData } = await supabase
              .from('unified_accounts')
              .select(`
                id,
                protheus_filial,
                protheus_cod,
                protheus_loja,
                sales_leads(trade_name, legal_name)
              `)
              .eq('economic_group_id', group.id_grupo)
              .limit(10);

            if (unifiedData && unifiedData.length > 0) {
              // Get lead names
              const leadNames = unifiedData
                .map(u => u.sales_leads?.trade_name || u.sales_leads?.legal_name)
                .filter(Boolean)
                .slice(0, 5);
              
              memberNames.push(...leadNames);

              // Second: If we need more names, get Protheus names from SA1010
              if (memberNames.length < 3) {
                for (const unified of unifiedData.slice(0, 5)) {
                  if (unified.protheus_filial && unified.protheus_cod && unified.protheus_loja) {
                    try {
                      const { data: protheusNames } = await supabase.rpc('get_protheus_group_unit_names', {
                        p_table_id: PROTHEUS_TABLES.SA1010_CLIENTES,
                        p_filial: unified.protheus_filial,
                        p_cod: unified.protheus_cod
                      });

                      if (protheusNames && protheusNames.length > 0) {
                        const names = protheusNames
                          .map(p => p.short_name || p.unit_name)
                          .filter(Boolean)
                          .slice(0, 2);
                        
                        memberNames.push(...names);
                      }
                    } catch (protheusError) {
                      console.log(`Error getting Protheus names for ${unified.protheus_cod}:`, protheusError);
                    }
                  }
                }
              }
            }

            // Remove duplicates and limit to 5 names
            memberNames = [...new Set(memberNames)].slice(0, 5);

            console.log(`Group ${group.id_grupo} - Member names found:`, memberNames);

            // Generate AI suggestion if we have names
            if (memberNames.length > 0) {
              try {
                const aiResult = await getSuggestion({
                  sourceValues: memberNames,
                  task: 'generate',
                  instructions: 'Analise os nomes comerciais e razões sociais fornecidos e crie um nome único e representativo para a empresa ou marca principal. O nome deve ser conciso (máximo 3-4 palavras), profissional e capturar a essência da empresa. NÃO inclua a palavra "grupo" ou "group". Ignore sufixos jurídicos como LTDA, S/A, ME, EPP. Retorne apenas o nome da empresa/marca, sem explicações.',
                  outputType: 'text'
                });

                if (aiResult && aiResult.suggestion) {
                  const sanitizedName = sanitizeAIName(aiResult.suggestion, group.id_grupo);
                  console.log(`Group ${group.id_grupo} - AI suggested name:`, sanitizedName);
                  
                  // Save AI suggestion as the official name
                  const success = await updateGroupName(group.id_grupo, sanitizedName);
                  if (success) {
                    aiNamesGenerated++;
                    console.log(`Group ${group.id_grupo} - Name updated successfully`);
                    // Update UI immediately after each successful name generation
                    await fetchGroups();
                  } else {
                    console.error(`Group ${group.id_grupo} - Failed to update name`);
                  }
                } else {
                  console.error(`Group ${group.id_grupo} - No AI suggestion received`);
                }
              } catch (aiError) {
                console.error(`Group ${group.id_grupo} - AI generation error:`, aiError);
                // Check if it's an OpenAI API key error
                if (aiError.message && aiError.message.includes('API key')) {
                  toast({ 
                    title: "Erro de API", 
                    description: "Chave da API OpenAI não configurada. Configure nas configurações do sistema.", 
                    variant: "destructive" 
                  });
                }
              }
            } else {
              console.log(`Group ${group.id_grupo} - No member names found, skipping AI generation`);
            }
          } catch (error) {
            console.error(`Error processing group ${group.id_grupo}:`, error);
          }
        });

        // Process the batch - don't wait for all before continuing
        await Promise.allSettled(batchPromises);
        
        // Small delay between batches for UI responsiveness
        if (i + batchSize < groupsNeedingNames.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Final summary
      toast({ 
        title: "Processamento Concluído", 
        description: `✅ ${groupsCreated} grupos criados, ${aiNamesGenerated} nomes gerados por IA`, 
        variant: "default" 
      });
      
      // Final UI update
      await fetchGroups();
    } catch (error) {
      console.error('Error creating missing groups:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao processar grupos econômicos", 
        variant: "destructive" 
      });
    } finally {
      setIsCreatingMissing(false);
    }
  };

  const handleDeleteAllGroups = async () => {
    if (groups.length === 0) {
      toast({ 
        title: "Aviso", 
        description: "Não há grupos para excluir", 
        variant: "default" 
      });
      return;
    }

    const confirmed = window.confirm(
      `⚠️ ATENÇÃO: Esta ação irá excluir TODOS os ${groups.length} grupos econômicos permanentemente. Esta operação não pode ser desfeita. Tem certeza que deseja continuar?`
    );

    if (!confirmed) return;

    setIsDeletingAll(true);
    try {
      toast({ 
        title: "Processando", 
        description: "Iniciando exclusão de todos os grupos...", 
        variant: "default" 
      });

      let deletedCount = 0;
      const batchSize = 10; // Process in batches
      const totalGroups = groups.length;

      for (let i = 0; i < totalGroups; i += batchSize) {
        const batch = groups.slice(i, i + batchSize);
        
        toast({ 
          title: "Excluindo Grupos", 
          description: `Processando ${Math.min(i + batchSize, totalGroups)} de ${totalGroups} grupos...`, 
          variant: "default" 
        });

        await Promise.all(
          batch.map(async (group) => {
            try {
              const { error } = await supabase.rpc('delete_economic_group', {
                p_id_grupo: group.id_grupo
              });
              
              if (!error) {
                deletedCount++;
              } else {
                console.error(`Error deleting group ${group.id_grupo}:`, error);
              }
            } catch (deleteError) {
              console.error(`Error deleting group ${group.id_grupo}:`, deleteError);
            }
          })
        );

        // Small delay between batches
        if (i + batchSize < totalGroups) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      toast({ 
        title: "Exclusão Concluída", 
        description: `✅ ${deletedCount} de ${totalGroups} grupos excluídos com sucesso.`, 
        variant: "default" 
      });

      await fetchGroups();
    } catch (error) {
      console.error('Error deleting all groups:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao excluir grupos econômicos", 
        variant: "destructive" 
      });
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Filter handlers
  const handleColumnFilterChange = useCallback((column: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setColumnFilters({
      id_grupo: '',
      nome_grupo: '',
      filial: '',
      cod: '',
      member_count: '',
      vendor_names: '',
      group_vendor_name: '',
    });
  }, []);

  // Search functionality with debounce
  useEffect(() => {
    if (!searchTerm.trim()) {
      setMatchedGroupIds(new Set());
      setIsSearching(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCustomers(searchTerm);
        const groupIds = new Set(
          results
            .map(result => result.current_group_id)
            .filter(id => id !== null && id !== undefined)
        );
        setMatchedGroupIds(groupIds);
      } catch (error) {
        console.error('Error searching customers:', error);
        setMatchedGroupIds(new Set());
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchCustomers]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setMatchedGroupIds(new Set());
    setIsSearching(false);
  }, []);

  // Filtered groups
  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    
    return groups.filter(group => {
      // Search filter
      let searchMatch = true;
      if (searchTerm.trim()) {
        const termLower = searchTerm.toLowerCase();
        const nameMatch = group.nome_grupo?.toLowerCase().includes(termLower);
        const vendorNamesMatch = group.vendor_names?.some(vendor => 
          vendor.toLowerCase().includes(termLower)
        );
        const groupVendorMatch = group.group_vendor_name?.toLowerCase().includes(termLower);
        const memberMatch = matchedGroupIds.has(group.id_grupo);
        
        searchMatch = nameMatch || vendorNamesMatch || groupVendorMatch || memberMatch;
      }
      
      // Column filters
      const idMatch = !columnFilters.id_grupo || 
        group.id_grupo?.toString().toLowerCase().includes(columnFilters.id_grupo.toLowerCase());
      
      const nameMatch = !columnFilters.nome_grupo || 
        group.nome_grupo?.toLowerCase().includes(columnFilters.nome_grupo.toLowerCase());
      
      const filialMatch = !columnFilters.filial || 
        group.filial?.toLowerCase().includes(columnFilters.filial.toLowerCase());
      
      const codMatch = !columnFilters.cod || 
        group.cod?.toLowerCase().includes(columnFilters.cod.toLowerCase());
      
      const memberCountMatch = !columnFilters.member_count || 
        group.member_count?.toString().includes(columnFilters.member_count);
      
      const vendorMatch = !columnFilters.vendor_names || 
        group.vendor_names?.some(vendor => 
          vendor.toLowerCase().includes(columnFilters.vendor_names.toLowerCase())
        );
      
      const groupVendorMatch = !columnFilters.group_vendor_name || 
        group.group_vendor_name?.toLowerCase().includes(columnFilters.group_vendor_name.toLowerCase());
      
      return searchMatch && idMatch && nameMatch && filialMatch && codMatch && memberCountMatch && vendorMatch && groupVendorMatch;
    });
  }, [groups, columnFilters, searchTerm, matchedGroupIds]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(columnFilters).some(value => value.trim() !== '') || searchTerm.trim() !== '';
  }, [columnFilters, searchTerm]);

  // Load groups on component mount
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groupName: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await handleCreateGroup(values.groupName);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Grupos Econômicos</h2>
          <p className="text-muted-foreground">
            Gerencie grupos econômicos de clientes unificados.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Pesquise por: nome do grupo, nome fantasia/razão social, CNPJ, cidade, UF, vendedor e código Protheus
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col gap-4">
          {/* Search Box */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Pesquisar grupos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              onClick={() => setIsDrawerOpen(true)}
            >
              Criar Grupo
            </Button>
            <Button 
              variant="outline"
              size="sm" 
              onClick={handleRefreshGroups}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                'Atualizar Grupos'
              )}
            </Button>
            <Button
              onClick={handleCreateMissingGroups}
              disabled={isCreatingMissing}
              size="sm"
              variant="outline"
            >
              {isCreatingMissing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Criar Grupos Econômicos Faltantes
                </>
              )}
            </Button>
            <Button
              onClick={handleDeleteAllGroups}
              disabled={isDeletingAll || groups.length === 0}
              size="sm"
              variant="destructive"
            >
              {isDeletingAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash className="h-4 w-4 mr-2" />
                  Apagar Todos os Grupos Econômicos
                </>
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                onClick={() => {
                  clearAllFilters();
                  clearSearch();
                }}
                variant="outline"
                size="sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{groups.length}</div>
              <p className="text-sm text-muted-foreground">Total de Grupos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {groups.reduce((sum, group) => sum + (group.member_count || 0), 0)}
              </div>
              <p className="text-sm text-muted-foreground">Total de Clientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="text-2xl font-bold">{missingMembersCount}</div>
                <p className="text-sm text-muted-foreground">Membros Faltantes</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/vendas/cadastros?subtab=unificado&missing=1', '_blank')}
              >
                Ver
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Groups Table */}
        <div className="rounded-md border">
          <Table>
            <TableCaption>
              {hasActiveFilters 
                ? `Mostrando ${filteredGroups.length} de ${groups.length} grupos ${searchTerm ? `(pesquisa: "${searchTerm}")` : ''}`
                : `Total de ${groups.length} grupos`
              }
              {isSearching && ' • Pesquisando...'}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <ColumnFilterPopover
                    column="id_grupo"
                    value={columnFilters.id_grupo}
                    onChange={(value) => handleColumnFilterChange('id_grupo', value)}
                    onClear={() => handleColumnFilterChange('id_grupo', '')}
                  >
                    <Button variant="ghost" size="sm">
                      ID
                    </Button>
                  </ColumnFilterPopover>
                </TableHead>
                <TableHead>
                  <ColumnFilterPopover
                    column="nome_grupo"
                    value={columnFilters.nome_grupo}
                    onChange={(value) => handleColumnFilterChange('nome_grupo', value)}
                    onClear={() => handleColumnFilterChange('nome_grupo', '')}
                  >
                    <Button variant="ghost" size="sm">
                      Nome do Grupo
                    </Button>
                  </ColumnFilterPopover>
                </TableHead>
                <TableHead>
                  <ColumnFilterPopover
                    column="filial"
                    value={columnFilters.filial}
                    onChange={(value) => handleColumnFilterChange('filial', value)}
                    onClear={() => handleColumnFilterChange('filial', '')}
                  >
                    <Button variant="ghost" size="sm">
                      Filial
                    </Button>
                  </ColumnFilterPopover>
                </TableHead>
                <TableHead>
                  <ColumnFilterPopover
                    column="cod"
                    value={columnFilters.cod}
                    onChange={(value) => handleColumnFilterChange('cod', value)}
                    onClear={() => handleColumnFilterChange('cod', '')}
                  >
                    <Button variant="ghost" size="sm">
                      Código
                    </Button>
                  </ColumnFilterPopover>
                </TableHead>
                <TableHead>
                  <ColumnFilterPopover
                    column="member_count"
                    value={columnFilters.member_count}
                    onChange={(value) => handleColumnFilterChange('member_count', value)}
                    onClear={() => handleColumnFilterChange('member_count', '')}
                  >
                    <Button variant="ghost" size="sm">
                      Membros
                    </Button>
                  </ColumnFilterPopover>
                </TableHead>
                <TableHead>
                  <ColumnFilterPopover
                    column="vendor_names"
                    value={columnFilters.vendor_names}
                    onChange={(value) => handleColumnFilterChange('vendor_names', value)}
                    onClear={() => handleColumnFilterChange('vendor_names', '')}
                  >
                    <Button variant="ghost" size="sm">
                      Vendedores dos membros
                    </Button>
                  </ColumnFilterPopover>
                </TableHead>
                <TableHead>
                  <ColumnFilterPopover
                    column="group_vendor_name"
                    value={columnFilters.group_vendor_name}
                    onChange={(value) => handleColumnFilterChange('group_vendor_name', value)}
                    onClear={() => handleColumnFilterChange('group_vendor_name', '')}
                  >
                    <Button variant="ghost" size="sm">
                      Vendedor do Grupo
                    </Button>
                  </ColumnFilterPopover>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-[50px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[200px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[80px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[80px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[80px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[150px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[120px]" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Erro ao carregar grupos: {error}
                  </TableCell>
                </TableRow>
              ) : filteredGroups?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    {hasActiveFilters ? 'Nenhum grupo encontrado com os filtros aplicados.' : 'Nenhum grupo encontrado.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredGroups?.map((group) => (
                  <TableRow key={group.id_grupo}>
                    <TableCell className="font-medium">{group.id_grupo}</TableCell>
                    <TableCell>{group.nome_grupo}</TableCell>
                    <TableCell>{group.filial}</TableCell>
                    <TableCell>{group.cod}</TableCell>
                    <TableCell>{group.member_count}</TableCell>
                    <TableCell>
                      {group.vendor_names && group.vendor_names.length > 0 
                        ? group.vendor_names.join(', ') 
                        : 'Nenhum vendedor'
                      }
                    </TableCell>
                    <TableCell>
                      {group.group_vendor_name || 'Não definido'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleManageGroup(group)}>
                            <Settings className="mr-2 h-4 w-4" />
                            Editar grupo
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewGroupUnits(group)}>
                            Ver Membros
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditGroupName(group)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar nome
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSuggestName(group)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Sugerir nome (IA)
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteGroup(group)}>
                            <Trash className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modals and Drawers */}
      <ClientGroupUnitsModal
        isOpen={showUnitsModal}
        onClose={() => setShowUnitsModal(false)}
        group={selectedGroup}
        onViewRecord={() => {
          // Handle view record action
        }}
      />

      <Dialog open={showUpdateModal} onOpenChange={handleCloseUpdateModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Nome do Grupo</DialogTitle>
            <DialogDescription>
              Altere o nome do grupo econômico.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSaveGroupName}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Criar Novo Grupo</DrawerTitle>
            <DrawerDescription>
              Crie um novo grupo econômico de clientes.
            </DrawerDescription>
          </DrawerHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-4 px-4">
                <FormField
                  control={form.control}
                  name="groupName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Grupo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do grupo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DrawerFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      Criando...
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    "Criar Grupo"
                  )}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          </Form>
        </DrawerContent>
      </Drawer>

      <LeadCreateModal 
        isOpen={isLeadsModalOpen} 
        onClose={handleCloseLeadsModal} 
        tableId={null} 
      />
    </div>
  );
}

export default SalesClientGroups;
