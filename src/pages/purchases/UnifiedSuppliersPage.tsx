import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Trash, Plus, Wand2, Edit, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react"
import { ProtheusTableToolbar } from "@/components/ProtheusTableToolbar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton"
import { useUnifiedSuppliers, type UnifiedSupplier } from '@/hooks/useUnifiedSuppliers';
import { usePotentialSuppliers } from '@/hooks/usePotentialSuppliers';
import { useMaterialTypes } from '@/hooks/useMaterialTypes';
import { useSupplierCounts } from '@/hooks/useSupplierCounts';
import { RepresentativeSelector } from '@/components/RepresentativeSelector';
import { BuyerSelector } from '@/components/BuyerSelector';
import { TagInput } from '@/components/TagInput';
import { EmailTag } from '@/hooks/useEmailTags';
import { CitySelector } from '@/components/CitySelector';
import { MissingSuppliersModal } from '@/components/MissingSuppliersModal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Schema de validação
const createSupplierSchema = z.object({
  status: z.enum(['potential_only', 'supplier', 'potential_and_supplier', 'archived']).default('potential_only'),
  cnpj: z.string().optional(),
  potential_supplier_id: z.string().optional(),
  protheus_filial: z.string().optional(),
  protheus_cod: z.string().optional(),
  protheus_loja: z.string().optional(),
  attendance_type: z.enum(['direct', 'representative']).default('direct'),
  representative_id: z.string().optional(),
  assigned_buyer_cod: z.string().optional(),
  assigned_buyer_filial: z.string().optional(),
  material_types: z.array(z.string()).optional(),
  tags: z.array(z.object({ id: z.string(), name: z.string() })).transform(val => val as EmailTag[]).default([]),
  // Campos do potencial fornecedor para edição
  potential_trade_name: z.string().optional(),
  potential_legal_name: z.string().optional(),
  potential_cnpj: z.string().optional(),
  potential_website: z.string().optional(),
  potential_city_id: z.string().optional(),
}).refine((data) => {
  // Se tipo de atendimento for por representante, deve ter representante
  if (data.attendance_type === 'representative' && !data.representative_id) {
    return false;
  }
  return true;
}, {
  message: "Selecione um representante comercial quando o tipo de atendimento for 'Por Representante'",
  path: ["representative_id"],
}).refine((data) => {
  // Se algum campo do Protheus for preenchido, todos devem ser preenchidos
  const protheusFilled = [data.protheus_filial, data.protheus_cod, data.protheus_loja].filter(Boolean).length;
  return protheusFilled === 0 || protheusFilled === 3;
}, {
  message: "Se preencher dados do Protheus, todos os campos (Filial, Cod, Loja) são obrigatórios",
  path: ["protheus_filial"],
}).refine((data) => {
  // Pelo menos um vínculo deve ser preenchido
  return data.potential_supplier_id || (data.protheus_filial && data.protheus_cod && data.protheus_loja);
}, {
  message: "Informe pelo menos um Potencial Fornecedor ou dados do Protheus",
  path: ["potential_supplier_id"],
});

type CreateSupplierFormData = z.infer<typeof createSupplierSchema>;

export default function UnifiedSuppliersPage() {
  const { 
    suppliers, 
    totalCount,
    totalPages,
    currentPage,
    loading,
    fetchSuppliers,
    createSupplier, 
    updateSupplier, 
    deleteSupplier,
    createMissingSuppliers,
    getSupplierByFuId
  } = useUnifiedSuppliers(false); // Disable auto-fetch
  
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const { listQuery, updateMutation: updatePotentialSupplier } = usePotentialSuppliers();
  const potentialSuppliers = listQuery.data || [];
  
  const { materialTypes } = useMaterialTypes();
  const { counts, loading: countsLoading, refetch: refetchCounts } = useSupplierCounts();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  
  // Check for forced filter from URL (with backward compatibility)
  const withoutGroupParam = searchParams.get('without_group');
  const filterParam = searchParams.get('filter');
  const forcedWithoutGroup = ['1', 'true'].includes(withoutGroupParam || '') || filterParam === 'without_group';
  
  // Handle backward compatibility: replace old filter param with new one
  useEffect(() => {
    if (filterParam === 'without_group' && !withoutGroupParam) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('filter');
      newParams.set('without_group', '1');
      setSearchParams(newParams, { replace: true });
    }
  }, [filterParam, withoutGroupParam, searchParams, setSearchParams]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof UnifiedSupplier | 'display_name' | 'protheus_key' | 'material_types_display';
    direction: 'asc' | 'desc' | null;
  }>({ key: 'fu_id', direction: null });
  const [pageSize] = useState(50);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<UnifiedSupplier | null>(null);
  const [isCreatingMissing, setIsCreatingMissing] = useState(false);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateSupplierFormData>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      status: 'potential_only',
      attendance_type: 'direct',
      material_types: [],
      tags: [],
      potential_trade_name: '',
      potential_legal_name: '',
      potential_cnpj: '',
      potential_website: '',
      potential_city_id: '',
    }
  });

  // useEffect para atualizar campos do potencial quando potential_supplier_id mudar
  useEffect(() => {
    const potentialSupplierId = form.watch('potential_supplier_id');
    const protheusFilled = form.watch('protheus_filial') && form.watch('protheus_cod') && form.watch('protheus_loja');
    
    if (potentialSupplierId && !protheusFilled) {
      const potentialSupplier = potentialSuppliers.find(p => p.id === potentialSupplierId);
      if (potentialSupplier) {
        form.setValue('potential_trade_name', potentialSupplier.trade_name || '');
        form.setValue('potential_legal_name', potentialSupplier.legal_name || '');
        form.setValue('potential_cnpj', potentialSupplier.cnpj || '');
        form.setValue('potential_website', potentialSupplier.website || '');
        form.setValue('potential_city_id', potentialSupplier.city_id || '');
      }
    }
  }, [form.watch('potential_supplier_id'), form.watch('protheus_filial'), form.watch('protheus_cod'), form.watch('protheus_loja'), potentialSuppliers, form]);

  // useEffect para abrir modal automaticamente quando há parâmetro edit na URL
  useEffect(() => {
    const editParam = searchParams.get('edit');
    if (editParam && !editingSupplier && !showCreateDialog) {
      console.log('🔍 Auto-opening edit modal for FU_ID:', editParam);
      
      getSupplierByFuId(editParam).then(supplier => {
        if (supplier) {
          openEditDialog(supplier);
          // Remover o parâmetro da URL após abrir o modal
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('edit');
          setSearchParams(newParams, { replace: true });
        } else {
          toast({
            title: "Fornecedor não encontrado",
            description: `Não foi possível encontrar o fornecedor ${editParam}`,
            variant: "destructive"
          });
          // Remover o parâmetro da URL mesmo se não encontrou
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('edit');
          setSearchParams(newParams, { replace: true });
        }
      }).catch(error => {
        console.error('Error auto-opening edit modal:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar fornecedor para edição",
          variant: "destructive"
        });
        // Remover o parâmetro da URL em caso de erro
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('edit');
        setSearchParams(newParams, { replace: true });
      });
    }
  }, [searchParams, editingSupplier, showCreateDialog, getSupplierByFuId, toast, setSearchParams]);

  // Sync forcedWithoutGroup with columnFilters
  useEffect(() => {
    if (forcedWithoutGroup) {
      setColumnFilters(prev => ({ ...prev, without_group: '1' }));
    }
  }, [forcedWithoutGroup]);

  // Initial fetch with filter applied if needed
  useEffect(() => {
    const filters = { ...columnFilters, ...(forcedWithoutGroup ? { without_group: '1' } : {}) };
    fetchSuppliers({ 
      search: searchTerm, 
      filters, 
      sortBy: sortConfig.key === 'protheus_key' ? 'protheus_filial' : sortConfig.key,
      sortDirection: sortConfig.direction || 'desc',
      page: 1,
      pageSize 
    });
  }, [forcedWithoutGroup]); // React to forcedWithoutGroup changes

  // Helper para formatar CNPJ
  const formatCnpj = (cnpj: string | undefined) => {
    if (!cnpj) return '-';
    const digits = cnpj.replace(/[^0-9]/g, '');
    if (digits.length === 14) {
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return cnpj;
  };

  // Helper para obter CNPJ (unificado ou Protheus)
  const getCnpj = (supplier: UnifiedSupplier) => {
    return supplier.cnpj || supplier.protheus_supplier?.a2_cgc;
  };

  const getSupplierDisplayNames = (supplier: UnifiedSupplier) => {
    let tradeName = '';
    let legalName = '';

    if (supplier.potential_supplier) {
      tradeName = supplier.potential_supplier.trade_name || '';
      legalName = supplier.potential_supplier.legal_name || '';
    }

    if (supplier.protheus_supplier) {
      // Se não temos nome de potencial, usar do Protheus
      if (!tradeName) {
        tradeName = supplier.protheus_supplier.a2_nreduz || supplier.protheus_supplier.a2_nome || '';
        legalName = supplier.protheus_supplier.a2_nome || '';
      }
    }

    // Fallback para FU_ID se não temos nenhum nome
    if (!tradeName) {
      tradeName = `Fornecedor ${supplier.fu_id}`;
    }

    return { tradeName, legalName };
  };

  const handleRefresh = useCallback(() => {
    const filters = { ...columnFilters, ...(forcedWithoutGroup ? { without_group: '1' } : {}) };
    fetchSuppliers({ 
      search: searchTerm, 
      filters, 
      sortBy: sortConfig.key === 'protheus_key' ? 'protheus_filial' : sortConfig.key,
      sortDirection: sortConfig.direction || 'desc',
      page: currentPage,
      pageSize 
    });
    refetchCounts();
  }, [fetchSuppliers, searchTerm, columnFilters, sortConfig, currentPage, pageSize, refetchCounts, forcedWithoutGroup]);

  const handleSearch = useCallback((search: string) => {
    setSearchTerm(search);
    const filters = { ...columnFilters, ...(forcedWithoutGroup ? { without_group: '1' } : {}) };
    fetchSuppliers({ 
      search, 
      filters, 
      sortBy: sortConfig.key === 'protheus_key' ? 'protheus_filial' : sortConfig.key,
      sortDirection: sortConfig.direction || 'desc',
      page: 1,
      pageSize 
    });
  }, [fetchSuppliers, columnFilters, sortConfig, pageSize, forcedWithoutGroup]);

  const handleFilterChange = useCallback((newFilters: Record<string, string>) => {
    setColumnFilters(newFilters);
    const filters = { ...newFilters, ...(forcedWithoutGroup ? { without_group: '1' } : {}) };
    fetchSuppliers({ 
      search: searchTerm, 
      filters, 
      sortBy: sortConfig.key === 'protheus_key' ? 'protheus_filial' : sortConfig.key,
      sortDirection: sortConfig.direction || 'desc',
      page: 1,
      pageSize 
    });
  }, [fetchSuppliers, searchTerm, sortConfig, pageSize, forcedWithoutGroup]);

  const handlePageChange = useCallback((page: number) => {
    const filters = { ...columnFilters, ...(forcedWithoutGroup ? { without_group: '1' } : {}) };
    fetchSuppliers({ 
      search: searchTerm, 
      filters, 
      sortBy: sortConfig.key === 'protheus_key' ? 'protheus_filial' : sortConfig.key,
      sortDirection: sortConfig.direction || 'desc',
      page,
      pageSize 
    });
  }, [fetchSuppliers, searchTerm, columnFilters, sortConfig, pageSize, forcedWithoutGroup]);

  const handleSort = (key: keyof UnifiedSupplier | 'display_name' | 'protheus_key' | 'material_types_display') => {
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      } else {
        direction = 'asc';
      }
    }
    
    setSortConfig({ key, direction });
    
    const filters = { ...columnFilters, ...(forcedWithoutGroup ? { without_group: '1' } : {}) };
    fetchSuppliers({ 
      search: searchTerm, 
      filters, 
      sortBy: key === 'protheus_key' ? 'protheus_filial' : key,
      sortDirection: direction || 'desc',
      page: 1,
      pageSize 
    });
  };

  const getSortIcon = (columnKey: keyof UnifiedSupplier | 'display_name' | 'protheus_key' | 'material_types_display') => {
    if (sortConfig.key !== columnKey) return ArrowUpDown;
    if (sortConfig.direction === 'asc') return ArrowUp;
    if (sortConfig.direction === 'desc') return ArrowDown;
    return ArrowUpDown;
  };

  // Como agora o backend faz filtro e ordenação, apenas mostramos os suppliers retornados
  const filteredAndSortedSuppliers = suppliers;

  const handleDeleteSupplier = async (id: string) => {
    try {
      await deleteSupplier(id);
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
    }
  };

  const handleCreateSupplier = async (data: CreateSupplierFormData) => {
    try {      
      const { tags, potential_trade_name, potential_legal_name, potential_cnpj, potential_website, potential_city_id, ...supplierDataWithoutTags } = data;
      const supplierData = {
        ...supplierDataWithoutTags,
        tag_ids: tags?.map(tag => tag.id) || []
      };
      
      await createSupplier(supplierData);
      
      // Se há potential_supplier_id e dados do Protheus não estão completos, atualizar o potencial
      const hasProtheusData = data.protheus_filial && data.protheus_cod && data.protheus_loja;
      if (data.potential_supplier_id && !hasProtheusData) {
        const currentPotential = potentialSuppliers.find(p => p.id === data.potential_supplier_id);
        if (currentPotential) {
          const potentialUpdates: any = {};
          
          if (potential_trade_name !== undefined && potential_trade_name !== currentPotential.trade_name) {
            potentialUpdates.trade_name = potential_trade_name;
          }
          if (potential_legal_name !== undefined && potential_legal_name !== currentPotential.legal_name) {
            potentialUpdates.legal_name = potential_legal_name;
          }
          if (potential_cnpj !== undefined && potential_cnpj !== currentPotential.cnpj) {
            potentialUpdates.cnpj = potential_cnpj;
          }
          if (potential_website !== undefined && potential_website !== currentPotential.website) {
            potentialUpdates.website = potential_website;
          }
          if (potential_city_id !== undefined && potential_city_id !== currentPotential.city_id) {
            potentialUpdates.city_id = potential_city_id || null;
          }
          
          if (Object.keys(potentialUpdates).length > 0) {
            await updatePotentialSupplier.mutateAsync({
              id: data.potential_supplier_id,
              data: potentialUpdates
            });
          }
        }
      }
      
      setShowCreateDialog(false);
      form.reset();
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
    }
  };

  const handleEditSupplier = async (data: CreateSupplierFormData) => {
    if (!editingSupplier) return;
    
    try {
      console.log('🔄 Starting supplier edit process...');
      console.log('📝 Form data received:', data);
      console.log('📋 Original supplier data:', editingSupplier);
      
      // Calcular diff: enviar apenas campos que mudaram
      const { tags, potential_trade_name, potential_legal_name, potential_cnpj, potential_website, potential_city_id, ...formDataWithoutTags } = data;
      const originalTags = editingSupplier.tags || [];
      const newTagIds = tags?.map(tag => tag.id) || [];
      
      // Comparar cada campo para criar update mínimo
      const changedFields: any = {};
      
      // Verificar campos simples
      const fieldsToCheck = [
        'status', 'cnpj', 'potential_supplier_id', 'protheus_filial', 
        'protheus_cod', 'protheus_loja', 'attendance_type', 'representative_id',
        'assigned_buyer_cod', 'assigned_buyer_filial'
      ] as const;
      
      fieldsToCheck.forEach(field => {
        const originalValue = editingSupplier[field] || '';
        const newValue = formDataWithoutTags[field] || '';
        if (originalValue !== newValue) {
          changedFields[field] = formDataWithoutTags[field];
        }
      });
      
      // Verificar material_types
      const originalMaterialTypes = editingSupplier.material_types?.map(mt => mt.id) || [];
      const newMaterialTypes = formDataWithoutTags.material_types || [];
      const materialTypesChanged = JSON.stringify(originalMaterialTypes.sort()) !== JSON.stringify(newMaterialTypes.sort());
      if (materialTypesChanged) {
        changedFields.material_types = newMaterialTypes;
      }
      
      // Verificar tags
      const originalTagIds = originalTags.map(tag => tag.id).sort();
      const tagsChanged = JSON.stringify(originalTagIds) !== JSON.stringify(newTagIds.sort());
      if (tagsChanged) {
        changedFields.tag_ids = newTagIds;
      }
      
      // Verificar se há mudanças nos dados do potencial fornecedor
      const hasProtheusData = data.protheus_filial && data.protheus_cod && data.protheus_loja;
      let potentialChanges = false;
      
      if (data.potential_supplier_id && !hasProtheusData) {
        const currentPotential = potentialSuppliers.find(p => p.id === data.potential_supplier_id);
        if (currentPotential) {
          const potentialUpdates: any = {};
          
          if (potential_trade_name !== undefined && potential_trade_name !== currentPotential.trade_name) {
            potentialUpdates.trade_name = potential_trade_name;
            potentialChanges = true;
          }
          if (potential_legal_name !== undefined && potential_legal_name !== currentPotential.legal_name) {
            potentialUpdates.legal_name = potential_legal_name;
            potentialChanges = true;
          }
          if (potential_cnpj !== undefined && potential_cnpj !== currentPotential.cnpj) {
            potentialUpdates.cnpj = potential_cnpj;
            potentialChanges = true;
          }
          if (potential_website !== undefined && potential_website !== currentPotential.website) {
            potentialUpdates.website = potential_website;
            potentialChanges = true;
          }
          if (potential_city_id !== undefined && potential_city_id !== currentPotential.city_id) {
            potentialUpdates.city_id = potential_city_id || null;
            potentialChanges = true;
          }
          
          if (potentialChanges) {
            await updatePotentialSupplier.mutateAsync({
              id: data.potential_supplier_id,
              data: potentialUpdates
            });
          }
        }
      }
      
      if (Object.keys(changedFields).length === 0 && !potentialChanges) {
        console.log('ℹ️ No changes detected, skipping update');
        setEditingSupplier(null);
        setShowCreateDialog(false);
        form.reset();
        return;
      }
      
      console.log('📤 Sending only changed fields:', changedFields);
      
      if (Object.keys(changedFields).length > 0) {
        await updateSupplier(editingSupplier.id, changedFields);
      }
      
      setEditingSupplier(null);
      setShowCreateDialog(false);
      form.reset();
      
      // Verificar se deve retornar ao modal do grupo econômico
      const returnToGroupId = sessionStorage.getItem('returnToGroupEdit');
      if (returnToGroupId) {
        sessionStorage.removeItem('returnToGroupEdit');
        sessionStorage.setItem('reopenGroupModal', returnToGroupId);
        navigate('/compras/grupos-economicos');
      }
      
      console.log('✅ Supplier edit completed successfully');
    } catch (error) {
      console.error('❌ Frontend error during supplier edit:', error);
      
      // Exibir detalhes completos do erro no toast
      let errorMessage = 'Erro desconhecido ao editar fornecedor';
      let errorDetails = '';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        if ('code' in error) errorDetails += ` (Código: ${(error as any).code})`;
        if ('hint' in error) errorDetails += ` Dica: ${(error as any).hint}`;
        if ('details' in error) errorDetails += ` Detalhes: ${(error as any).details}`;
      }
      
      toast({
        title: "Erro ao Editar Fornecedor",
        description: `${errorMessage}${errorDetails}`,
        variant: "destructive"
      });
    }
  };

  const handleCreateMissing = async () => {
    try {
      setIsCreatingMissing(true);
      const result = await createMissingSuppliers() as any;
      if (result?.success) {
        toast({
          title: "Fornecedores criados!",
          description: `${result.created_count} fornecedores unificados criados com status "Apenas Potencial". Configure os tipos de materiais e grupos econômicos conforme necessário.`,
        });
        const filters = { ...columnFilters, ...(forcedWithoutGroup ? { without_group: '1' } : {}) };
        await fetchSuppliers({ 
          search: searchTerm, 
          filters, 
          sortBy: sortConfig.key === 'protheus_key' ? 'protheus_filial' : sortConfig.key,
          sortDirection: sortConfig.direction || 'desc',
          page: currentPage,
          pageSize 
        });
        refetchCounts();
      }
    } catch (error) {
      console.error('Erro ao criar fornecedores faltantes:', error);
    } finally {
      setIsCreatingMissing(false);
    }
  };

  const getStatusBadgeVariant = (status: UnifiedSupplier['status']) => {
    switch (status) {
      case 'potential_only':
        return 'secondary';
      case 'supplier':
        return 'default';
      case 'potential_and_supplier':
        return 'success';
      case 'archived':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: UnifiedSupplier['status']) => {
    switch (status) {
      case 'potential_only':
        return 'Apenas Potencial';
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

  const openEditDialog = (supplier: UnifiedSupplier) => {
    setEditingSupplier(supplier);
    
    // Se tem potential_supplier_id e não tem dados completos do Protheus, carregar dados do potencial
    const potentialSupplier = supplier.potential_supplier_id ? 
      potentialSuppliers.find(p => p.id === supplier.potential_supplier_id) : null;
    
    // Preencher form com dados do fornecedor
    form.reset({
      status: supplier.status || 'potential_only',
      cnpj: supplier.cnpj || '',
      potential_supplier_id: supplier.potential_supplier_id || '',
      protheus_filial: supplier.protheus_filial || '',
      protheus_cod: supplier.protheus_cod || '',
      protheus_loja: supplier.protheus_loja || '',
      attendance_type: supplier.attendance_type,
      representative_id: supplier.representative_id || '',
      assigned_buyer_cod: supplier.assigned_buyer_cod || '',
      assigned_buyer_filial: supplier.assigned_buyer_filial || '',
      material_types: supplier.material_types?.map(mt => mt.id) || [],
      tags: supplier.tags || [],
      // Dados do potencial fornecedor para edição
      potential_trade_name: potentialSupplier?.trade_name || '',
      potential_legal_name: potentialSupplier?.legal_name || '',
      potential_cnpj: potentialSupplier?.cnpj || '',
      potential_website: potentialSupplier?.website || '',
      potential_city_id: potentialSupplier?.city_id || '',
    });
  };

  // Remove MaterialSupplyType references - this will be updated in a future task to use dynamic material types

  if (loading && suppliers.length === 0) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Fornecedores Unificados</h1>
            <p className="text-muted-foreground">
              Gerencie todos os fornecedores em uma visão unificada - {totalCount} fornecedores encontrados
            </p>
            {forcedWithoutGroup && (
              <Badge variant="secondary" className="mt-2 gap-1">
                Exibindo apenas fornecedores sem grupo econômico
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('without_group');
                    setSearchParams(newParams, { replace: true });
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleCreateMissing}
              disabled={isCreatingMissing}
              variant="outline"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {isCreatingMissing ? 'Criando...' : 'Criar Faltantes'}
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Fornecedor
            </Button>
          </div>
        </div>
      </div>

      {/* Totalizadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Fornecedores Unificados
                </p>
                <div className="text-2xl font-bold">
                  {countsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    counts.unified !== null ? counts.unified.toLocaleString() : '—'
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Potenciais Fornecedores
                </p>
                <div className="text-2xl font-bold">
                  {countsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    counts.potential !== null ? counts.potential.toLocaleString() : '—'
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Fornecedores Protheus
                </p>
                <div className="text-2xl font-bold">
                  {countsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    counts.protheus !== null ? counts.protheus.toLocaleString() : '—'
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Unificados Faltantes
                </p>
                <div className="text-2xl font-bold text-orange-600">
                  {countsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    counts.missing !== null ? counts.missing.toLocaleString() : '—'
                  )}
                </div>
              </div>
              {!countsLoading && counts.missing !== null && counts.missing > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMissingModal(true)}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  Ver Faltantes
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

          <ProtheusTableToolbar
            searchTerm={searchTerm}
            onSearchChange={handleSearch}
            onRefresh={handleRefresh}
            columnFilters={columnFilters}
            onColumnFiltersChange={handleFilterChange}
            filterFields={[
              { key: 'fu_id', label: 'ID' },
              { key: 'display_name', label: 'Nome' },
              { key: 'status', label: 'Status' },
              { key: 'cnpj', label: 'CNPJ' },
              { key: 'protheus_key', label: 'Protheus (Filial/Cod/Loja)' },
              { key: 'material_types', label: 'Tipos de Material' }
            ]}
          />
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('fu_id')}
                >
                  <div className="flex items-center gap-2">
                    ID
                    {(() => {
                      const SortIcon = getSortIcon('fu_id');
                      return <SortIcon className="w-4 h-4" />;
                    })()}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('display_name')}
                >
                  <div className="flex items-center gap-2">
                    Nome
                    {(() => {
                      const SortIcon = getSortIcon('display_name');
                      return <SortIcon className="w-4 h-4" />;
                    })()}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {(() => {
                      const SortIcon = getSortIcon('status');
                      return <SortIcon className="w-4 h-4" />;
                    })()}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('cnpj')}
                >
                  <div className="flex items-center gap-2">
                    CNPJ
                    {(() => {
                      const SortIcon = getSortIcon('cnpj');
                      return <SortIcon className="w-4 h-4" />;
                    })()}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('protheus_key')}
                >
                  <div className="flex items-center gap-2">
                    Protheus
                    {(() => {
                      const SortIcon = getSortIcon('protheus_key');
                      return <SortIcon className="w-4 h-4" />;
                    })()}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('material_types_display')}
                >
                  <div className="flex items-center gap-2">
                    Tipos de Material
                    {(() => {
                      const SortIcon = getSortIcon('material_types_display');
                      return <SortIcon className="w-4 h-4" />;
                    })()}
                  </div>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedSuppliers.length > 0 ? (
                filteredAndSortedSuppliers.map((supplier) => {
                  const { tradeName, legalName } = getSupplierDisplayNames(supplier);
                  return (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium text-muted-foreground">
                        {supplier.fu_id}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {tradeName}
                          </div>
                          {legalName && legalName !== tradeName && (
                            <div className="text-sm text-muted-foreground">
                              {legalName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(supplier.status) as any}>
                        {getStatusLabel(supplier.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCnpj(getCnpj(supplier))}</TableCell>
                    <TableCell>
                      {supplier.protheus_cod ? (
                        <span className="text-sm">
                          {supplier.protheus_filial}/{supplier.protheus_cod}/{supplier.protheus_loja}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {supplier.material_types?.slice(0, 2).map((mt) => (
                          <Badge key={mt.id} variant="outline" className="text-xs">
                            {mt.material_type.replace('_', ' ')}
                          </Badge>
                        ))}
                        {supplier.material_types && supplier.material_types.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{supplier.material_types.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEditDialog(supplier)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteSupplier(supplier.id)}
                            className="text-destructive"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum fornecedor encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages} ({totalCount} fornecedores)
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  Primeira
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Última
                </Button>
              </div>
            </div>
          )}

      {/* Dialog de criação/edição */}
      <Dialog open={showCreateDialog || editingSupplier !== null} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingSupplier(null);
          form.reset();
          
          // Verificar se deve retornar ao modal do grupo econômico
          const returnToGroupId = sessionStorage.getItem('returnToGroupEdit');
          if (returnToGroupId) {
            sessionStorage.removeItem('returnToGroupEdit');
            sessionStorage.setItem('reopenGroupModal', returnToGroupId);
            navigate('/compras/grupos-economicos');
          }
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? 'Editar Fornecedor Unificado' : 'Adicionar Fornecedor Unificado'}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier 
                ? 'Edite as informações do fornecedor unificado' 
                : 'Vincule um potencial fornecedor e/ou dados do Protheus'
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(editingSupplier ? handleEditSupplier : handleCreateSupplier)} className="space-y-4">
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="potential_only">Apenas Potencial</SelectItem>
                        <SelectItem value="supplier">Apenas Fornecedor</SelectItem>
                        <SelectItem value="potential_and_supplier">Potencial e Fornecedor</SelectItem>
                        <SelectItem value="archived">Arquivado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CNPJ */}
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

              {/* Potencial Fornecedor */}
              <FormField
                control={form.control}
                name="potential_supplier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Potencial Fornecedor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um potencial fornecedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {potentialSuppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.trade_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
               />

              {/* Seção de Dados do Potencial Fornecedor */}
              {form.watch('potential_supplier_id') && 
               !form.watch('protheus_filial') && 
               !form.watch('protheus_cod') && 
               !form.watch('protheus_loja') && (
                <div className="border rounded-lg p-4 space-y-4 bg-muted/10">
                  <h3 className="text-sm font-medium text-foreground">Dados do Potencial Fornecedor</h3>
                  <p className="text-xs text-muted-foreground">
                    Edite os dados do potencial fornecedor selecionado. As alterações serão salvas no registro do potencial.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="potential_trade_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Fantasia</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome fantasia" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="potential_legal_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Razão Social</FormLabel>
                          <FormControl>
                            <Input placeholder="Razão social" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="potential_cnpj"
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
                      name="potential_website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="potential_city_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <CitySelector
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Selecione uma cidade"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Dados Protheus */}
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="protheus_filial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Filial Protheus</FormLabel>
                      <FormControl>
                        <Input placeholder="01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="protheus_cod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código Protheus</FormLabel>
                      <FormControl>
                        <Input placeholder="000001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="protheus_loja"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loja Protheus</FormLabel>
                      <FormControl>
                        <Input placeholder="01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tipo de Atendimento */}
              <FormField
                control={form.control}
                name="attendance_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Atendimento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="direct">Direto</SelectItem>
                        <SelectItem value="representative">Por Representante</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Representante (se aplicável) */}
              {form.watch('attendance_type') === 'representative' && (
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

              {/* Comprador Designado */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="assigned_buyer_cod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código do Comprador</FormLabel>
                      <FormControl>
                        <BuyerSelector
                          codeName="assigned_buyer_cod"
                          filialName="assigned_buyer_filial"
                          placeholder="Selecione um comprador"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assigned_buyer_filial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Filial do Comprador</FormLabel>
                      <FormControl>
                        <Input placeholder="Filial será preenchida automaticamente" {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tipos de Material */}
              <FormField
                control={form.control}
                name="material_types"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipos de Material</FormLabel>
                    <div className="space-y-2">
                      {materialTypes.map((materialType) => (
                        <div key={materialType.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`material-type-${materialType.id}`}
                            checked={field.value?.includes(materialType.id) || false}
                            onCheckedChange={(checked) => {
                              const currentValue = field.value || [];
                              if (checked) {
                                field.onChange([...currentValue, materialType.id]);
                              } else {
                                field.onChange(currentValue.filter(id => id !== materialType.id));
                              }
                            }}
                          />
                          <Label 
                            htmlFor={`material-type-${materialType.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: materialType.color }}
                              />
                              {materialType.name}
                            </div>
                          </Label>
                        </div>
                      ))}
                      {materialTypes.length === 0 && (
                        <div className="text-sm text-muted-foreground">
                          Nenhum tipo de material cadastrado. Configure em Compras &gt; Tipos de Materiais.
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags */}
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <TagInput
                        selectedTags={field.value || []}
                        onTagsChange={field.onChange}
                        placeholder="Adicione tags para organizar"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setShowCreateDialog(false);
                  setEditingSupplier(null);
                  form.reset();
                  
                  // Verificar se deve retornar ao modal do grupo econômico
                  const returnToGroupId = sessionStorage.getItem('returnToGroupEdit');
                  if (returnToGroupId) {
                    sessionStorage.removeItem('returnToGroupEdit');
                    sessionStorage.setItem('reopenGroupModal', returnToGroupId);
                    navigate('/compras/grupos-economicos');
                  }
                }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {editingSupplier ? 'Salvar Alterações' : 'Criar Fornecedor'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
        </Dialog>

        {/* Modal de Fornecedores Faltantes */}
        <MissingSuppliersModal
          open={showMissingModal}
          onOpenChange={setShowMissingModal}
        />
      </div>
    );
  }