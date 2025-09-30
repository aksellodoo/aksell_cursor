
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ColumnFilterPopover } from '@/components/ColumnFilterPopover';
import { useProtheusSyncedData } from '@/hooks/useProtheusSyncedData';
import { PROTHEUS_TABLES } from '@/lib/config';
import { Check, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';

export interface SelectedSupplier {
  filial: string;
  cod: string;
  loja: string;
  nome: string;
  nreduz?: string;
  cgc?: string;
}

interface ProtheusSupplierPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (supplier: SelectedSupplier) => void;
  selectedSupplier?: SelectedSupplier | null;
}

export const ProtheusSupplierPicker: React.FC<ProtheusSupplierPickerProps> = ({
  open,
  onOpenChange,
  onSelect,
  selectedSupplier,
}) => {
  const [selectedRow, setSelectedRow] = useState<SelectedSupplier | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  const fornecedoresHook = useProtheusSyncedData(PROTHEUS_TABLES.SA2010_FORNECEDORES);

  // Reset selection when modal opens
  useEffect(() => {
    if (open) {
      setSelectedRow(selectedSupplier || null);
      setColumnFilters({});
      fornecedoresHook.setColumnFilters({});
    }
  }, [open, selectedSupplier]);

  const handleColumnFilter = (column: string, value: string) => {
    const newFilters = { ...columnFilters, [column]: value };
    if (!value) {
      delete newFilters[column];
    }
    setColumnFilters(newFilters);
    
    // Convert to format expected by hook
    fornecedoresHook.setColumnFilters(newFilters);
  };

  const handleSort = (column: string) => {
    const currentSort = fornecedoresHook.sort;
    
    if (currentSort?.column === column) {
      // Toggle direction or remove sort
      if (currentSort.direction === 'asc') {
        fornecedoresHook.setSort(column, 'desc');
      } else {
        fornecedoresHook.setSort(null, 'asc'); // Remove sort
      }
    } else {
      // New sort
      fornecedoresHook.setSort(column, 'asc');
    }
  };

  const getSortIcon = (column: string) => {
    const currentSort = fornecedoresHook.sort;
    if (currentSort?.column !== column) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return currentSort.direction === 'asc' ? 
      <ArrowUp className="w-4 h-4" /> : 
      <ArrowDown className="w-4 h-4" />;
  };

  const handleConfirmSelection = () => {
    if (selectedRow) {
      onSelect(selectedRow);
      onOpenChange(false);
    }
  };

  const handleRowSelect = (record: any) => {
    const supplier: SelectedSupplier = {
      filial: record.a2_filial || '',
      cod: record.a2_cod || '',
      loja: record.a2_loja || '',
      nome: record.a2_nome || '',
      nreduz: record.a2_nreduz || '',
      cgc: record.a2_cgc || '',
    };
    setSelectedRow(supplier);
  };

  const isRowSelected = (record: any) => {
    return selectedRow && 
           selectedRow.filial === (record.a2_filial || '') &&
           selectedRow.cod === (record.a2_cod || '') &&
           selectedRow.loja === (record.a2_loja || '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Selecionar Fornecedor do Protheus</DialogTitle>
          <DialogDescription>
            Escolha um fornecedor da tabela SA2010 para vincular ao representante comercial.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
        {fornecedoresHook.isInitialLoading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner text="Carregando fornecedores..." />
          </div>
        )}

        {fornecedoresHook.error && (
          <div className="text-center py-8 text-destructive">
            Erro ao carregar fornecedores: {fornecedoresHook.error}
          </div>
        )}

        {!fornecedoresHook.isInitialLoading && !fornecedoresHook.error && (
          <ScrollArea className="rounded-md border max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="min-w-[100px]">
                    <div className="flex items-center justify-between">
                      <span>Filial</span>
                      <div className="flex items-center gap-1">
                        <ColumnFilterPopover
                          column="a2_filial"
                          value={columnFilters.a2_filial || ''}
                          onChange={(value) => handleColumnFilter('a2_filial', value)}
                          onClear={() => handleColumnFilter('a2_filial', '')}
                          applyMode="onEnter"
                        >
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Filter className="w-3 h-3" />
                          </Button>
                        </ColumnFilterPopover>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => handleSort('a2_filial')}
                        >
                          {getSortIcon('a2_filial')}
                        </Button>
                      </div>
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    <div className="flex items-center justify-between">
                      <span>Código</span>
                      <div className="flex items-center gap-1">
                        <ColumnFilterPopover
                          column="a2_cod"
                          value={columnFilters.a2_cod || ''}
                          onChange={(value) => handleColumnFilter('a2_cod', value)}
                          onClear={() => handleColumnFilter('a2_cod', '')}
                          applyMode="onEnter"
                        >
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Filter className="w-3 h-3" />
                          </Button>
                        </ColumnFilterPopover>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => handleSort('a2_cod')}
                        >
                          {getSortIcon('a2_cod')}
                        </Button>
                      </div>
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[100px]">
                    <div className="flex items-center justify-between">
                      <span>Loja</span>
                      <div className="flex items-center gap-1">
                        <ColumnFilterPopover
                          column="a2_loja"
                          value={columnFilters.a2_loja || ''}
                          onChange={(value) => handleColumnFilter('a2_loja', value)}
                          onClear={() => handleColumnFilter('a2_loja', '')}
                          applyMode="onEnter"
                        >
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Filter className="w-3 h-3" />
                          </Button>
                        </ColumnFilterPopover>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => handleSort('a2_loja')}
                        >
                          {getSortIcon('a2_loja')}
                        </Button>
                      </div>
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    <div className="flex items-center justify-between">
                      <span>Nome</span>
                      <div className="flex items-center gap-1">
                        <ColumnFilterPopover
                          column="a2_nome"
                          value={columnFilters.a2_nome || ''}
                          onChange={(value) => handleColumnFilter('a2_nome', value)}
                          onClear={() => handleColumnFilter('a2_nome', '')}
                          applyMode="onEnter"
                        >
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Filter className="w-3 h-3" />
                          </Button>
                        </ColumnFilterPopover>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => handleSort('a2_nome')}
                        >
                          {getSortIcon('a2_nome')}
                        </Button>
                      </div>
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[150px]">
                    <div className="flex items-center justify-between">
                      <span>Nome Reduzido</span>
                      <div className="flex items-center gap-1">
                        <ColumnFilterPopover
                          column="a2_nreduz"
                          value={columnFilters.a2_nreduz || ''}
                          onChange={(value) => handleColumnFilter('a2_nreduz', value)}
                          onClear={() => handleColumnFilter('a2_nreduz', '')}
                          applyMode="onEnter"
                        >
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Filter className="w-3 h-3" />
                          </Button>
                        </ColumnFilterPopover>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => handleSort('a2_nreduz')}
                        >
                          {getSortIcon('a2_nreduz')}
                        </Button>
                      </div>
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[150px]">
                    <div className="flex items-center justify-between">
                      <span>CNPJ</span>
                      <div className="flex items-center gap-1">
                        <ColumnFilterPopover
                          column="a2_cgc"
                          value={columnFilters.a2_cgc || ''}
                          onChange={(value) => handleColumnFilter('a2_cgc', value)}
                          onClear={() => handleColumnFilter('a2_cgc', '')}
                          applyMode="onEnter"
                        >
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Filter className="w-3 h-3" />
                          </Button>
                        </ColumnFilterPopover>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => handleSort('a2_cgc')}
                        >
                          {getSortIcon('a2_cgc')}
                        </Button>
                      </div>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fornecedoresHook.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum fornecedor encontrado. Use os filtros para buscar fornecedores específicos.
                    </TableCell>
                  </TableRow>
                ) : (
                  fornecedoresHook.data.map((record: any) => (
                    <TableRow
                      key={record.id}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        isRowSelected(record) ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => handleRowSelect(record)}
                    >
                      <TableCell>
                        {isRowSelected(record) && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {record.a2_filial || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {record.a2_cod || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {record.a2_loja || '-'}
                      </TableCell>
                      <TableCell>{record.a2_nome || '-'}</TableCell>
                      <TableCell>{record.a2_nreduz || '-'}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {record.a2_cgc || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmSelection}
            disabled={!selectedRow}
          >
            Confirmar Seleção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
