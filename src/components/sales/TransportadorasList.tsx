import React, { useState } from 'react';
import { Search, Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProtheusTableToolbar } from '@/components/ProtheusTableToolbar';
import { useProtheusSyncedData } from '@/hooks/useProtheusSyncedData';
import { PROTHEUS_TABLES } from '@/lib/config';

type SortField = 'a4_cod' | 'a4_nome' | 'a4_nreduz' | 'a4_filial';
type SortDirection = 'asc' | 'desc';

export const TransportadorasList = () => {
  const [sortField, setSortField] = useState<SortField>('a4_nome');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const {
    data,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    columnFilters,
    setColumnFilters,
    pagination,
    setPagination,
    refreshData,
  } = useProtheusSyncedData(PROTHEUS_TABLES.SA4010_TRANSPORTADORAS);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => handleSort(field)}
        className="h-auto p-0 font-medium hover:bg-transparent"
      >
        <span className="flex items-center gap-2">
          {children}
          {getSortIcon(field)}
        </span>
      </Button>
    </TableHead>
  );

  // Aplicar ordenação aos dados
  const sortedData = [...(data || [])].sort((a, b) => {
    const aValue = String(a[sortField] || '').toLowerCase();
    const bValue = String(b[sortField] || '').toLowerCase();
    
    if (sortDirection === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erro ao carregar transportadoras: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <ProtheusTableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        onRefresh={refreshData}
        filterFields={[
          { key: 'a4_cod', label: 'Código' },
          { key: 'a4_nome', label: 'Nome' },
          { key: 'a4_nreduz', label: 'Nome Reduzido' },
          { key: 'a4_filial', label: 'Filial' },
          { key: 'a4_cgc', label: 'CGC' },
        ]}
      />

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader field="a4_cod">Código</SortableHeader>
              <SortableHeader field="a4_nome">Nome</SortableHeader>
              <SortableHeader field="a4_nreduz">Nome Reduzido</SortableHeader>
              <SortableHeader field="a4_filial">Filial</SortableHeader>
              <TableHead>CGC</TableHead>
              <TableHead>Inscrição Estadual</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchTerm.trim() || Object.keys(columnFilters).length > 0
                    ? "Nenhuma transportadora encontrada com os critérios de busca"
                    : "Nenhuma transportadora cadastrada"
                  }
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((transportadora: any, index: number) => (
                <TableRow key={`${transportadora.a4_filial}-${transportadora.a4_cod}-${index}`}>
                  <TableCell className="font-mono text-sm">
                    {transportadora.a4_cod || '-'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {transportadora.a4_nome || '-'}
                  </TableCell>
                  <TableCell>
                    {transportadora.a4_nreduz || '-'}
                  </TableCell>
                  <TableCell>
                    {transportadora.a4_filial || '-'}
                  </TableCell>
                  <TableCell>
                    {transportadora.a4_cgc || '-'}
                  </TableCell>
                  <TableCell>
                    {transportadora.a4_inscr || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log('Ver transportadora:', transportadora);
                        // TODO: Implementar modal de visualização se necessário
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
            {Math.min(pagination.page * pagination.limit, pagination.totalPages * pagination.limit)} de{' '}
            {pagination.totalPages * pagination.limit} registros
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(pagination.page - 1, pagination.limit)}
              disabled={pagination.page <= 1}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(pagination.page + 1, pagination.limit)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};