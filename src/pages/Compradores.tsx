import React, { useState } from 'react';
import { CustomFullscreenModal } from '@/components/ui/custom-fullscreen-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, X, Users, UserPlus, Check, MoreHorizontal, Link2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useProtheusSyncedData } from '@/hooks/useProtheusSyncedData';
import { ProtheusTableToolbar } from '@/components/ProtheusTableToolbar';
import { ProtheusRecordViewer } from '@/components/ProtheusRecordViewer';
import { BuyerUserLinkModal } from '@/components/BuyerUserLinkModal';
import { useBuyerUserLinks } from '@/hooks/useBuyerUserLinks';
import { useProfiles } from '@/hooks/useProfiles';
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

const Compradores = () => {
  const navigate = useNavigate();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showTablePreview, setShowTablePreview] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null);
  const [showBuyerLinkModal, setShowBuyerLinkModal] = useState(false);

  const compradoresHook = useProtheusSyncedData(PROTHEUS_TABLES.SY1010_COMPRADORES);
  const { getLinkByBuyerCode } = useBuyerUserLinks();
  const { profiles } = useProfiles();

  const handleClose = () => {
    navigate("/compras/cadastros");
  };

  const handleViewRecord = (record: any) => {
    setSelectedRecord(record);
    setShowTablePreview(true);
  };

  const handleLinkBuyer = (buyer: any) => {
    setSelectedBuyer(buyer);
    setShowBuyerLinkModal(true);
  };

  const getLinkedUserName = (buyerCode: string) => {
    const link = getLinkByBuyerCode(buyerCode);
    if (!link) return null;
    
    const user = profiles?.find(p => p.id === link.user_id);
    return user?.name || 'Usuário não encontrado';
  };

  const compradoresFilterFields = [
    { key: 'y1_filial', label: 'Filial' },
    { key: 'y1_user', label: 'Código' },
    { key: 'y1_nome', label: 'Nome' },
    { key: 'y1_depto', label: 'Departamento' }
  ];

  return (
    <CustomFullscreenModal
      isOpen={true}
      onClose={handleClose}
      className="bg-background"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-card">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Compradores</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie compradores do Protheus
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <ProtheusTableToolbar 
                  searchTerm={compradoresHook.searchTerm}
                  onSearchChange={compradoresHook.setSearchTerm}
                  columnFilters={compradoresHook.columnFilters}
                  onColumnFiltersChange={compradoresHook.setColumnFilters}
                  onRefresh={compradoresHook.refreshData}
                  loading={compradoresHook.loading}
                  filterFields={compradoresFilterFields}
                />

                {compradoresHook.loading && (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner text="Carregando compradores..." />
                  </div>
                )}

                {compradoresHook.error && (
                  <div className="text-center text-red-500 py-8">
                    Erro ao carregar dados: {compradoresHook.error}
                  </div>
                )}

                {!compradoresHook.loading && !compradoresHook.error && compradoresHook.data?.length > 0 && (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <SortableHeader 
                              field="y1_filial" 
                              sortField={compradoresHook.sort?.column || ''} 
                              sortDirection={compradoresHook.sort?.direction || 'asc'} 
                              onSort={(field) => compradoresHook.setSort(field, compradoresHook.sort?.column === field && compradoresHook.sort?.direction === 'asc' ? 'desc' : 'asc')}
                            >
                              Filial
                            </SortableHeader>
                            <SortableHeader 
                              field="y1_user" 
                              sortField={compradoresHook.sort?.column || ''} 
                              sortDirection={compradoresHook.sort?.direction || 'asc'} 
                              onSort={(field) => compradoresHook.setSort(field, compradoresHook.sort?.column === field && compradoresHook.sort?.direction === 'asc' ? 'desc' : 'asc')}
                            >
                              Código
                            </SortableHeader>
                            <SortableHeader 
                              field="y1_nome" 
                              sortField={compradoresHook.sort?.column || ''} 
                              sortDirection={compradoresHook.sort?.direction || 'asc'} 
                              onSort={(field) => compradoresHook.setSort(field, compradoresHook.sort?.column === field && compradoresHook.sort?.direction === 'asc' ? 'desc' : 'asc')}
                            >
                              Nome
                            </SortableHeader>
                            <SortableHeader 
                              field="y1_depto" 
                              sortField={compradoresHook.sort?.column || ''} 
                              sortDirection={compradoresHook.sort?.direction || 'asc'} 
                              onSort={(field) => compradoresHook.setSort(field, compradoresHook.sort?.column === field && compradoresHook.sort?.direction === 'asc' ? 'desc' : 'asc')}
                            >
                              Departamento
                            </SortableHeader>
                            <TableHead>Usuário Vinculado</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {compradoresHook.data.map((comprador: any, index: number) => {
                            const linkedUserName = getLinkedUserName(comprador.y1_user);
                            
                            return (
                              <TableRow key={index}>
                                <TableCell className="font-mono text-sm">{comprador.y1_filial}</TableCell>
                                <TableCell className="font-mono text-sm">{comprador.y1_user}</TableCell>
                                <TableCell className="font-medium">{comprador.y1_nome}</TableCell>
                                <TableCell>{comprador.y1_depto}</TableCell>
                                <TableCell>
                                  {linkedUserName ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleLinkBuyer(comprador)}
                                      className="h-auto p-1 text-green-600 hover:text-green-700"
                                    >
                                      <div className="flex items-center gap-1">
                                        <Check className="h-3 w-3" />
                                        <span className="text-xs">{linkedUserName}</span>
                                      </div>
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleLinkBuyer(comprador)}
                                      className="h-auto p-1 text-muted-foreground hover:text-primary"
                                    >
                                      <div className="flex items-center gap-1">
                                        <UserPlus className="h-3 w-3" />
                                        <span className="text-xs">Vincular</span>
                                      </div>
                                    </Button>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">Ativo</Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewRecord(comprador)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleLinkBuyer(comprador)}>
                                          <Link2 className="h-4 w-4 mr-2" />
                                          Vincular usuário
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-2">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {((compradoresHook.pagination?.page || 1) - 1) * (compradoresHook.pagination?.limit || 20) + 1} a {Math.min(((compradoresHook.pagination?.page || 1) * (compradoresHook.pagination?.limit || 20)), compradoresHook.totalCount || 0)} de {compradoresHook.totalCount || 0} compradores
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => compradoresHook.setPagination((compradoresHook.pagination?.page || 1) - 1, compradoresHook.pagination?.limit || 20)}
                          disabled={(compradoresHook.pagination?.page || 1) === 1}
                        >
                          Anterior
                        </Button>
                        <div className="text-sm">
                          Página {compradoresHook.pagination?.page || 1} de {Math.ceil((compradoresHook.totalCount || 0) / (compradoresHook.pagination?.limit || 20))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => compradoresHook.setPagination((compradoresHook.pagination?.page || 1) + 1, compradoresHook.pagination?.limit || 20)}
                          disabled={(compradoresHook.pagination?.page || 1) >= Math.ceil((compradoresHook.totalCount || 0) / (compradoresHook.pagination?.limit || 20))}
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {!compradoresHook.loading && !compradoresHook.error && compradoresHook.data?.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    Nenhum comprador encontrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {showTablePreview && selectedRecord && (
          <ProtheusRecordViewer
            open={showTablePreview}
            onOpenChange={setShowTablePreview}
            tableId={PROTHEUS_TABLES.SY1010_COMPRADORES}
            recordId={selectedRecord.id}
            tableName="Compradores"
            titleFields={['y1_user', 'y1_nome']}
            fetchRecordById={compradoresHook.fetchRecordById}
          />
        )}

        {showBuyerLinkModal && selectedBuyer && (
          <BuyerUserLinkModal
            open={showBuyerLinkModal}
            onOpenChange={setShowBuyerLinkModal}
            buyer={selectedBuyer}
          />
        )}
      </div>
    </CustomFullscreenModal>
  );
};

export default Compradores;