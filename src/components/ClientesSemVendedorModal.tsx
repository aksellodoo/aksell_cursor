import React, { useState, useEffect } from 'react';
import { FullscreenDialogContent } from '@/components/ui/fullscreen-dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StatusBadge } from '@/components/StatusBadge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ProtheusTableToolbar } from '@/components/ProtheusTableToolbar';
import { useProtheusSyncedData } from '@/hooks/useProtheusSyncedData';
import { useToast } from '@/hooks/use-toast';
import { X, MoreHorizontal, Eye, ChevronUp, ChevronDown, Users, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ClientesSemVendedorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewRecord: (record: any) => void;
}

export const ClientesSemVendedorModal: React.FC<ClientesSemVendedorModalProps> = ({
  open,
  onOpenChange,
  onViewRecord
}) => {
  const clientesHook = useProtheusSyncedData('80f17f00-0960-44ac-b810-6f8f1a36ccdc');
  const [initialFiltersApplied, setInitialFiltersApplied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const getRecordStatus = (record: any): 'new' | 'updated' | 'unchanged' => {
    if (record.is_new_record) return 'new';
    if (record.was_updated_last_sync) return 'updated';
    return 'unchanged';
  };

  const handleSort = (column: string, currentSort: { column: string | null; direction: 'asc' | 'desc' }, setSort: Function) => {
    let newDirection: 'asc' | 'desc' = 'asc';
    
    if (currentSort.column === column) {
      newDirection = currentSort.direction === 'asc' ? 'desc' : 'asc';
    }
    
    setSort(column, newDirection);
  };

  const SortableHeader: React.FC<{ column: string; children: React.ReactNode; sort: { column: string | null; direction: 'asc' | 'desc' }; onSort: Function }> = ({ 
    column, 
    children, 
    sort, 
    onSort 
  }) => (
    <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => onSort(column, sort, handleSort)}>
      <div className="flex items-center gap-1">
        {children}
        {sort.column === column && (
          sort.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </TableHead>
  );

  const clientesFilterFields = [
    { key: 'codeloja', label: 'Cód+Loja', placeholder: 'Ex: 000001-01' },
    { key: 'a1_filial', label: 'Filial', placeholder: 'Ex: 01' },
    { key: 'a1_cod', label: 'Código', placeholder: 'Ex: 000001' },
    { key: 'a1_loja', label: 'Loja', placeholder: 'Ex: 01' },
    { key: 'a1_nome', label: 'Nome', placeholder: 'Ex: Empresa ABC' },
    { key: 'a1_nreduz', label: 'Nome Reduzido', placeholder: 'Ex: ABC Ltda' }
  ];

  // Apply filters for clients without vendor when modal opens
  useEffect(() => {
    if (!open) {
      setInitialFiltersApplied(false);
      return;
    }

    if (!initialFiltersApplied) {
      // Filter for clients with empty or null vendor field
      const customFilters = {
        a1_vend_empty: 'true' // This is a special filter we'll need to handle
      };
      
      clientesHook.setColumnFilters(customFilters);
      setInitialFiltersApplied(true);
    }
  }, [open, initialFiltersApplied]);

  // Reset filters when modal closes
  useEffect(() => {
    if (!open) {
      clientesHook.setColumnFilters({});
      clientesHook.setSearchTerm('');
    }
  }, [open]);

  const handleExportXLS = async () => {
    setExporting(true);
    try {
      // Fetch all data with current filters
      const allData = await clientesHook.fetchAllDataForExport();
      
      // Filter only clients without vendor
      const clientesSemVendedor = allData.filter(record => !record.a1_vend || record.a1_vend.trim() === '');
      
      if (clientesSemVendedor.length === 0) {
        toast({
          title: "Nenhum registro para exportar",
          description: "Não há clientes sem vendedor para exportar.",
          variant: "destructive"
        });
        return;
      }

      // Prepare data for export with proper column mapping
      const exportData = clientesSemVendedor.map(record => ({
        'Status': getRecordStatus(record) === 'new' ? 'Novo' : getRecordStatus(record) === 'updated' ? 'Atualizado' : 'Inalterado',
        'Cód+Loja': record.codeloja || '',
        'Filial': record.a1_filial || '',
        'Código': record.a1_cod || '',
        'Loja': record.a1_loja || '',
        'Nome': record.a1_nome || '',
        'Nome Reduzido': record.a1_nreduz || '',
        'Vendedor': 'Sem vendedor'
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Clientes sem Vendedor');

      // Generate filename with current date
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const filename = `clientes_sem_vendedor_${dateStr}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      toast({
        title: "Exportação concluída",
        description: `${clientesSemVendedor.length} clientes exportados para ${filename}`,
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar os dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
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
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Clientes sem Vendedor
          </h2>
          <p className="text-muted-foreground">
            Clientes que não possuem vendedor vinculado no sistema
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenChange(false)}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="space-y-4">
          <ProtheusTableToolbar
            searchTerm={clientesHook.searchTerm}
            onSearchChange={clientesHook.setSearchTerm}
            columnFilters={clientesHook.columnFilters}
            onColumnFiltersChange={clientesHook.setColumnFilters}
            onRefresh={clientesHook.refreshData}
            loading={clientesHook.loading}
            filterFields={clientesFilterFields}
            middleAction={
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportXLS}
                disabled={exporting || clientesHook.loading}
                className="gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {exporting ? 'Exportando...' : 'Exportar XLS'}
              </Button>
            }
          />

          {clientesHook.loading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner text="Carregando clientes sem vendedor..." />
            </div>
          )}

          {!clientesHook.loading && clientesHook.error && (
            <div className="text-center py-8 text-destructive">
              Erro ao carregar dados: {clientesHook.error}
            </div>
          )}

          {!clientesHook.loading && !clientesHook.error && clientesHook.data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum cliente sem vendedor encontrado</p>
              <p className="text-sm">Todos os clientes possuem vendedores vinculados</p>
            </div>
          )}

          {!clientesHook.loading && !clientesHook.error && clientesHook.data.length > 0 && (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader column="status" sort={clientesHook.sort} onSort={(col: string, sort: any, handler: Function) => handler(col, sort, clientesHook.setSort)}>
                        Status
                      </SortableHeader>
                      <SortableHeader column="codeloja" sort={clientesHook.sort} onSort={(col: string, sort: any, handler: Function) => handler(col, sort, clientesHook.setSort)}>
                        Cód+Loja
                      </SortableHeader>
                      <SortableHeader column="a1_filial" sort={clientesHook.sort} onSort={(col: string, sort: any, handler: Function) => handler(col, sort, clientesHook.setSort)}>
                        Filial
                      </SortableHeader>
                      <SortableHeader column="a1_cod" sort={clientesHook.sort} onSort={(col: string, sort: any, handler: Function) => handler(col, sort, clientesHook.setSort)}>
                        Código
                      </SortableHeader>
                      <SortableHeader column="a1_loja" sort={clientesHook.sort} onSort={(col: string, sort: any, handler: Function) => handler(col, sort, clientesHook.setSort)}>
                        Loja
                      </SortableHeader>
                      <SortableHeader column="a1_nome" sort={clientesHook.sort} onSort={(col: string, sort: any, handler: Function) => handler(col, sort, clientesHook.setSort)}>
                        Nome
                      </SortableHeader>
                      <SortableHeader column="a1_nreduz" sort={clientesHook.sort} onSort={(col: string, sort: any, handler: Function) => handler(col, sort, clientesHook.setSort)}>
                        Nome Reduzido
                      </SortableHeader>
                      <SortableHeader column="a1_vend" sort={clientesHook.sort} onSort={(col: string, sort: any, handler: Function) => handler(col, sort, clientesHook.setSort)}>
                        Vendedor
                      </SortableHeader>
                      <TableHead className="w-[70px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientesHook.data
                      .filter(record => !record.a1_vend || record.a1_vend.trim() === '')
                      .map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <StatusBadge
                            status={getRecordStatus(record)}
                            recordHash={record.record_hash}
                            updatedAt={record.updated_at}
                          />
                        </TableCell>
                        <TableCell>{record.codeloja || '-'}</TableCell>
                        <TableCell>{record.a1_filial || '-'}</TableCell>
                        <TableCell>{record.a1_cod || '-'}</TableCell>
                        <TableCell>{record.a1_loja || '-'}</TableCell>
                        <TableCell>{record.a1_nome || '-'}</TableCell>
                        <TableCell>{record.a1_nreduz || '-'}</TableCell>
                        <TableCell>
                          <span className="text-muted-foreground italic">Sem vendedor</span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => onViewRecord(record)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver registro
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Mostrando {clientesHook.data.filter(r => !r.a1_vend || r.a1_vend.trim() === '').length} de {clientesHook.totalCount} registros
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clientesHook.setPagination(Math.max(1, clientesHook.pagination.page - 1), clientesHook.pagination.limit)}
                    disabled={clientesHook.pagination.page === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clientesHook.setPagination(clientesHook.pagination.page + 1, clientesHook.pagination.limit)}
                    disabled={clientesHook.pagination.page >= clientesHook.pagination.totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </FullscreenDialogContent>
  );
};