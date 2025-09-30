import React, { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, Users, Edit, MoreHorizontal } from 'lucide-react';
import { useProtheusSyncedData } from '@/hooks/useProtheusSyncedData';
import { useProtheusSupplierGroups } from '@/hooks/useProtheusSupplierGroups';
import { ProtheusRecordViewer } from '@/components/ProtheusRecordViewer';
import { ProtheusTableToolbar } from '@/components/ProtheusTableToolbar';
import { CommercialRepresentativesList } from '@/components/CommercialRepresentativesList';
import { SupplierGroupUnitsModal } from '@/components/SupplierGroupUnitsModal';
import { SupplierGroupNameManager } from '@/components/SupplierGroupNameManager';
import { PROTHEUS_TABLES } from '@/lib/config';

interface SortableHeaderProps {
  field: string;
  children: React.ReactNode;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ field, children, sortField, sortDirection, onSort }) => (
  <TableHead>
    <Button
      variant="ghost"
      onClick={() => onSort(field)}
      className="h-auto p-0 font-medium hover:bg-transparent"
    >
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  </TableHead>
);

const ComprasCadastros = () => {
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showTablePreview, setShowTablePreview] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showGroupUnitsModal, setShowGroupUnitsModal] = useState(false);
  const [showGroupNameModal, setShowGroupNameModal] = useState(false);
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [groupSort, setGroupSort] = useState<{ column: string; direction: 'asc' | 'desc' }>({ column: 'display_name', direction: 'asc' });
  const [groupColumnFilters, setGroupColumnFilters] = useState<Record<string, string>>({});
  const fornecedoresHook = useProtheusSyncedData(PROTHEUS_TABLES.SA2010_FORNECEDORES);
  const supplierGroupsHook = useProtheusSupplierGroups(PROTHEUS_TABLES.SA2010_FORNECEDORES);

  // Filter fields configuration
  const fornecedoresFilterFields = [
    { key: 'a2_filial', label: 'Filial' },
    { key: 'a2_cod', label: 'Código' },
    { key: 'a2_loja', label: 'Loja' },
    { key: 'a2_nome', label: 'Nome' },
    { key: 'a2_nreduz', label: 'Nome Reduzido' },
    { key: 'a2_est', label: 'Estado' }
  ];


  // Filter fields for supplier groups
  const supplierGroupsFilterFields = [
    { key: 'a2_filial', label: 'Filial' },
    { key: 'a2_cod', label: 'Código' },
    { key: 'display_name', label: 'Nome do Grupo' }
  ];

  const handleViewRecord = (record: any) => {
    setSelectedRecord(record);
    setShowTablePreview(true);
  };

  const handleViewGroup = (group: any) => {
    setSelectedGroup(group);
    setShowGroupUnitsModal(true);
  };

  const handleEditGroupName = (group: any) => {
    setSelectedGroup(group);
    setShowGroupNameModal(true);
  };

  const handleGroupSort = (field: string) => {
    const newDirection = groupSort.column === field && groupSort.direction === 'asc' ? 'desc' : 'asc';
    setGroupSort({ column: field, direction: newDirection });
  };


  // Filter and sort groups
  const filteredAndSortedGroups = supplierGroupsHook.groups
    .filter(group => {
      const matchesSearch = 
        group.display_name?.toLowerCase().includes(groupSearchTerm.toLowerCase()) ||
        group.a2_cod?.toLowerCase().includes(groupSearchTerm.toLowerCase()) ||
        group.a2_filial?.toLowerCase().includes(groupSearchTerm.toLowerCase());
      
      const matchesFilters = Object.entries(groupColumnFilters).every(([key, value]) => {
        if (!value) return true;
        const groupValue = group[key as keyof typeof group];
        return groupValue?.toString().toLowerCase().includes(value.toLowerCase());
      });
      
      return matchesSearch && matchesFilters;
    })
    .sort((a, b) => {
      const aValue = a[groupSort.column as keyof typeof a] || '';
      const bValue = b[groupSort.column as keyof typeof b] || '';
      
      if (groupSort.direction === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

  return (
    <PageLayout>
      <div className="space-y-6">

        <div className="space-y-4">
          <Tabs defaultValue="agrupado" className="space-y-4">
              <TabsList>
                <TabsTrigger value="agrupado">Agrupado</TabsTrigger>
                <TabsTrigger value="detalhado">Detalhado</TabsTrigger>
              </TabsList>

              <TabsContent value="agrupado">
                <div className="space-y-4">
                  <ProtheusTableToolbar 
                    searchTerm={groupSearchTerm}
                    onSearchChange={setGroupSearchTerm}
                    columnFilters={groupColumnFilters}
                    onColumnFiltersChange={setGroupColumnFilters}
                    onRefresh={supplierGroupsHook.refreshGroups}
                    loading={supplierGroupsHook.loading}
                    filterFields={supplierGroupsFilterFields}
                  />

                  {supplierGroupsHook.loading && (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner text="Carregando grupos..." />
                    </div>
                  )}

                  {supplierGroupsHook.error && (
                    <div className="text-center text-red-500 py-8">
                      Erro ao carregar dados: {supplierGroupsHook.error}
                    </div>
                  )}

                  {!supplierGroupsHook.loading && !supplierGroupsHook.error && filteredAndSortedGroups.length > 0 && (
                    <div className="rounded-md border">
                      <Table>
                         <TableHeader>
                           <TableRow>
                             <SortableHeader 
                               field="display_name" 
                               sortField={groupSort.column} 
                               sortDirection={groupSort.direction} 
                               onSort={handleGroupSort}
                             >
                               Nome do Grupo
                             </SortableHeader>
                             <SortableHeader 
                               field="a2_filial" 
                               sortField={groupSort.column} 
                               sortDirection={groupSort.direction} 
                               onSort={handleGroupSort}
                             >
                               Filial
                             </SortableHeader>
                             <SortableHeader 
                               field="a2_cod" 
                               sortField={groupSort.column} 
                               sortDirection={groupSort.direction} 
                               onSort={handleGroupSort}
                             >
                               Código
                             </SortableHeader>
                             <TableHead>Unidades</TableHead>
                             <TableHead>Ações</TableHead>
                           </TableRow>
                         </TableHeader>
                        <TableBody>
                          {filteredAndSortedGroups.map((group: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {group.display_name || `Grupo ${group.a2_filial}-${group.a2_cod}`}
                              </TableCell>
                              <TableCell className="font-mono text-sm">{group.a2_filial}</TableCell>
                              <TableCell className="font-mono text-sm">{group.a2_cod}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {group.unit_count} unidades
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewGroup(group)}
                                  >
                                    <Users className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditGroupName(group)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {!supplierGroupsHook.loading && !supplierGroupsHook.error && filteredAndSortedGroups.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      Nenhum grupo encontrado
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="detalhado">
                <div className="space-y-4">
                  <ProtheusTableToolbar 
                    searchTerm={fornecedoresHook.searchTerm}
                    onSearchChange={fornecedoresHook.setSearchTerm}
                    columnFilters={fornecedoresHook.columnFilters}
                    onColumnFiltersChange={fornecedoresHook.setColumnFilters}
                    onRefresh={fornecedoresHook.refreshData}
                    loading={fornecedoresHook.loading}
                    filterFields={fornecedoresFilterFields}
                  />

                  {fornecedoresHook.loading && (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner text="Carregando fornecedores..." />
                    </div>
                  )}

                  {fornecedoresHook.error && (
                    <div className="text-center text-red-500 py-8">
                      Erro ao carregar dados: {fornecedoresHook.error}
                    </div>
                  )}

                  {!fornecedoresHook.loading && !fornecedoresHook.error && fornecedoresHook.data?.length > 0 && (
                    <>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <SortableHeader 
                                field="a2_filial" 
                                sortField={fornecedoresHook.sort?.column || ''} 
                                sortDirection={fornecedoresHook.sort?.direction || 'asc'} 
                                onSort={(field) => fornecedoresHook.setSort(field, fornecedoresHook.sort?.column === field && fornecedoresHook.sort?.direction === 'asc' ? 'desc' : 'asc')}
                              >
                                Filial
                              </SortableHeader>
                              <SortableHeader 
                                field="a2_cod" 
                                sortField={fornecedoresHook.sort?.column || ''} 
                                sortDirection={fornecedoresHook.sort?.direction || 'asc'} 
                                onSort={(field) => fornecedoresHook.setSort(field, fornecedoresHook.sort?.column === field && fornecedoresHook.sort?.direction === 'asc' ? 'desc' : 'asc')}
                              >
                                Código
                              </SortableHeader>
                              <SortableHeader 
                                field="a2_loja" 
                                sortField={fornecedoresHook.sort?.column || ''} 
                                sortDirection={fornecedoresHook.sort?.direction || 'asc'} 
                                onSort={(field) => fornecedoresHook.setSort(field, fornecedoresHook.sort?.column === field && fornecedoresHook.sort?.direction === 'asc' ? 'desc' : 'asc')}
                              >
                                Loja
                              </SortableHeader>
                              <SortableHeader 
                                field="a2_nome" 
                                sortField={fornecedoresHook.sort?.column || ''} 
                                sortDirection={fornecedoresHook.sort?.direction || 'asc'} 
                                onSort={(field) => fornecedoresHook.setSort(field, fornecedoresHook.sort?.column === field && fornecedoresHook.sort?.direction === 'asc' ? 'desc' : 'asc')}
                              >
                                Nome
                              </SortableHeader>
                              <SortableHeader 
                                field="a2_nreduz" 
                                sortField={fornecedoresHook.sort?.column || ''} 
                                sortDirection={fornecedoresHook.sort?.direction || 'asc'} 
                                onSort={(field) => fornecedoresHook.setSort(field, fornecedoresHook.sort?.column === field && fornecedoresHook.sort?.direction === 'asc' ? 'desc' : 'asc')}
                              >
                                Nome Reduzido
                              </SortableHeader>
                              <SortableHeader 
                                field="a2_est" 
                                sortField={fornecedoresHook.sort?.column || ''} 
                                sortDirection={fornecedoresHook.sort?.direction || 'asc'} 
                                onSort={(field) => fornecedoresHook.setSort(field, fornecedoresHook.sort?.column === field && fornecedoresHook.sort?.direction === 'asc' ? 'desc' : 'asc')}
                              >
                                Estado
                              </SortableHeader>
                              <TableHead>Status</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {fornecedoresHook.data.map((fornecedor: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell className="font-mono text-sm">{fornecedor.a2_filial}</TableCell>
                                <TableCell className="font-mono text-sm">{fornecedor.a2_cod}</TableCell>
                                <TableCell className="font-mono text-sm">{fornecedor.a2_loja}</TableCell>
                                <TableCell className="font-medium">{fornecedor.a2_nome}</TableCell>
                                <TableCell>{fornecedor.a2_nreduz}</TableCell>
                                <TableCell>{fornecedor.a2_est}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">Ativo</Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewRecord(fornecedor)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination */}
                      <div className="flex items-center justify-between px-2">
                        <div className="text-sm text-muted-foreground">
                          Mostrando {((fornecedoresHook.pagination?.page || 1) - 1) * (fornecedoresHook.pagination?.limit || 20) + 1} a {Math.min(((fornecedoresHook.pagination?.page || 1) * (fornecedoresHook.pagination?.limit || 20)), fornecedoresHook.totalCount || 0)} de {fornecedoresHook.totalCount || 0} fornecedores
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fornecedoresHook.setPagination((fornecedoresHook.pagination?.page || 1) - 1, fornecedoresHook.pagination?.limit || 20)}
                            disabled={(fornecedoresHook.pagination?.page || 1) === 1}
                          >
                            Anterior
                          </Button>
                          <div className="text-sm">
                            Página {fornecedoresHook.pagination?.page || 1} de {Math.ceil((fornecedoresHook.totalCount || 0) / (fornecedoresHook.pagination?.limit || 20))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fornecedoresHook.setPagination((fornecedoresHook.pagination?.page || 1) + 1, fornecedoresHook.pagination?.limit || 20)}
                            disabled={(fornecedoresHook.pagination?.page || 1) >= Math.ceil((fornecedoresHook.totalCount || 0) / (fornecedoresHook.pagination?.limit || 20))}
                          >
                            Próxima
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  {!fornecedoresHook.loading && !fornecedoresHook.error && fornecedoresHook.data?.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      Nenhum fornecedor encontrado
                    </div>
                  )}
                </div>
              </TabsContent>
          </Tabs>
        </div>

        {showTablePreview && selectedRecord && (
          <ProtheusRecordViewer
            open={showTablePreview}
            onOpenChange={setShowTablePreview}
            tableId={PROTHEUS_TABLES.SA2010_FORNECEDORES}
            recordId={selectedRecord.id}
            tableName="Fornecedores"
            titleFields={['a2_cod', 'a2_nome']}
            fetchRecordById={fornecedoresHook.fetchRecordById}
          />
        )}

        {showGroupUnitsModal && selectedGroup && (
          <SupplierGroupUnitsModal
            open={showGroupUnitsModal}
            onOpenChange={setShowGroupUnitsModal}
            group={selectedGroup}
            onViewRecord={handleViewRecord}
          />
        )}

        {showGroupNameModal && selectedGroup && (
          <SupplierGroupNameManager
            group={selectedGroup}
            open={showGroupNameModal}
            onOpenChange={setShowGroupNameModal}
            onUpdate={() => {
              supplierGroupsHook.refreshGroups();
              setShowGroupNameModal(false);
            }}
          />
        )}

      </div>
    </PageLayout>
  );
};

export default ComprasCadastros;
