
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useCommercialRepresentatives } from '@/hooks/useCommercialRepresentatives';
import { CommercialRepresentativeModal } from './CommercialRepresentativeModal';
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CommercialRepresentativesListProps {
  context: 'sales' | 'purchases';
}

export const CommercialRepresentativesList: React.FC<CommercialRepresentativesListProps> = ({
  context,
}) => {
  const { toast } = useToast();
  const { listQuery, deleteMutation } = useCommercialRepresentatives(context);

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter representatives based on search term
  const filteredRepresentatives = listQuery.data?.filter(rep => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return rep.company_name.toLowerCase().includes(search);
  }) || [];

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o representante "${name}"?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: "Sucesso",
        description: "Representante comercial excluído com sucesso",
      });
    } catch (error) {
      console.error('Error deleting representative:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir representante comercial",
        variant: "destructive",
      });
    }
  };

  const contextLabel = context === 'sales' ? 'Vendas' : 'Compras';

  if (listQuery.isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner text="Carregando representantes comerciais..." />
      </div>
    );
  }

  if (listQuery.error) {
    return (
      <div className="text-center py-8 text-destructive">
        Erro ao carregar representantes comerciais: {listQuery.error instanceof Error ? listQuery.error.message : 'Erro desconhecido'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar representantes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Cadastrar Representante Comercial
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Protheus</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-[70px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRepresentatives.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'Nenhum representante encontrado' : 'Nenhum representante cadastrado'}
                </TableCell>
              </TableRow>
            ) : (
              filteredRepresentatives.map((rep) => (
                <TableRow key={rep.id}>
                  <TableCell className="font-medium">{rep.company_name}</TableCell>
                  <TableCell>
                    {rep.is_registered_in_protheus ? (
                      <Badge variant="secondary">
                        Vinculado ({rep.supplier_cod}/{rep.supplier_loja})
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        Não vinculado
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(rep.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(rep.id, rep.company_name)}
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Total */}
      {filteredRepresentatives.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Total: {filteredRepresentatives.length} representante(s) de {contextLabel.toLowerCase()}
        </div>
      )}

      {/* Create Modal */}
      <CommercialRepresentativeModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        context={context}
      />
    </div>
  );
};
