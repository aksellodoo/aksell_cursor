import React, { useState, useEffect } from 'react';
import { FullscreenDialogContent } from '@/components/ui/fullscreen-dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StatusBadge } from '@/components/StatusBadge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ProtheusTableToolbar } from '@/components/ProtheusTableToolbar';
import { useProtheusSyncedData } from '@/hooks/useProtheusSyncedData';
import { supabase } from '@/integrations/supabase/client';
import { X, MoreHorizontal, Eye, ChevronUp, ChevronDown } from 'lucide-react';

interface ClientesDoVendedorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendedor: any;
  onViewRecord: (record: any) => void;
}

export const ClientesDoVendedorModal: React.FC<ClientesDoVendedorModalProps> = ({
  open,
  onOpenChange,
  vendedor,
  onViewRecord
}) => {
  const clientesHook = useProtheusSyncedData('80f17f00-0960-44ac-b810-6f8f1a36ccdc');
  const [relationshipLoading, setRelationshipLoading] = useState(false);

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

  // Load relationship and apply filters when modal opens
  useEffect(() => {
    if (!open || !vendedor) return;

    const loadRelationshipAndFilter = async () => {
      setRelationshipLoading(true);
      
      try {
        // Try to get SA1010_SA3010 relationship
        const { data: relationship, error } = await supabase
          .from('protheus_table_relationships')
          .select('join_fields')
          .eq('name', 'SA1010_SA3010')
          .single();

        let filterToApply: any = {};

        if (relationship && !error && relationship.join_fields) {
          // Use relationship mapping
          const joinFields = relationship.join_fields as any[];
          joinFields.forEach((joinField: any) => {
            if (joinField.sourceField && joinField.targetField) {
              const vendedorValue = vendedor[joinField.targetField];
              if (vendedorValue) {
                filterToApply[joinField.sourceField] = vendedorValue;
              }
            }
          });
        } else {
          // Fallback: use a1_vend = a3_cod
          if (vendedor.a3_cod) {
            filterToApply['a1_vend'] = vendedor.a3_cod;
          }
          if (vendedor.a3_filial) {
            filterToApply['a1_filial'] = vendedor.a3_filial;
          }
        }

        // Apply filters
        clientesHook.setColumnFilters(filterToApply);
      } catch (error) {
        console.error('Error loading relationship:', error);
        // Fallback filter
        const fallbackFilter: any = {};
        if (vendedor.a3_cod) {
          fallbackFilter['a1_vend'] = vendedor.a3_cod;
        }
        if (vendedor.a3_filial) {
          fallbackFilter['a1_filial'] = vendedor.a3_filial;
        }
        clientesHook.setColumnFilters(fallbackFilter);
      } finally {
        setRelationshipLoading(false);
      }
    };

    loadRelationshipAndFilter();
  }, [open, vendedor]);

  // Reset filters when modal closes
  useEffect(() => {
    if (!open) {
      clientesHook.setColumnFilters({});
      clientesHook.setSearchTerm('');
    }
  }, [open]);

  if (!vendedor) return null;

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
          <h2 className="text-2xl font-semibold">
            Clientes de {vendedor.a3_cod} - {vendedor.a3_nome}
          </h2>
          <p className="text-muted-foreground">
            Visualizando clientes vinculados ao vendedor
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
            loading={clientesHook.loading || relationshipLoading}
            filterFields={clientesFilterFields}
          />

          {(clientesHook.loading || relationshipLoading) && (
            <div className="flex justify-center py-8">
              <LoadingSpinner text="Carregando clientes do vendedor..." />
            </div>
          )}

          {!clientesHook.loading && !relationshipLoading && clientesHook.error && (
            <div className="text-center py-8 text-destructive">
              Erro ao carregar dados: {clientesHook.error}
            </div>
          )}

          {!clientesHook.loading && !relationshipLoading && !clientesHook.error && clientesHook.data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cliente encontrado para este vendedor
            </div>
          )}

          {!clientesHook.loading && !relationshipLoading && !clientesHook.error && clientesHook.data.length > 0 && (
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
                      <TableHead className="w-[70px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientesHook.data.map((record: any) => (
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
                  Mostrando {clientesHook.data.length} de {clientesHook.totalCount} registros
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