import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Download, 
  RefreshCw, 
  Database, 
  ArrowLeft, 
  Columns,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ArrowUpDown,
  PlusCircle,
  Pencil,
  Trash2,
  Settings,
  Filter,
  Grid,
  Clock,
  Plus,
  Edit,
  Wrench,
  FileText,
  RotateCcw,
  Activity,
  Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useProtheusSyncedData } from '@/hooks/useProtheusSyncedData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/StatusBadge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MissingRecordsAnalyzer } from '@/components/MissingRecordsAnalyzer';
import { DeletedRecordsTab } from '@/components/DeletedRecordsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ColumnFilterPopover } from '@/components/ColumnFilterPopover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ProtheusSyncErrorsViewer } from '@/components/ProtheusSyncErrorsViewer';
import { ProtheusCSVImportModal } from '@/components/ProtheusCSVImportModal';
import { NextSyncPreview } from '@/components/sync-config/NextSyncPreview';
import { SyncLogModal } from '@/components/SyncLogModal';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { supabase } from '@/integrations/supabase/client';
import { fixProtheusFlags, checkSoftDeleteColumns } from '@/utils/protheusSoftDelete';
import { useSyncStatusPolling } from '@/hooks/useSyncStatusPolling';

export default function ProtheusTableRecords() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [showOnlyLastErrors, setShowOnlyLastErrors] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFixingFlags, setIsFixingFlags] = useState(false);
  const [showSyncLogModal, setShowSyncLogModal] = useState(false);
  const [isCleaningAndResyncing, setIsCleaningAndResyncing] = useState(false);

  // Sync configuration states for NextSyncPreview
  const [syncType, setSyncType] = useState<string>('');
  const [intervalValue, setIntervalValue] = useState<number | undefined>();
  const [intervalUnit, setIntervalUnit] = useState<string>('');
  const [schedule, setSchedule] = useState<string[]>([]);
  const [cronExpression, setCronExpression] = useState<string>('');
  const [nextDueAt, setNextDueAt] = useState<string | null>(null);

  /* Server-side sorting and filters managed by hook */
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | undefined>(undefined);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  const {
    data,
    columns,
    loading,
    isInitialLoading,
    error,
    totalCount,
    lastSyncAt,
    tableName,
    pagination,
    columnFilters,
    sort,
    setPagination,
    setSearchTerm: setHookSearchTerm,
    setColumnFilters,
    setSort,
    refreshData,
    forceSyncTable,
    finalizeSyncLogs,
    fetchAllDataForExport,
    fetchAllDataIgnoreFilters,
    fetchChangesSinceLastSync,
    lastSyncCreated,
    lastSyncUpdated,
    lastSyncDeleted,
    lastSyncLogId,
    lastSyncType,
    lastSyncFinishedAt,
    flagAnomalies,
    hasPendingDeletionColumns,
    hasUnreflectedDeletions,
    // New deleted records functionality
    deletedRecordsData,
    deletedRecordsLoading,
    deletedRecordsCount,
    fetchDeletedRecords,
    restoreDeletedRecord
  } = useProtheusSyncedData(tableId || '');

  // Sync status polling
  const { currentSync, isPolling, isLongRunning, startPolling, stopPolling, forceTerminate } = useSyncStatusPolling(tableId || '');

  // Initialize visible columns when data is available
  useEffect(() => {
    if (Array.isArray(columns) && columns.length > 0 && visibleColumns.size === 0) {
      setVisibleColumns(new Set(columns));
    }
  }, [columns, visibleColumns.size]);

  // Fetch sync configuration for NextSyncPreview
  useEffect(() => {
    const fetchSyncConfig = async () => {
      if (!tableId) return;
      
      try {
        const { data: tableConfig, error } = await supabase
          .from('protheus_tables')
          .select('sync_type, query_interval_value, query_interval_unit, sync_schedule, cron_expression, next_due_at')
          .eq('id', tableId)
          .single();

        if (error) {
          console.error('Erro ao buscar configuração de sincronização:', error);
          return;
        }

        setSyncType(tableConfig.sync_type || 'interval');
        setIntervalValue(tableConfig.query_interval_value || 60);
        setIntervalUnit(tableConfig.query_interval_unit || 'minutes');
        setSchedule(Array.isArray(tableConfig.sync_schedule) ? tableConfig.sync_schedule.map(String) : []);
        setCronExpression(tableConfig.cron_expression || '');
        setNextDueAt(tableConfig.next_due_at || null);
      } catch (error) {
        console.error('Erro ao buscar configuração de sincronização:', error);
      }
    };

    fetchSyncConfig();
  }, [tableId]);

  const handleSort = (column: string) => {
    if (column === 'status') {
      // Handle status sorting locally
      if (sort.column === 'status') {
        setSort('status', sort.direction === 'asc' ? 'desc' : 'asc');
      } else {
        setSort('status', 'asc');
      }
    } else {
      // Handle other columns with server-side sorting
      if (sort.column === column) {
        setSort(column, sort.direction === 'asc' ? 'desc' : 'asc');
      } else {
        setSort(column, 'asc');
      }
    }
  };

  const handleSync = async () => {
    try {
      startPolling();
      await forceSyncTable();
    } catch (error) {
      console.error('Sync error:', error);
      stopPolling();
    }
  };

  const handleForceTerminate = async () => {
    try {
      await forceTerminate();
      toast({
        title: "Sincronização encerrada",
        description: "A sincronização foi encerrada forçadamente.",
      });
    } catch (error: any) {
      console.error('Force terminate error:', error);
      toast({
        title: "Erro ao encerrar",
        description: error.message || 'Erro ao encerrar sincronização',
        variant: "destructive",
      });
    }
  };

  const handleCleanAndResync = async () => {
    if (!tableId) return;
    
    setIsCleaningAndResyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-and-resync-table', {
        body: { tableId }
      });

      if (error) throw error;

      toast({
        title: "Limpeza e Re-sincronização Iniciada",
        description: "O processo foi iniciado. Os dados serão limpos e re-sincronizados completamente.",
      });

      startPolling();
      refreshData();
    } catch (error: any) {
      console.error('Clean and resync error:', error);
      toast({
        title: "Erro na Limpeza e Re-sincronização",
        description: error.message || "Erro ao iniciar limpeza e re-sincronização",
        variant: "destructive",
      });
    } finally {
      setIsCleaningAndResyncing(false);
    }
  };

  const scrollToRow = (idx: number) => {
    const el = rowRefs.current[idx];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHoveredRowIndex(idx);
    }
  };
  
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setHookSearchTerm(value);
    setPagination(1, pagination.limit);
  };

  const toggleColumnVisibility = (columnName: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnName)) {
        newSet.delete(columnName);
      } else {
        newSet.add(columnName);
      }
      return newSet;
    });
  };

  // Pagination handlers
  const handlePageSizeChange = (newSize: string) => {
    setPagination(1, parseInt(newSize));
  };

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      setPagination(pagination.page - 1, pagination.limit);
    }
  };

  const handleNextPage = () => {
    const maxPage = Math.ceil(totalCount / pagination.limit);
    if (pagination.page < maxPage) {
      setPagination(pagination.page + 1, pagination.limit);
    }
  };

  const exportRowsToCSV = (rows: any[], fileLabel: string) => {
    const allData = rows;

    const allKeysSet = new Set<string>();
    allData.forEach((row: any) => Object.keys(row).forEach((k) => allKeysSet.add(k)));
    const allKeys = Array.from(allKeysSet);

    const visibleHeaders = columns.filter((c) => visibleColumns.has(c));
    const remainingHeaders = allKeys.filter((k) => !visibleHeaders.includes(k));
    const headers = [...visibleHeaders, ...remainingHeaders];

    const csvContent = [
      headers.join(','),
      ...allData.map((row: any) =>
        headers
          .map((header) => {
            const raw = row[header];
            const value = raw === null || raw === undefined ? '' : formatCellValue(raw);
            const stringValue = String(value);
            return `"${stringValue.replace(/"/g, '""')}"`;
          })
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `registros_${tableId}_${fileLabel}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFixFlags = async () => {
    if (!tableId) return;
    
    setIsFixingFlags(true);
    
    try {
      console.log('🔧 Iniciando correção de flags para tabela:', tableId);

      // Use the updated fix function that handles the new structure
      await fixProtheusFlags(tableId);

      // Force a sync to apply changes
      console.log('🔄 Forçando sincronização...');
      await forceSyncTable();

      // Refresh data to show updated state
      console.log('📊 Atualizando dados...');
      await refreshData();

      toast({
        title: "Correção concluída",
        description: "Flags corrigidas e soft delete configurado com sucesso!",
      });

    } catch (error) {
      console.error('💥 Erro na correção de flags:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao corrigir flags",
        variant: "destructive"
      });
    } finally {
      setIsFixingFlags(false);
    }
  };

  const handleExportAll = async () => {
    if (totalCount === 0) {
      toast({ title: 'Nenhum dado para exportar', description: 'Não há dados disponíveis.', variant: 'destructive' });
      return;
    }
    try {
      setIsExporting(true);
      const rows = await fetchAllDataIgnoreFilters();
      if (!rows.length) throw new Error('Sem dados');
      exportRowsToCSV(rows, 'todos');
      toast({ title: 'Exportação concluída', description: `${rows.length} registros exportados (todos).` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro na exportação', description: 'Falha ao exportar todos os registros', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportFiltered = async () => {
    if (totalCount === 0) {
      toast({ title: 'Nenhum dado para exportar', description: 'Não há dados disponíveis.', variant: 'destructive' });
      return;
    }
    try {
      setIsExporting(true);
      const rows = await fetchAllDataForExport();
      if (!rows.length) throw new Error('Sem dados');
      exportRowsToCSV(rows, 'filtrados');
      toast({ title: 'Exportação concluída', description: `${rows.length} registros exportados (filtro ativo).` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro na exportação', description: 'Falha ao exportar registros filtrados', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportChanges = async () => {
    if (totalCount === 0) {
      toast({ title: 'Nenhum dado para exportar', description: 'Não há dados disponíveis.', variant: 'destructive' });
      return;
    }
    try {
      setIsExporting(true);
      const rows = await fetchChangesSinceLastSync();
      if (!rows.length) {
        toast({ title: 'Sem alterações', description: 'Nenhum registro novo ou alterado na última sincronização.' });
        return;
      }
      exportRowsToCSV(rows, 'alteracoes');
      toast({ title: 'Exportação concluída', description: `${rows.length} registros exportados (alterações).` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro na exportação', description: 'Falha ao exportar alterações', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return formatDate(value);
    }
    return String(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  // Get record status for display and sorting
  const getRecordStatus = (record: any) => {
    if (!record || typeof record !== 'object') return 'unchanged';
    
    // Debug log para investigar o problema
    if (record.a3_cod === '000001') {
      console.log('🔍 Debug status Jorge Junior:', {
        record_status: record.record_status,
        was_updated_last_sync: record.was_updated_last_sync,
        is_new_record: record.is_new_record,
        last_sync_id: record.last_sync_id,
        lastSyncLogId: lastSyncLogId,
        pending_deletion: record.pending_deletion
      });
    }
    
    const isPendingDeletion = record?.pending_deletion === true;
    
    // PRIORIZAR o campo record_status do banco quando disponível
    if (record?.record_status) {
      if (isPendingDeletion) return 'deleted';
      return record.record_status as 'new' | 'updated' | 'unchanged';
    }
    
    // Fallback para lógica anterior (compatibilidade)
    const isNew = record?.is_new_record === true && record?.last_sync_id === lastSyncLogId;
    const isUpdated = record?.was_updated_last_sync === true && record?.is_new_record !== true && record?.last_sync_id === lastSyncLogId;
    
    if (isPendingDeletion) return 'deleted';
    if (isNew) return 'new';
    if (isUpdated) return 'updated';
    return 'unchanged';
  };

  // Filter and sort records based on status and active sort
  const getFilteredAndSortedRecords = () => {
    let records = data || [];
    if (!Array.isArray(records)) return [];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      records = records.filter(record => {
        const status = getRecordStatus(record);
        return statusFilter === status;
      });
    }

    // Apply client-side sorting for Status column only
    if (sort.column === 'status') {
      const statusOrder = { 'new': 0, 'updated': 1, 'unchanged': 2, 'deleted': 3 };
      records = [...records].sort((a, b) => {
        const statusA = getRecordStatus(a);
        const statusB = getRecordStatus(b);
        const orderA = statusOrder[statusA as keyof typeof statusOrder] ?? 4;
        const orderB = statusOrder[statusB as keyof typeof statusOrder] ?? 4;
        
        if (sort.direction === 'asc') {
          return orderA - orderB;
        } else {
          return orderB - orderA;
        }
      });
    }
    
    return records;
  };

  if (!tableId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert className="max-w-md">
          <AlertDescription>
            ID da tabela não encontrado na URL.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const maxPage = Math.ceil((totalCount || 0) / (pagination?.limit || 50));
  const displayedRows = getFilteredAndSortedRecords();

  return (
    <SectionErrorBoundary sectionName="Registros da Tabela">
      <div className="min-h-screen bg-background p-6 relative">
        {/* Subtle loading overlay for subsequent reloads */}
        {loading && !isInitialLoading && (
          <div className="absolute inset-0 bg-background/50 z-10 pointer-events-none" />
        )}
        
        {/* Show spinner only on initial load */}
        {isInitialLoading && (
          <div className="flex items-center justify-center h-screen">
            <LoadingSpinner />
          </div>
        )}
      
      {/* Header with Breadcrumb */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleFixFlags}
              variant={flagAnomalies > 0 || !hasPendingDeletionColumns || hasUnreflectedDeletions ? "outline" : "ghost"} 
              size="sm"
              className={`gap-2 ${
                flagAnomalies > 0 || !hasPendingDeletionColumns || hasUnreflectedDeletions
                  ? "border-amber-500 text-amber-600 hover:bg-amber-50" 
                  : "text-muted-foreground"
              }`}
              disabled={loading || isFixingFlags}
            >
              <Settings className={`h-4 w-4 ${isFixingFlags ? 'animate-spin' : ''}`} />
              {isFixingFlags ? 'Corrigindo...' : 'Corrigir Flags'}
              {flagAnomalies > 0 && ` (${flagAnomalies})`}
            </Button>

            {/* Show finalize button if records exist but no completed sync log */}
            {totalCount > 0 && !lastSyncFinishedAt && (
              <Button
                onClick={() => finalizeSyncLogs()}
                variant="outline"
                size="sm"
                className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                disabled={loading}
              >
                <Database className="h-4 w-4" />
                Finalizar Log
              </Button>
            )}
            
            <Button
              variant="outline" 
              size="sm"
              onClick={() => navigate('/protheus/tabelas')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/protheus/tabelas">Tabelas Protheus</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Registros - {tableName || tableId}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Alert Banner for Missing Deletion Columns or Unreflected Deletions */}
        {(!hasPendingDeletionColumns || hasUnreflectedDeletions) && (
          <Alert className="border-amber-500 bg-amber-50 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Configuração de Soft Delete Incompleta</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <div>
                {!hasPendingDeletionColumns && "Colunas de soft delete ausentes. "}
                {hasUnreflectedDeletions && "Há registros apagados no Protheus que não foram refletidos na tabela. "}
                Clique em "Corrigir Flags" para resolver.
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleFixFlags}
                disabled={loading || isFixingFlags}
                className="border-amber-600 text-amber-700 hover:bg-amber-100"
              >
                {isFixingFlags ? 'Corrigindo...' : 'Corrigir agora'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative min-w-0 flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar registros..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="new">Novos</SelectItem>
              <SelectItem value="updated">Atualizados</SelectItem>
              <SelectItem value="synchronized">Sincronizados</SelectItem>
              <SelectItem value="deleted">Apagados</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="h-4 w-4 mr-2" />
                Colunas ({visibleColumns.size})
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium">Selecionar Colunas</h4>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {Array.isArray(columns) && columns.map((column) => (
                      <div key={column} className="flex items-center space-x-2">
                        <Checkbox
                          id={column}
                          checked={visibleColumns.has(column)}
                          onCheckedChange={() => toggleColumnVisibility(column)}
                        />
                        <label
                          htmlFor={column}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {column}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>
            {error.includes('permission') || error.includes('RLS') 
              ? 'Sem permissão para acessar os dados. Verifique as políticas RLS.' 
              : error}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards - Always Rendered */}
      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 180px))' }}>
        {/* Total Records */}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 text-xs font-medium">Total de Registros</p>
                <p className="text-white text-lg font-bold">{(totalCount || 0).toLocaleString()}</p>
              </div>
              <Database className="h-5 w-5 text-white/80" />
            </div>
          </CardContent>
        </Card>

        {/* Available Columns */}
        <Card className="bg-gradient-to-br from-green-600 to-green-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 text-xs font-medium">Colunas Disponíveis</p>
                <p className="text-white text-lg font-bold">{(columns?.length || 0)}</p>
              </div>
              <Columns className="h-5 w-5 text-white/80" />
            </div>
          </CardContent>
        </Card>

        {/* Next Sync */}
        <Card className="bg-gradient-to-br from-purple-600 to-purple-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-white/90 text-xs font-medium mb-1">Próxima Sincronização</p>
                <div className="text-white">
                  <NextSyncPreview
                    variant="compact"
                    syncType={syncType}
                    intervalValue={intervalValue}
                    intervalUnit={intervalUnit}
                    schedule={schedule}
                    cronExpression={cronExpression}
                    nextDueAt={nextDueAt}
                    lastSyncAt={lastSyncFinishedAt || lastSyncAt}
                  />
                </div>
              </div>
              <Clock className="h-5 w-5 text-white/80 ml-2" />
            </div>
          </CardContent>
        </Card>

        {/* Last Sync */}
        <Card className="bg-gradient-to-br from-indigo-600 to-indigo-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 text-xs font-medium">Última Sincronização</p>
                {lastSyncFinishedAt ? (
                  <div className="text-white text-sm">
                    <span className="font-semibold">
                      {new Date(lastSyncFinishedAt).toLocaleDateString('pt-BR')} {new Date(lastSyncFinishedAt).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    <span className="text-white/80 text-xs block">{lastSyncType === 'manual' ? 'Manual' : 'Agendada'}</span>
                  </div>
                ) : (
                  <p className="text-white/80 text-xs">Nenhuma sincronização</p>
                )}
              </div>
              <RefreshCw className="h-5 w-5 text-white/80" />
            </div>
          </CardContent>
        </Card>

        {/* New Records */}
        <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 text-xs font-medium">Novos</p>
                <p className="text-white text-lg font-bold">{(lastSyncCreated || 0).toLocaleString()}</p>
              </div>
              <PlusCircle className="h-5 w-5 text-white/80" />
            </div>
          </CardContent>
        </Card>

        {/* Updated Records */}
        <Card className="bg-gradient-to-br from-amber-600 to-amber-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 text-xs font-medium">Atualizados</p>
                <p className="text-white text-lg font-bold">{(lastSyncUpdated || 0).toLocaleString()}</p>
              </div>
              <Edit className="h-5 w-5 text-white/80" />
            </div>
          </CardContent>
        </Card>

        {/* Deleted Records */}
        <Card className="bg-gradient-to-br from-red-600 to-red-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 text-xs font-medium">Deletados</p>
                <p className="text-white text-lg font-bold">{(lastSyncDeleted || 0).toLocaleString()}</p>
              </div>
              <Trash2 className="h-5 w-5 text-white/80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={() => setShowImport(true)} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          Importar
        </Button>
        
        <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
        
        <Button onClick={handleSync} disabled={loading || isPolling} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${(loading || isPolling) ? 'animate-spin' : ''}`} />
          {isPolling ? 'Sincronizando...' : 'Sincronizar'}
        </Button>
        
        {currentSync && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowSyncLogModal(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Ver Log
            </Button>
            
            {isLongRunning && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleForceTerminate}
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Forçar Encerramento
              </Button>
            )}
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Wrench className="h-4 w-4 mr-2" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>Manutenção</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Limpa flags pendentes e força re-sincronização completa. Use em caso de estados inconsistentes.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem 
              onClick={handleCleanAndResync}
              disabled={isCleaningAndResyncing || loading || isPolling}
            >
              <RotateCcw className={`h-4 w-4 mr-2 ${isCleaningAndResyncing ? 'animate-spin' : ''}`} />
              Limpar e Re-sincronizar (Full)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exportando...' : 'Exportar'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportAll}>
              Exportar todos os registros
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportFiltered}>
              Exportar registros com filtro ativo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportChanges}>
              Exportar alterações (novos + alterados)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Sync Status and Binary Info */}
      {(currentSync || isPolling) && (
        <div className="flex items-center gap-4 text-sm mb-4 p-3 bg-muted/50 rounded-lg">
          {isPolling && (
            <div className="flex items-center gap-2 text-blue-600">
              <Activity className="h-4 w-4 animate-pulse" />
              <span>Sincronização em andamento...</span>
            </div>
          )}
          
          {currentSync?.excluded_binary_fields && currentSync.excluded_binary_fields.length > 0 && (
            <div className="flex items-center gap-2 text-amber-600">
              <Download className="h-4 w-4" />
              <span>
                Binários excluídos: {currentSync.excluded_binary_fields.join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Content with Tabs */}
      <Tabs defaultValue="data" className="space-y-4">
        <TabsList>
          <TabsTrigger value="data">Dados da Tabela</TabsTrigger>
          <TabsTrigger value="errors" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Erros de Sincronização
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Análise Detalhada
          </TabsTrigger>
          <TabsTrigger value="deleted" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Registros Apagados ({deletedRecordsCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-0">
          <Card className="h-[calc(100vh-450px)]">
            <CardContent className="p-0 h-full">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <Alert className="max-w-md">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              ) : !data || data.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum registro encontrado</p>
                  </div>
                </div>
              ) : displayedRows.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Filter className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum registro corresponde ao filtro selecionado</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setStatusFilter('all')}
                      className="mt-2"
                    >
                      Limpar Filtro
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-auto">
                  <Table className="min-w-max">
                    <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="whitespace-nowrap h-9 px-3 text-xs w-32 sticky top-0 bg-background">
                          <div className="flex items-center gap-1">
                            <span>Status</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 hover:bg-muted"
                                    onClick={() => handleSort('status')}
                                  >
                                    <ArrowUpDown className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Ordenar por Status
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableHead>
                        {Array.isArray(columns) && columns.filter(col => visibleColumns.has(col)).map((column) => (
                          <TableHead key={column} className="whitespace-nowrap h-9 px-3 text-xs sticky top-0 bg-background">
                            <div className="flex items-center gap-2">
                              <button
                                className="flex items-center gap-1 hover:text-primary"
                                onClick={() => handleSort(column)}
                                title="Ordenar"
                              >
                                <span className="text-xs sm:text-sm font-medium">{column}</span>
                                <ArrowUpDown className={`h-3.5 w-3.5 ${sort.column === column ? 'text-primary' : 'text-muted-foreground'}`} />
                              </button>
                              <ColumnFilterPopover
                                column={column}
                                value={columnFilters[column] || ''}
                                onChange={(v) => setColumnFilters({ ...columnFilters, [column]: v })}
                                onClear={() => { const { [column]: _, ...rest } = columnFilters; setColumnFilters(rest); }}
                              />
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(displayedRows) && displayedRows.map((record, index) => {
                        // Use the centralized status calculation
                        const statusValue = getRecordStatus(record) as 'new' | 'updated' | 'unchanged' | 'deleted';
                        
                        return (
                          <TableRow
                            key={index}
                            ref={(el) => { rowRefs.current[index] = el; }}
                            className={`h-9 hover:bg-muted/50 ${hoveredRowIndex === index ? 'bg-primary/10' : ''}`}
                            onMouseEnter={() => setHoveredRowIndex(index)}
                            onMouseLeave={() => setHoveredRowIndex(undefined)}
                          >
                            <TableCell className="whitespace-nowrap px-3 py-1 text-xs">
                              <StatusBadge 
                                status={statusValue} 
                                recordHash={record?.record_hash} 
                                updatedAt={record?.updated_at} 
                                isPendingDeletion={record?.pending_deletion === true}
                                row={record}
                              />
                            </TableCell>
                            {columns.filter(col => visibleColumns.has(col)).map((column) => (
                              <TableCell key={column} className="whitespace-nowrap px-3 py-1 text-xs">
                                {formatCellValue(record[column])}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {/* Show filtered count when filter is applied */}
                  {statusFilter !== 'all' && (
                    <div className="sticky bottom-0 bg-background border-t p-2 text-sm text-muted-foreground text-center">
                      Mostrando {displayedRows.length} de {data.length} registros 
                      (filtro: {statusFilter === 'new' ? 'Novos' : statusFilter === 'updated' ? 'Atualizados' : statusFilter === 'deleted' ? 'Apagados' : statusFilter === 'unchanged' ? 'Inalterados' : 'Inalterados'})
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtro:</span>
              <div className="inline-flex rounded-md border p-1">
                <Button
                  variant={showOnlyLastErrors ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setShowOnlyLastErrors(true)}
                >
                  Última sincronização
                </Button>
                <Button
                  variant={!showOnlyLastErrors ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setShowOnlyLastErrors(false)}
                >
                  Todas
                </Button>
              </div>
            </div>
          </div>
          {showOnlyLastErrors && !lastSyncLogId ? (
            <Alert>
              <AlertDescription>
                Nenhuma execução anterior encontrada para filtrar. Exibindo todos os erros.
              </AlertDescription>
            </Alert>
          ) : null}
          <ProtheusSyncErrorsViewer tableId={tableId} syncLogId={showOnlyLastErrors ? (lastSyncLogId || undefined) : undefined} />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-0">
          <MissingRecordsAnalyzer tableId={tableId} />
        </TabsContent>

        <TabsContent value="deleted" className="space-y-0">
          <DeletedRecordsTab
            deletedRecordsData={deletedRecordsData}
            deletedRecordsLoading={deletedRecordsLoading}
            deletedRecordsCount={deletedRecordsCount}
            columns={columns}
            visibleColumns={visibleColumns}
            fetchDeletedRecords={fetchDeletedRecords}
            restoreDeletedRecord={restoreDeletedRecord}
            tableId={tableId || ''}
          />
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {!loading && !error && data.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Registros por página:
                </span>
                <Select
                  value={pagination.limit.toString()}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Página {pagination.page} de {maxPage} ({totalCount.toLocaleString()} registros)
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={pagination.page >= maxPage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <ProtheusCSVImportModal
        open={showImport}
        onOpenChange={setShowImport}
        tableId={tableId}
        columns={columns}
        onImported={refreshData}
      />
      
        <SyncLogModal
          open={showSyncLogModal}
          onOpenChange={setShowSyncLogModal}
          syncLog={currentSync}
        />
      </div>
    </SectionErrorBoundary>
  );
}
