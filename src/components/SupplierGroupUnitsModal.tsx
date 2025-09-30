
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StatusBadge } from '@/components/StatusBadge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useProtheusSyncedData } from '@/hooks/useProtheusSyncedData';
import { MoreHorizontal, Eye, X, ChevronUp, ChevronDown } from 'lucide-react';
import { SupplierGroup } from '@/hooks/useProtheusSupplierGroups';
import { PROTHEUS_TABLES } from '@/lib/config';

interface SupplierGroupUnitsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: SupplierGroup | null;
  onViewRecord: (record: any) => void;
}

export const SupplierGroupUnitsModal: React.FC<SupplierGroupUnitsModalProps> = ({
  open,
  onOpenChange,
  group,
  onViewRecord
}) => {
  const [sortField, setSortField] = useState<string>('a2_loja');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const fornecedoresHook = useProtheusSyncedData(PROTHEUS_TABLES.SA2010_FORNECEDORES);

  // Apply filters when modal opens
  useEffect(() => {
    if (!open || !group) return;

    const filters: any = {};
    if (group.a2_filial) {
      filters['a2_filial'] = group.a2_filial;
    }
    if (group.a2_cod) {
      filters['a2_cod'] = group.a2_cod;
    }

    fornecedoresHook.setColumnFilters(filters);
  }, [open, group]);

  // Reset filters when modal closes
  useEffect(() => {
    if (!open) {
      fornecedoresHook.setColumnFilters({});
      fornecedoresHook.setSearchTerm('');
    }
  }, [open]);

  // Sort data based on current sort settings
  const sortedData = useMemo(() => {
    if (!fornecedoresHook.data?.length) return [];
    
    return [...fornecedoresHook.data].sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      // For numeric fields like a2_loja, parse as numbers for proper sorting
      if (sortField === 'a2_loja') {
        const aNum = parseInt(aValue) || 0;
        const bNum = parseInt(bValue) || 0;
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // For text fields, use locale comparison
      const comparison = aValue.toString().localeCompare(bValue.toString());
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [fornecedoresHook.data, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortableHeader: React.FC<{ field: string; children: React.ReactNode }> = ({ field, children }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none" 
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </TableHead>
  );

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                Unidades de {group.display_name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Filial: {group.a2_filial} • Código: {group.a2_cod} • {group.unit_count} unidades
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
        </DialogHeader>

        <div className="space-y-4">
          {fornecedoresHook.loading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner text="Carregando unidades..." />
            </div>
          )}

          {fornecedoresHook.error && (
            <div className="text-center py-8 text-destructive">
              Erro ao carregar dados: {fornecedoresHook.error}
            </div>
          )}

          {!fornecedoresHook.loading && !fornecedoresHook.error && fornecedoresHook.data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma unidade encontrada para este grupo
            </div>
          )}

          {!fornecedoresHook.loading && !fornecedoresHook.error && fornecedoresHook.data.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <SortableHeader field="a2_loja">Loja</SortableHeader>
                    <SortableHeader field="a2_nome">Nome</SortableHeader>
                    <SortableHeader field="a2_nreduz">Nome Reduzido</SortableHeader>
                    <TableHead className="w-[70px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <StatusBadge
                          status={record.record_status || 'unchanged'}
                          recordHash={record.record_hash}
                          updatedAt={record.updated_at}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {record.a2_loja || '-'}
                        </span>
                      </TableCell>
                      <TableCell>{record.a2_nome || '-'}</TableCell>
                      <TableCell>{record.a2_nreduz || '-'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewRecord(record)}>
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
