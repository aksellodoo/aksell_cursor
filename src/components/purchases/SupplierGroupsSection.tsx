import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { MoreVertical, RefreshCw, Loader2, Plus, Layers, Users, AlertTriangle, Search, X, Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton"
import { usePurchasesEconomicGroups, PurchasesEconomicGroup } from '@/hooks/usePurchasesEconomicGroups';
import { PurchasesGroupMembersModal } from './PurchasesGroupMembersModal';
import { supabase } from "@/integrations/supabase/client";

export function SupplierGroupsSection() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PurchasesEconomicGroup | null>(null);
  const [totalUnifiedSuppliers, setTotalUnifiedSuppliers] = useState<number | null>(null);
  const [missingCount, setMissingCount] = useState<number>(0);
  const [loadingTotalizers, setLoadingTotalizers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingMissingGroups, setIsCreatingMissingGroups] = useState(false);
  
  // Sorting state
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
  // Filtering state
  const [filters, setFilters] = useState({
    code: '',
    name: '',
    proteusFilial: '',
    proteusCod: '',
    memberCountMin: '',
    memberCountMax: '',
    groupBuyer: '',
    memberBuyers: [] as string[],
    materialTypes: [] as string[]
  });
  
  const {
    groups: allGroups,
    loading,
    error,
    totalCount,
    currentPage,
    pageSize,
    refreshGroups,
    createGroup,
    deleteGroup,
    fetchTotalGroupsCount,
    setPageSize
  } = usePurchasesEconomicGroups();

  const fetchTotalUnifiedSuppliers = async () => {
    try {
      const { count, error } = await supabase
        .from('purchases_unified_suppliers')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error fetching total unified suppliers:', error);
        setTotalUnifiedSuppliers(null);
      } else {
        setTotalUnifiedSuppliers(count || 0);
      }
    } catch (error) {
      console.error('Error fetching total unified suppliers:', error);
      setTotalUnifiedSuppliers(null);
    }
  };

  const fetchMissingCount = async () => {
    try {
      const { data, error } = await supabase.rpc('count_unified_suppliers_without_group');
      
      if (error) {
        console.error('Error fetching missing count:', error);
        setMissingCount(0);
      } else {
        setMissingCount(data || 0);
      }
    } catch (error) {
      console.error('Error fetching missing count:', error);
      setMissingCount(0);
    }
  };

  const handleRefreshGroups = async () => {
    try {
      setLoadingTotalizers(true);
      await Promise.all([
        refreshGroups(),
        fetchTotalUnifiedSuppliers(),
        fetchMissingCount()
      ]);
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
    } finally {
      setLoadingTotalizers(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Sorting handlers
  const handleSort = (key: string) => {
    const newDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDir(newDir);
    // Refresh data with new sorting
    refreshGroups(1, searchTerm, key, newDir === 'asc' ? 'ASC' : 'DESC');
  };

  // Filter handlers
  const handleClearFilters = () => {
    setFilters({
      code: '',
      name: '',
      proteusFilial: '',
      proteusCod: '',
      memberCountMin: '',
      memberCountMax: '',
      groupBuyer: '',
      memberBuyers: [],
      materialTypes: []
    });
  };

  // Get unique values for filter options
  const uniqueBuyers = useMemo(() => {
    const buyers = new Set<string>();
    allGroups.forEach(group => {
      if (group.group_assigned_buyer_name) {
        buyers.add(group.group_assigned_buyer_name);
      }
      group.member_buyer_names?.forEach(buyer => buyers.add(buyer));
    });
    return Array.from(buyers).sort();
  }, [allGroups]);

  const uniqueMaterialTypes = useMemo(() => {
    const types = new Set<string>();
    allGroups.forEach(group => {
      group.material_type_names?.forEach(type => types.add(type));
    });
    return Array.from(types).sort();
  }, [allGroups]);

  // Apply filters (busca por texto já é feita no servidor via RPC)
  const displayedGroups = useMemo(() => {
    let filteredGroups = [...allGroups];

    // REMOVER filtro de busca local - agora feito no servidor
    // A busca por searchTerm já é processada pela RPC get_purchases_economic_groups_paginated

    // Apply only advanced filters (client-side)
    if (filters.code) {
      filteredGroups = filteredGroups.filter(g => 
        g.code?.toLowerCase().includes(filters.code.toLowerCase())
      );
    }
    if (filters.name) {
      filteredGroups = filteredGroups.filter(g => 
        g.name?.toLowerCase().includes(filters.name.toLowerCase())
      );
    }
    if (filters.proteusFilial) {
      filteredGroups = filteredGroups.filter(g => 
        g.protheus_filial?.toLowerCase().includes(filters.proteusFilial.toLowerCase())
      );
    }
    if (filters.proteusCod) {
      filteredGroups = filteredGroups.filter(g => 
        g.protheus_cod?.toLowerCase().includes(filters.proteusCod.toLowerCase())
      );
    }
    if (filters.memberCountMin) {
      const min = parseInt(filters.memberCountMin);
      if (!isNaN(min)) {
        filteredGroups = filteredGroups.filter(g => (g.member_count || 0) >= min);
      }
    }
    if (filters.memberCountMax) {
      const max = parseInt(filters.memberCountMax);
      if (!isNaN(max)) {
        filteredGroups = filteredGroups.filter(g => (g.member_count || 0) <= max);
      }
    }
    if (filters.groupBuyer) {
      filteredGroups = filteredGroups.filter(g => 
        g.group_assigned_buyer_name?.toLowerCase().includes(filters.groupBuyer.toLowerCase())
      );
    }
    if (filters.memberBuyers.length > 0) {
      filteredGroups = filteredGroups.filter(g => 
        g.member_buyer_names?.some(buyer => 
          filters.memberBuyers.some(filter => 
            buyer.toLowerCase().includes(filter.toLowerCase())
          )
        )
      );
    }
    if (filters.materialTypes.length > 0) {
      filteredGroups = filteredGroups.filter(g => 
        g.material_type_names?.some(type => 
          filters.materialTypes.some(filter => 
            type.toLowerCase().includes(filter.toLowerCase())
          )
        )
      );
    }

    // Apply sorting (client-side for now, could be server-side in future)
    if (sortKey) {
      filteredGroups.sort((a, b) => {
        let aVal: any = null;
        let bVal: any = null;

        switch (sortKey) {
          case 'code':
            aVal = a.code || '';
            bVal = b.code || '';
            break;
          case 'name':
            aVal = a.name || '';
            bVal = b.name || '';
            break;
          case 'member_count':
            aVal = a.member_count || 0;
            bVal = b.member_count || 0;
            break;
          case 'protheus_filial':
            aVal = a.protheus_filial || '';
            bVal = b.protheus_filial || '';
            break;
          case 'protheus_cod':
            aVal = a.protheus_cod || '';
            bVal = b.protheus_cod || '';
            break;
          case 'group_assigned_buyer_name':
            aVal = a.group_assigned_buyer_name || '';
            bVal = b.group_assigned_buyer_name || '';
            break;
          case 'member_buyer_names':
            aVal = a.member_buyer_names?.join(', ') || '';
            bVal = b.member_buyer_names?.join(', ') || '';
            break;
          case 'material_type_names':
            aVal = a.material_type_names?.join(', ') || '';
            bVal = b.material_type_names?.join(', ') || '';
            break;
          default:
            return 0;
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const strA = String(aVal).toLowerCase();
        const strB = String(bVal).toLowerCase();
        
        if (sortDir === 'asc') {
          return strA.localeCompare(strB);
        } else {
          return strB.localeCompare(strA);
        }
      });
    }

    return filteredGroups;
  }, [allGroups, filters, sortKey, sortDir]);

  const handleCreateGroup = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      const result = await createGroup(newGroupName.trim() || undefined);
      toast({ 
        title: "Sucesso", 
        description: `Grupo "${result.name}" criado com código ${result.code}`, 
        variant: "default" 
      });
      setNewGroupName('');
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating group:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao criar grupo", 
        variant: "destructive" 
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateMissingGroups = async () => {
    if (isCreatingMissingGroups) return;
    
    setIsCreatingMissingGroups(true);
    try {
      const { data, error } = await supabase.rpc('create_missing_purchases_groups');
      
      if (error) {
        throw error;
      }

      const result = data as {
        success: boolean;
        groups_created: number;
        group_sets_processed: number;
        suppliers_processed: number;
      };

      toast({ 
        title: "Sucesso", 
        description: `${result.groups_created} grupos criados, ${result.group_sets_processed} conjuntos processados, ${result.suppliers_processed} fornecedores vinculados`, 
        variant: "default" 
      });
      
      // Refresh data
      await Promise.all([
        refreshGroups(),
        fetchTotalUnifiedSuppliers(),
        fetchMissingCount()
      ]);
    } catch (error) {
      console.error('Error creating missing groups:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao criar grupos faltantes", 
        variant: "destructive" 
      });
    } finally {
      setIsCreatingMissingGroups(false);
    }
  };

  const handleViewMembers = useCallback((group: PurchasesEconomicGroup) => {
    setEditingGroup(group);
  }, []);

  const handleEditGroup = useCallback((group: PurchasesEconomicGroup) => {
    setEditingGroup(group);
  }, []);

  // Fetch initial data
  useEffect(() => {
    if (!loading) {
      Promise.all([
        fetchTotalUnifiedSuppliers(),
        fetchMissingCount()
      ]).finally(() => setLoadingTotalizers(false));
    }
  }, [loading]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateUrl(1, searchTerm, pageSize);
      refreshGroups(1, searchTerm, sortKey || 'name', sortDir === 'asc' ? 'ASC' : 'DESC');
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, sortKey, sortDir]);

  // Sync URL params with state
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    const size = parseInt(searchParams.get('size') || '25');
    const search = searchParams.get('search') || '';
    
    if (page !== currentPage || size !== pageSize || search !== searchTerm) {
      setSearchTerm(search);
      if (size !== pageSize && setPageSize) {
        setPageSize(size);
      }
      refreshGroups(page, search, sortKey || 'name', sortDir === 'asc' ? 'ASC' : 'DESC');
    }
  }, [searchParams]);

  // Update URL when state changes
  const updateUrl = useCallback((page: number, search: string, size: number) => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (search) params.set('search', search);
    if (size !== 25) params.set('size', size.toString());
    
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // Handle pagination
  const handlePageChange = (page: number) => {
    updateUrl(page, searchTerm, pageSize);
    refreshGroups(page, searchTerm, sortKey || 'name', sortDir === 'asc' ? 'ASC' : 'DESC');
  };

  // Handle page size change
  const handlePageSizeChange = (size: string) => {
    const newSize = parseInt(size);
    if (setPageSize) {
      setPageSize(newSize);
    }
    updateUrl(1, searchTerm, newSize);
    refreshGroups(1, searchTerm, sortKey || 'name', sortDir === 'asc' ? 'ASC' : 'DESC');
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    const maxVisible = 5;
    const halfMax = Math.floor(maxVisible / 2);
    
    let startPage = Math.max(1, currentPage - halfMax);
    let endPage = Math.min(totalPages, currentPage + halfMax);
    
    // Adjust if we're near the beginning or end
    if (currentPage <= halfMax) {
      endPage = Math.min(totalPages, maxVisible);
    } else if (currentPage > totalPages - halfMax) {
      startPage = Math.max(1, totalPages - maxVisible + 1);
    }
    
    // Add first page and ellipsis if needed
    if (startPage > 1) {
      items.push(1);
      if (startPage > 2) {
        items.push('ellipsis-start');
      }
    }
    
    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      items.push(i);
    }
    
    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push('ellipsis-end');
      }
      items.push(totalPages);
    }
    
    return items;
  };

  // Verificar se deve reabrir o modal do grupo automaticamente
  useEffect(() => {
    const reopenGroupId = sessionStorage.getItem('reopenGroupModal');
    if (reopenGroupId && allGroups.length > 0) {
      const groupToReopen = allGroups.find(g => g.id_grupo.toString() === reopenGroupId);
      if (groupToReopen) {
        setEditingGroup(groupToReopen);
        sessionStorage.removeItem('reopenGroupModal');
      }
    }
  }, [allGroups]);

  const handleDeleteGroup = useCallback(async (group: PurchasesEconomicGroup) => {
    if (window.confirm(`Tem certeza que deseja excluir o grupo "${group.name}"?`)) {
      try {
        await deleteGroup(group.id_grupo);
        toast({ 
          title: "Sucesso", 
          description: "Grupo excluído com sucesso", 
          variant: "default" 
        });
      } catch (error) {
        console.error('Error deleting group:', error);
        toast({ 
          title: "Erro", 
          description: "Erro ao excluir grupo", 
          variant: "destructive" 
        });
      }
    }
  }, [deleteGroup, toast]);

  // Calculate totals using correct values
  const totalGroups = totalCount || 0; // Use totalCount from hook, not filtered array length
  const totalMembers = totalUnifiedSuppliers !== null ? totalUnifiedSuppliers - missingCount : 0;
  const missingMembers = missingCount;

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grupos Econômicos de Fornecedores</CardTitle>
          <CardDescription>
            Erro ao carregar dados: {error}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Totalizers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Layers className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Grupos Econômicos
                </p>
                {loadingTotalizers || loading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{totalGroups}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Membros
                </p>
                {loadingTotalizers || loading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{totalMembers}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Membros Faltantes
                  </p>
                  {loadingTotalizers || loading ? (
                    <Skeleton className="h-7 w-12" />
                  ) : totalUnifiedSuppliers === null ? (
                    <p className="text-2xl font-bold">—</p>
                  ) : (
                    <p className="text-2xl font-bold">{missingMembers}</p>
                  )}
                </div>
              </div>
              {!loadingTotalizers && !loading && totalUnifiedSuppliers !== null && missingMembers > 0 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate('/compras/fornecedores-unificados?without_group=1')}
                  className="ml-2"
                >
                  Ver
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Grupos Econômicos de Fornecedores</CardTitle>
              <CardDescription>
                Crie e gerencie grupos econômicos de fornecedores unificados.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleCreateMissingGroups}
                disabled={isCreatingMissingGroups || loading}
                variant="outline"
                size="sm"
              >
                {isCreatingMissingGroups ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Layers className="mr-2 h-4 w-4" />
                )}
                Criar Grupos Faltantes
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Novo Grupo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Grupo Econômico</DialogTitle>
                    <DialogDescription>
                      Crie um novo grupo econômico de fornecedores. O código será gerado automaticamente.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="groupName" className="text-sm font-medium">
                        Nome do Grupo (opcional)
                      </label>
                      <Input
                        id="groupName"
                        placeholder="Digite o nome do grupo..."
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={isCreating}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateGroup}
                      disabled={isCreating}
                    >
                      {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Criar Grupo
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button 
                onClick={handleRefreshGroups}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Caixa de pesquisa e filtros */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Pesquisar por grupo, fornecedor, CNPJ, Protheus, comprador, cidade ou UF..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Filtros */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filtros Avançados</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        className="h-8 px-2"
                      >
                        Limpar
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="filter-code" className="text-sm">Código</Label>
                        <Input
                          id="filter-code"
                          placeholder="Código..."
                          value={filters.code}
                          onChange={(e) => setFilters(prev => ({ ...prev, code: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="filter-name" className="text-sm">Nome do Grupo</Label>
                        <Input
                          id="filter-name"
                          placeholder="Nome..."
                          value={filters.name}
                          onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="filter-proteus-filial" className="text-sm">Protheus Filial</Label>
                        <Input
                          id="filter-proteus-filial"
                          placeholder="Filial..."
                          value={filters.proteusFilial}
                          onChange={(e) => setFilters(prev => ({ ...prev, proteusFilial: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="filter-proteus-cod" className="text-sm">Protheus Código</Label>
                        <Input
                          id="filter-proteus-cod"
                          placeholder="Código..."
                          value={filters.proteusCod}
                          onChange={(e) => setFilters(prev => ({ ...prev, proteusCod: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="filter-min-count" className="text-sm">Qtd. Min.</Label>
                        <Input
                          id="filter-min-count"
                          type="number"
                          placeholder="Min..."
                          value={filters.memberCountMin}
                          onChange={(e) => setFilters(prev => ({ ...prev, memberCountMin: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="filter-max-count" className="text-sm">Qtd. Max.</Label>
                        <Input
                          id="filter-max-count"
                          type="number"
                          placeholder="Max..."
                          value={filters.memberCountMax}
                          onChange={(e) => setFilters(prev => ({ ...prev, memberCountMax: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="filter-group-buyer" className="text-sm">Comprador do Grupo</Label>
                       <Select
                         value={filters.groupBuyer}
                         onValueChange={(value) => setFilters(prev => ({ ...prev, groupBuyer: value === '__ALL__' ? '' : value }))}
                       >
                         <SelectTrigger className="mt-1">
                           <SelectValue placeholder="Selecionar comprador..." />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="__ALL__">Todos</SelectItem>
                          {uniqueBuyers.map(buyer => (
                            <SelectItem key={buyer} value={buyer}>{buyer}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm">Tipos de Materiais</Label>
                      <div className="mt-2 max-h-32 overflow-y-auto space-y-2">
                        {uniqueMaterialTypes.map(type => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                              id={`material-${type}`}
                              checked={filters.materialTypes.includes(type)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters(prev => ({ 
                                    ...prev, 
                                    materialTypes: [...prev.materialTypes, type] 
                                  }));
                                } else {
                                  setFilters(prev => ({ 
                                    ...prev, 
                                    materialTypes: prev.materialTypes.filter(t => t !== type) 
                                  }));
                                }
                              }}
                            />
                            <Label htmlFor={`material-${type}`} className="text-sm">{type}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {displayedGroups.length !== allGroups.length && (
              <div className="text-sm text-muted-foreground">
                Mostrando {displayedGroups.length} de {allGroups.length} grupos
              </div>
            )}
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort('code')}
                      >
                        Código
                        {sortKey === 'code' && (
                          sortDir === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="w-80">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort('name')}
                      >
                        Nome do Grupo
                        {sortKey === 'name' && (
                          sortDir === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort('protheus_filial')}
                      >
                        Protheus_Filial
                        {sortKey === 'protheus_filial' && (
                          sortDir === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort('protheus_cod')}
                      >
                        Protheus_Código
                        {sortKey === 'protheus_cod' && (
                          sortDir === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort('member_count')}
                      >
                        Qtd. Fornecedores
                        {sortKey === 'member_count' && (
                          sortDir === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort('member_buyer_names')}
                      >
                        Compradores Designados dos Membros
                        {sortKey === 'member_buyer_names' && (
                          sortDir === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort('group_assigned_buyer_name')}
                      >
                        Comprador Designado do Grupo
                        {sortKey === 'group_assigned_buyer_name' && (
                          sortDir === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort('material_type_names')}
                      >
                        Tipos de Materiais
                        {sortKey === 'material_type_names' && (
                          sortDir === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedGroups.length > 0 ? (
                    displayedGroups.map((group) => (
                      <TableRow key={group.id_grupo}>
                        <TableCell className="font-mono text-sm">
                          {group.code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {group.name}
                        </TableCell>
                        <TableCell className="text-sm">
                          {group.protheus_filial || '—'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {group.protheus_cod || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {group.member_count} fornecedores
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px]">
                          {group.member_buyer_names && group.member_buyer_names.length > 0 ? (
                            <div className="text-wrap break-words" title={group.member_buyer_names.join(', ')}>
                              {group.member_buyer_names.length <= 2 
                                ? group.member_buyer_names.join(', ')
                                : `${group.member_buyer_names.slice(0, 2).join(', ')} +${group.member_buyer_names.length - 2}`
                              }
                            </div>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {group.group_assigned_buyer_name || '—'}
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px]">
                          {group.material_type_names && group.material_type_names.length > 0 ? (
                            <div className="text-wrap break-words" title={group.material_type_names.join(', ')}>
                              {group.material_type_names.length <= 2 
                                ? group.material_type_names.join(', ')
                                : `${group.material_type_names.slice(0, 2).join(', ')} +${group.material_type_names.length - 2}`
                              }
                            </div>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleEditGroup(group)}
                              >
                                Editar Grupo
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteGroup(group)}
                                className="text-destructive"
                              >
                                Excluir Grupo
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm ? (
                            <>
                              Nenhum resultado encontrado para "{searchTerm}".
                              <br />
                              <span className="text-sm">
                                Tente pesquisar por: nome do grupo, código, CNPJ, cidade, UF, ou nome de fornecedor.
                              </span>
                            </>
                          ) : (
                            <>
                              Nenhum grupo econômico encontrado.
                              <br />
                              <span className="text-sm">Crie um novo grupo para começar.</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, totalCount)} de {totalCount} resultados
                </span>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">por página</span>
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {getPaginationItems().map((item, index) => (
                    <PaginationItem key={index}>
                      {item === 'ellipsis-start' || item === 'ellipsis-end' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={() => handlePageChange(item as number)}
                          isActive={currentPage === item}
                          className="cursor-pointer"
                        >
                          {item}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                      className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
      
      <PurchasesGroupMembersModal
        group={editingGroup}
        isOpen={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        onGroupUpdated={refreshGroups}
      />
    </div>
  );
}