import React, { useState } from 'react';
import { Search, Link2, Users, Eye, UserPlus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useVendors, VendorWithUser } from '@/hooks/useVendors';
import { VendorUserLinkModal } from '@/components/VendorUserLinkModal';
import { ClientesDoVendedorModal } from '@/components/ClientesDoVendedorModal';
import { ClientesSemVendedorModal } from '@/components/ClientesSemVendedorModal';
import { useProfiles } from '@/hooks/useProfiles';

export const VendorsManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showClientesModal, setShowClientesModal] = useState(false);
  const [showSemVendedorModal, setShowSemVendedorModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorWithUser['vendor'] | null>(null);

  const { listQuery } = useVendors();
  const { profiles } = useProfiles();

  const filteredVendors = listQuery.data?.filter((vendorWithUser) => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const vendor = vendorWithUser.vendor;
    
    return (
      vendor.a3_cod?.toLowerCase().includes(searchLower) ||
      vendor.a3_nome?.toLowerCase().includes(searchLower) ||
      vendor.a3_nreduz?.toLowerCase().includes(searchLower) ||
      vendor.a3_email?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleVincularUsuario = (vendor: VendorWithUser['vendor']) => {
    setSelectedVendor(vendor);
    setShowLinkModal(true);
  };

  const handleVerClientes = (vendor: VendorWithUser['vendor']) => {
    setSelectedVendor(vendor);
    setShowClientesModal(true);
  };

  const getUserName = (userId?: string) => {
    if (!userId) return null;
    const user = profiles?.find(p => p.id === userId);
    return user?.name || 'Usuário não encontrado';
  };

  if (listQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (listQuery.error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erro ao carregar vendedores: {listQuery.error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por código, nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <Button
          onClick={() => setShowSemVendedorModal(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          Clientes sem Vendedor
        </Button>
      </div>

      {/* Tabela de Vendedores */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Nome Reduzido</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Usuário Vinculado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm.trim() 
                    ? "Nenhum vendedor encontrado com os critérios de busca"
                    : "Nenhum vendedor cadastrado"
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredVendors.map((vendorWithUser) => {
                const vendor = vendorWithUser.vendor;
                const linkedUserName = getUserName(vendorWithUser.linked_user_id);
                
                return (
                  <TableRow key={vendor.a3_cod}>
                    <TableCell className="font-mono text-sm">
                      {vendor.a3_cod}
                    </TableCell>
                    <TableCell className="font-medium">
                      {vendor.a3_nome || '-'}
                    </TableCell>
                    <TableCell>
                      {vendor.a3_nreduz || '-'}
                    </TableCell>
                    <TableCell>
                      {vendor.a3_email || '-'}
                    </TableCell>
                    <TableCell>
                      {linkedUserName ? (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <UserPlus className="h-3 w-3" />
                          {linkedUserName}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Sem vínculo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleVincularUsuario(vendor)}
                            className="flex items-center gap-2"
                          >
                            <Link2 className="h-4 w-4" />
                            {linkedUserName ? 'Alterar Vínculo' : 'Vincular Usuário'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleVerClientes(vendor)}
                            className="flex items-center gap-2"
                          >
                            <Users className="h-4 w-4" />
                            Ver Clientes
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modais */}
      {selectedVendor && (
        <>
          <VendorUserLinkModal
            open={showLinkModal}
            onOpenChange={setShowLinkModal}
            vendor={selectedVendor}
          />
          
          <ClientesDoVendedorModal
            open={showClientesModal}
            onOpenChange={setShowClientesModal}
            vendedor={{
              a3_cod: selectedVendor.a3_cod || '',
              a3_nome: selectedVendor.a3_nome || '',
            }}
            onViewRecord={(record) => {
              console.log('Ver registro:', record);
              // TODO: Implementar visualização de registro se necessário
            }}
          />
        </>
      )}

      <ClientesSemVendedorModal
        open={showSemVendedorModal}
        onOpenChange={setShowSemVendedorModal}
        onViewRecord={(record) => {
          console.log('Ver registro:', record);
          // TODO: Implementar visualização de registro se necessário
        }}
      />
    </div>
  );
};