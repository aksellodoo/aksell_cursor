
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit2, Trash2, Search, Users, Wand2, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { useUnifiedAccounts, CreateUnifiedAccountData } from '@/hooks/useUnifiedAccounts';
import { useLeadsSelect } from '@/hooks/useLeadsSelect';
import { RepresentativeSelector } from '@/components/RepresentativeSelector';
import { useCommercialRepresentatives } from '@/hooks/useCommercialRepresentatives';
import { QuickSegmentSelector } from '@/components/site/QuickSegmentSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UnifiedAccountsProps {
  showMissingOnly?: boolean;
}

const UnifiedAccounts: React.FC<UnifiedAccountsProps> = ({ showMissingOnly = false }) => {
  const { accounts, loading, createAccount, updateAccount, deleteAccount, fetchAccounts, createMissingUnifiedAccounts } = useUnifiedAccounts();
  const { leads } = useLeadsSelect();
  const { listQuery: { data: representatives = [] } } = useCommercialRepresentatives('sales');
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [isCreatingMissing, setIsCreatingMissing] = useState(false);
  const [formData, setFormData] = useState<CreateUnifiedAccountData>({
    status: 'lead_only',
    service_type: 'direct',
    notes: '',
    segment_ids: []
  });

  // Maps para armazenar dados de clientes, leads e vendedores
  const [protheusMap, setProtheusMap] = useState<Map<string, any>>(new Map());
  const [leadsMap, setLeadsMap] = useState<Map<string, any>>(new Map());
  const [vendorsMap, setVendorsMap] = useState<Map<string, any>>(new Map());

  // Estado para ordenação e filtros
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const statusLabels = {
    lead_only: 'Apenas Lead',
    customer: 'Cliente',
    lead_and_customer: 'Lead e Cliente',
    archived: 'Arquivado'
  };

  const statusColors = {
    lead_only: 'bg-blue-100 text-blue-800',
    customer: 'bg-green-100 text-green-800',
    lead_and_customer: 'bg-purple-100 text-purple-800',
    archived: 'bg-gray-100 text-gray-800'
  };

  // Função para buscar dados do Protheus, leads e vendedores
  useEffect(() => {
    const fetchTableData = async () => {
      if (accounts.length === 0) return;

      try {
        let protheusData = null;
        let leadsData = null;

        // Buscar dados do Protheus
        const protheusKeys = accounts
          .filter(acc => acc.protheus_filial && acc.protheus_cod && acc.protheus_loja)
          .map(acc => `${acc.protheus_filial}-${acc.protheus_cod}-${acc.protheus_loja}`);

        if (protheusKeys.length > 0) {
          const { data } = await supabase
            .from('protheus_sa1010_80f17f00')
            .select('a1_filial, a1_cod, a1_loja, a1_nome, a1_nreduz, a1_vend')
            .in('a1_filial', [...new Set(accounts.map(acc => acc.protheus_filial).filter(Boolean))])
            .in('a1_cod', [...new Set(accounts.map(acc => acc.protheus_cod).filter(Boolean))]);

          protheusData = data;
          if (protheusData) {
            const newProtheusMap = new Map();
            protheusData.forEach(item => {
              const key = `${item.a1_filial}-${item.a1_cod}-${item.a1_loja}`;
              newProtheusMap.set(key, item);
            });
            setProtheusMap(newProtheusMap);
          }
        }

        // Buscar dados dos leads
        const leadIds = accounts.map(acc => acc.lead_id).filter(Boolean);
        if (leadIds.length > 0) {
          const { data } = await supabase
            .from('sales_leads')
            .select('id, trade_name, legal_name, assigned_vendor_cod')
            .in('id', leadIds);

          leadsData = data;
          if (leadsData) {
            const newLeadsMap = new Map();
            leadsData.forEach(lead => {
              newLeadsMap.set(lead.id, lead);
            });
            setLeadsMap(newLeadsMap);
          }
        }

        // Coletar códigos de vendedores diretamente dos dados recém-consultados
        const vendorCodes = [];
        
        // Códigos de vendedores do Protheus
        if (protheusData) {
          vendorCodes.push(...protheusData.map(item => item.a1_vend).filter(Boolean));
        }
        
        // Códigos de vendedores dos leads
        if (leadsData) {
          vendorCodes.push(...leadsData.map(lead => lead.assigned_vendor_cod).filter(Boolean));
        }

        if (vendorCodes.length > 0) {
          const { data: vendorsData } = await supabase
            .from('protheus_sa3010_fc3d70f6')
            .select('a3_cod, a3_nome')
            .in('a3_cod', [...new Set(vendorCodes)]);

          if (vendorsData) {
            const newVendorsMap = new Map();
            vendorsData.forEach(vendor => {
              newVendorsMap.set(vendor.a3_cod, vendor);
            });
            setVendorsMap(newVendorsMap);
          }
        }
      } catch (error) {
        console.error('Error fetching table data:', error);
      }
    };

    fetchTableData();
  }, [accounts]);

  // Função para obter nome da empresa (prioriza Protheus)
  const getCompanyName = (account: any): string => {
    if (account.protheus_filial && account.protheus_cod && account.protheus_loja) {
      const key = `${account.protheus_filial}-${account.protheus_cod}-${account.protheus_loja}`;
      const protheusClient = protheusMap.get(key);
      if (protheusClient) {
        return protheusClient.a1_nreduz || protheusClient.a1_nome || 'Nome não informado';
      }
    }
    
    if (account.lead_id) {
      const lead = leadsMap.get(account.lead_id);
      if (lead) {
        return lead.trade_name || lead.legal_name || 'Nome não informado';
      }
    }
    
    return 'Nome não informado';
  };

  // Função para obter nomes da empresa para exibição em duas linhas
  const getCompanyDisplay = (account: any): { primaryName: string; legalName?: string } => {
    if (account.protheus_filial && account.protheus_cod && account.protheus_loja) {
      const key = `${account.protheus_filial}-${account.protheus_cod}-${account.protheus_loja}`;
      const protheusClient = protheusMap.get(key);
      if (protheusClient) {
        const tradeName = protheusClient.a1_nreduz;
        const legalName = protheusClient.a1_nome;
        
        if (tradeName && legalName && tradeName !== legalName) {
          return { primaryName: tradeName, legalName };
        } else if (tradeName || legalName) {
          return { primaryName: tradeName || legalName };
        }
      }
    }
    
    if (account.lead_id) {
      const lead = leadsMap.get(account.lead_id);
      if (lead) {
        const tradeName = lead.trade_name;
        const legalName = lead.legal_name;
        
        if (tradeName && legalName && tradeName !== legalName) {
          return { primaryName: tradeName, legalName };
        } else if (tradeName || legalName) {
          return { primaryName: tradeName || legalName };
        }
      }
    }
    
    return { primaryName: 'Nome não informado' };
  };

  // Função para obter nome do vendedor
  const getSellerName = (account: any): string => {
    let vendorCode = '';
    
    // Primeiro tenta do Protheus
    if (account.protheus_filial && account.protheus_cod && account.protheus_loja) {
      const key = `${account.protheus_filial}-${account.protheus_cod}-${account.protheus_loja}`;
      const protheusClient = protheusMap.get(key);
      if (protheusClient?.a1_vend) {
        vendorCode = protheusClient.a1_vend;
      }
    }
    
    // Se não encontrou, tenta do lead
    if (!vendorCode && account.lead_id) {
      const lead = leadsMap.get(account.lead_id);
      if (lead?.assigned_vendor_cod) {
        vendorCode = lead.assigned_vendor_cod;
      }
    }
    
    if (vendorCode) {
      const vendor = vendorsMap.get(vendorCode);
      if (vendor) {
        return vendor.a3_nome || vendorCode;
      }
      return vendorCode;
    }
    
    return 'Não informado';
  };

  // Função para ordenação
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Função para atualizar filtros por coluna
  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Função para limpar filtros
  const clearFilters = () => {
    setColumnFilters({});
    setSearchTerm('');
  };

  // Aplicar filtros e ordenação
  const processedAccounts = React.useMemo(() => {
    let filtered = accounts.filter(account => {
      // Filtro para membros faltantes (sem grupo econômico)
      if (showMissingOnly && account.economic_group_id) {
        return false;
      }
      
      // Filtro da busca geral
      if (searchTerm) {
        const companyName = getCompanyName(account);
        const searchMatch = account.seq_id.toString().includes(searchTerm) ||
                           companyName.toLowerCase().includes(searchTerm.toLowerCase());
        if (!searchMatch) return false;
      }

      // Filtros por coluna
      if (columnFilters.id && !account.seq_id.toString().includes(columnFilters.id)) return false;
      if (columnFilters.status && !statusLabels[account.status].toLowerCase().includes(columnFilters.status.toLowerCase())) return false;
      
      // Filtro por tipo de atendimento
      if (columnFilters.service_type) {
        const serviceType = account.service_type === 'direct' ? 'Direto' : 'Por Representante';
        if (!serviceType.toLowerCase().includes(columnFilters.service_type.toLowerCase())) return false;
      }
      
      if (columnFilters.filial && !(account.protheus_filial || '').toLowerCase().includes(columnFilters.filial.toLowerCase())) return false;
      if (columnFilters.codigo && !(account.protheus_cod || '').toLowerCase().includes(columnFilters.codigo.toLowerCase())) return false;
      if (columnFilters.loja && !(account.protheus_loja || '').toLowerCase().includes(columnFilters.loja.toLowerCase())) return false;
      if (columnFilters.empresa && !getCompanyName(account).toLowerCase().includes(columnFilters.empresa.toLowerCase())) return false;
      
      // Filtro por segmentos
      if (columnFilters.segmentos) {
        const segmentNames = account.segments?.map((s: any) => s.name).join(' ') || '';
        if (!segmentNames.toLowerCase().includes(columnFilters.segmentos.toLowerCase())) return false;
      }
      
      if (columnFilters.vendedor && !getSellerName(account).toLowerCase().includes(columnFilters.vendedor.toLowerCase())) return false;

      return true;
    });

    // Aplicar ordenação
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'id':
            aValue = a.seq_id;
            bValue = b.seq_id;
            break;
          case 'status':
            aValue = statusLabels[a.status];
            bValue = statusLabels[b.status];
            break;
          case 'service_type':
            aValue = a.service_type === 'direct' ? 'Direto' : 'Por Representante';
            bValue = b.service_type === 'direct' ? 'Direto' : 'Por Representante';
            break;
          case 'filial':
            aValue = a.protheus_filial || '';
            bValue = b.protheus_filial || '';
            break;
          case 'codigo':
            aValue = a.protheus_cod || '';
            bValue = b.protheus_cod || '';
            break;
          case 'loja':
            aValue = a.protheus_loja || '';
            bValue = b.protheus_loja || '';
            break;
          case 'empresa':
            aValue = getCompanyName(a);
            bValue = getCompanyName(b);
            break;
          case 'vendedor':
            aValue = getSellerName(a);
            bValue = getSellerName(b);
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [accounts, searchTerm, columnFilters, sortConfig, protheusMap, leadsMap, vendorsMap, showMissingOnly]);

  // Componente para cabeçalho ordenável
  const SortableHeader = ({ children, sortKey }: { children: React.ReactNode; sortKey: string }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortConfig?.key === sortKey ? (
          sortConfig.direction === 'asc' ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )
        ) : (
          <div className="w-4 h-4" />
        )}
      </div>
    </TableHead>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitizar payload - converter strings vazias para null para campos UUID
    const sanitizedData = {
      ...formData,
      lead_id: formData.lead_id === '' ? null : formData.lead_id,
      representative_id: formData.representative_id === '' ? null : formData.representative_id,
      // Se algum campo Protheus estiver vazio, limpar todos para consistência
      protheus_filial: (!formData.protheus_filial || !formData.protheus_cod || !formData.protheus_loja) ? null : formData.protheus_filial,
      protheus_cod: (!formData.protheus_filial || !formData.protheus_cod || !formData.protheus_loja) ? null : formData.protheus_cod,
      protheus_loja: (!formData.protheus_filial || !formData.protheus_cod || !formData.protheus_loja) ? null : formData.protheus_loja
    };
    
    // Validação: pelo menos um vínculo deve ser informado
    const hasLeadLink = !!sanitizedData.lead_id;
    const hasProtheusLink = !!(sanitizedData.protheus_filial && sanitizedData.protheus_cod && sanitizedData.protheus_loja);
    
    if (!hasLeadLink && !hasProtheusLink) {
      alert('Informe pelo menos um vínculo: Lead ou Cliente do Protheus completo (filial, código e loja)');
      return;
    }

    // Validação: se tipo de atendimento for representante, deve ter representante
    if (sanitizedData.service_type === 'representative' && !sanitizedData.representative_id) {
      alert('Para atendimento por representante, selecione um representante comercial');
      return;
    }
    
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, sanitizedData);
        setEditingAccount(null);
      } else {
        await createAccount(sanitizedData);
      }
      
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error saving unified account:', error);
    }
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setFormData({
      status: account.status,
      lead_id: account.lead_id || undefined,
      protheus_filial: account.protheus_filial || undefined,
      protheus_cod: account.protheus_cod || undefined,
      protheus_loja: account.protheus_loja || undefined,
      service_type: account.service_type || 'direct',
      representative_id: account.representative_id || undefined,
      notes: account.notes || '',
      segment_ids: account.segment_ids || []
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (account: any) => {
    if (confirm(`Tem certeza que deseja excluir o cliente unificado #${account.seq_id}?`)) {
      await deleteAccount(account.id);
    }
  };

  const resetForm = () => {
    setEditingAccount(null);
    setFormData({
      status: 'lead_only',
      service_type: 'direct',
      notes: '',
      segment_ids: []
    });
  };

  const getSelectedLeadName = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    return lead ? lead.trade_name : 'Lead não encontrado';
  };

  const getRepresentativeName = (repId: string) => {
    const representative = representatives.find(r => r.id === repId);
    return representative ? representative.company_name : 'Representante não encontrado';
  };

  const handleCreateMissing = async () => {
    if (!confirm('Tem certeza que deseja criar clientes unificados para todos os clientes Protheus e leads que ainda não possuem? Esta operação não pode ser desfeita.')) {
      return;
    }

    setIsCreatingMissing(true);
    try {
      await createMissingUnifiedAccounts();
    } catch (error) {
      // Error handling is done inside createMissingUnifiedAccounts
      console.error('Error creating missing unified accounts:', error);
    } finally {
      setIsCreatingMissing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Clientes Unificados
          </h2>
          <p className="text-muted-foreground">
            Centralize leads e clientes do Protheus em uma visão unificada
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCreateMissing}
            disabled={isCreatingMissing || loading}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {isCreatingMissing ? 'Criando...' : 'Criar Clientes Unificados Faltantes'}
           </Button>
           
           <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
             setIsCreateDialogOpen(open);
             if (!open) resetForm();
           }}>
             <DialogTrigger asChild>
               <Button>
                 <Plus className="h-4 w-4 mr-2" />
                 Novo Cliente Unificado
               </Button>
             </DialogTrigger>
           <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? 'Editar Cliente Unificado' : 'Novo Cliente Unificado'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({...prev, status: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead_only">Apenas Lead</SelectItem>
                      <SelectItem value="customer">Cliente</SelectItem>
                      <SelectItem value="lead_and_customer">Lead e Cliente</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="service_type">Tipo de Atendimento</Label>
                  <Select value={formData.service_type} onValueChange={(value: 'direct' | 'representative') => setFormData(prev => ({...prev, service_type: value, representative_id: value === 'direct' ? undefined : prev.representative_id}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direto</SelectItem>
                      <SelectItem value="representative">Por Representante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.service_type === 'representative' && (
                  <div className="col-span-2">
                    <RepresentativeSelector
                      label="Representante Comercial de Vendas"
                      value={formData.representative_id || ''}
                      onValueChange={(value) => setFormData(prev => ({...prev, representative_id: value || undefined}))}
                      placeholder="Selecione um representante"
                      required
                    />
                  </div>
                )}
                
                <div className="col-span-2">
                  <Label className="text-lg font-semibold">Vínculos (pelo menos um obrigatório)</Label>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="lead_id">Lead Vinculado</Label>
                  <Select value={formData.lead_id || "none"} onValueChange={(value) => setFormData(prev => ({...prev, lead_id: value === "none" ? undefined : value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um lead (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum lead</SelectItem>
                      {leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.trade_name} {lead.legal_name && `(${lead.legal_name})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label className="text-base font-medium">Cliente Protheus (preencha todos os campos ou deixe todos vazios)</Label>
                </div>
                
                <div>
                  <Label htmlFor="protheus_filial">Filial Protheus</Label>
                  <Input
                    id="protheus_filial"
                    value={formData.protheus_filial || ''}
                    onChange={(e) => setFormData(prev => ({...prev, protheus_filial: e.target.value || undefined}))}
                    placeholder="Ex: 01"
                  />
                </div>
                
                <div>
                  <Label htmlFor="protheus_cod">Código Protheus</Label>
                  <Input
                    id="protheus_cod"
                    value={formData.protheus_cod || ''}
                    onChange={(e) => setFormData(prev => ({...prev, protheus_cod: e.target.value || undefined}))}
                    placeholder="Ex: 000001"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="protheus_loja">Loja Protheus</Label>
                  <Input
                    id="protheus_loja"
                    value={formData.protheus_loja || ''}
                    onChange={(e) => setFormData(prev => ({...prev, protheus_loja: e.target.value || undefined}))}
                    placeholder="Ex: 01"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-base font-medium">Segmentos</Label>
                  <QuickSegmentSelector 
                    selectedSegments={formData.segment_ids || []}
                    onSegmentsChange={(segmentIds) => setFormData(prev => ({...prev, segment_ids: segmentIds}))}
                    placeholder="Digite um segmento e pressione Enter..."
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                    placeholder="Observações adicionais..."
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {editingAccount ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
           </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Barra de busca e controles */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por ID do cliente ou nome da empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
        
        {(Object.keys(columnFilters).length > 0 || searchTerm) && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Tabela de clientes */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader sortKey="id">ID</SortableHeader>
              <SortableHeader sortKey="status">Status</SortableHeader>
              <SortableHeader sortKey="service_type">Tipo de Atendimento</SortableHeader>
              <SortableHeader sortKey="filial">Filial</SortableHeader>
              <SortableHeader sortKey="codigo">Código</SortableHeader>
              <SortableHeader sortKey="loja">Loja</SortableHeader>
              <SortableHeader sortKey="empresa">Nome da Empresa</SortableHeader>
              <TableHead>Segmentos</TableHead>
              <SortableHeader sortKey="vendedor">Nome do Vendedor</SortableHeader>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
            {showFilters && (
              <TableRow className="border-b bg-muted/20">
                <TableHead className="p-2">
                  <Input
                    placeholder="Filtrar ID..."
                    value={columnFilters.id || ''}
                    onChange={(e) => handleColumnFilter('id', e.target.value)}
                    className="h-8"
                  />
                </TableHead>
                <TableHead className="p-2">
                  <Input
                    placeholder="Filtrar status..."
                    value={columnFilters.status || ''}
                    onChange={(e) => handleColumnFilter('status', e.target.value)}
                    className="h-8"
                  />
                </TableHead>
                <TableHead className="p-2">
                  <Input
                    placeholder="Filtrar tipo..."
                    value={columnFilters.service_type || ''}
                    onChange={(e) => handleColumnFilter('service_type', e.target.value)}
                    className="h-8"
                  />
                </TableHead>
                <TableHead className="p-2">
                  <Input
                    placeholder="Filtrar filial..."
                    value={columnFilters.filial || ''}
                    onChange={(e) => handleColumnFilter('filial', e.target.value)}
                    className="h-8"
                  />
                </TableHead>
                <TableHead className="p-2">
                  <Input
                    placeholder="Filtrar código..."
                    value={columnFilters.codigo || ''}
                    onChange={(e) => handleColumnFilter('codigo', e.target.value)}
                    className="h-8"
                  />
                </TableHead>
                <TableHead className="p-2">
                  <Input
                    placeholder="Filtrar loja..."
                    value={columnFilters.loja || ''}
                    onChange={(e) => handleColumnFilter('loja', e.target.value)}
                    className="h-8"
                  />
                </TableHead>
                <TableHead className="p-2">
                  <Input
                    placeholder="Filtrar empresa..."
                    value={columnFilters.empresa || ''}
                    onChange={(e) => handleColumnFilter('empresa', e.target.value)}
                    className="h-8"
                  />
                </TableHead>
                 <TableHead className="p-2">
                   <Input
                     placeholder="Filtrar segmentos..."
                     value={columnFilters.segmentos || ''}
                     onChange={(e) => handleColumnFilter('segmentos', e.target.value)}
                     className="h-8"
                   />
                 </TableHead>
                 <TableHead className="p-2">
                   <Input
                     placeholder="Filtrar vendedor..."
                     value={columnFilters.vendedor || ''}
                     onChange={(e) => handleColumnFilter('vendedor', e.target.value)}
                     className="h-8"
                   />
                 </TableHead>
                 <TableHead className="p-2"></TableHead>
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  Carregando clientes unificados...
                </TableCell>
              </TableRow>
            ) : processedAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  {searchTerm || Object.keys(columnFilters).length > 0 ? 'Nenhum cliente encontrado para os filtros aplicados.' : 'Nenhum cliente unificado cadastrado ainda.'}
                </TableCell>
              </TableRow>
            ) : (
              processedAccounts.map((account) => (
                <TableRow key={account.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">#{account.seq_id}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[account.status]}>
                      {statusLabels[account.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {account.service_type === 'direct' ? 'Direto' : 'Por Representante'}
                  </TableCell>
                  <TableCell>{account.protheus_filial || ''}</TableCell>
                  <TableCell>{account.protheus_cod || ''}</TableCell>
                  <TableCell>{account.protheus_loja || ''}</TableCell>
                   <TableCell>
                     {(() => {
                       const { primaryName, legalName } = getCompanyDisplay(account);
                       return (
                         <div className="space-y-0">
                           <div className="text-sm font-medium">
                             {primaryName}
                           </div>
                           {legalName && (
                             <div className="text-xs text-muted-foreground">
                               {legalName}
                             </div>
                           )}
                         </div>
                       );
                     })()}
                   </TableCell>
                   <TableCell>
                     {account.segments && account.segments.length > 0 ? (
                       <div className="flex flex-wrap gap-1">
                         {account.segments.map((segment: any) => (
                           <Badge key={segment.id} variant="outline" className="text-xs">
                             {segment.name}
                           </Badge>
                         ))}
                       </div>
                     ) : (
                       <span className="text-muted-foreground text-sm">Nenhum</span>
                     )}
                   </TableCell>
                  <TableCell>{getSellerName(account)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(account)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(account)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UnifiedAccounts;
