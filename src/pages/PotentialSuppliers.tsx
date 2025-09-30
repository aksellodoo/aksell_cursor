import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Building2, ExternalLink } from "lucide-react";
import { usePotentialSuppliers } from "@/hooks/usePotentialSuppliers";
import { useSiteCities } from "@/hooks/useSiteCities";
import { useBuyers } from "@/hooks/useBuyers";
import { PotentialSupplierCreateFullscreen } from "@/components/PotentialSupplierCreateFullscreen";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

const MATERIAL_TYPE_LABELS = {
  materias_primas: "Matérias Primas",
  embalagens: "Embalagens",
  indiretos: "Indiretos",
  transportadora: "Transportadora",
  servicos: "Serviços"
};

const SOURCE_CHANNEL_LABELS = {
  indicacao_referencia: "Indicação/Referência",
  pesquisa_propria: "Pesquisa Própria",
  abordagem_proativa: "Abordagem Proativa",
  base_interna: "Base Interna",
  outros: "Outros"
};

const PotentialSuppliers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<string | null>(null);
  
  const { listQuery, deleteMutation } = usePotentialSuppliers();
  const { cities, isLoading: citiesLoading } = useSiteCities();
  const { listQuery: buyersQuery } = useBuyers();
  
  const suppliers = listQuery.data || [];
  const buyers = buyersQuery.data || [];

  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.trade_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.legal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.cnpj?.includes(searchTerm) ||
    supplier.website?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.pf_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCityName = (cityId?: string) => {
    if (!cityId) return "N/A";
    const city = cities.find(c => c.id === cityId);
    return city ? `${city.name}, ${city.uf}` : "N/A";
  };

  const getBuyerName = (buyerCod?: string) => {
    if (!buyerCod) return "N/A";
    const buyer = buyers.find(b => b.buyer.y1_cod === buyerCod)?.buyer;
    return buyer ? buyer.y1_nome : buyerCod;
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleEdit = (supplierId: string) => {
    setEditingSupplier(supplierId);
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingSupplier(null);
  };

  if (listQuery.isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Potenciais Fornecedores</h1>
            <p className="text-muted-foreground">
              Gerencie potenciais fornecedores e suas informações
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por código PF, nome, CNPJ ou website..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredSuppliers.length} de {suppliers.length} fornecedores
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PF-código</TableHead>
              <TableHead>Nome Fantasia</TableHead>
              <TableHead>Razão Social</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Comprador</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Materiais</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.map((supplier) => (
              <TableRow key={supplier.id} className="hover:bg-muted/50">
                <TableCell>
                  <Badge variant="outline" className="text-xs font-mono">
                    {supplier.pf_code || (supplier.pf_number ? `PF-${supplier.pf_number}` : 'PF-???')}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {supplier.trade_name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {supplier.legal_name || "-"}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {supplier.cnpj || "-"}
                </TableCell>
                <TableCell>
                  {getCityName(supplier.city_id)}
                </TableCell>
                <TableCell>
                  {getBuyerName(supplier.assigned_buyer_cod)}
                </TableCell>
                <TableCell>
                  {supplier.website ? (
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">{supplier.website}</span>
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {supplier.material_types && supplier.material_types.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {supplier.material_types.map((type) => (
                        <Badge 
                          key={type.id} 
                          variant="secondary" 
                          className="text-xs flex items-center gap-1"
                        >
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: type.color }}
                          />
                          {type.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {supplier.source_channel 
                    ? SOURCE_CHANNEL_LABELS[supplier.source_channel as keyof typeof SOURCE_CHANNEL_LABELS] || supplier.source_channel
                    : "-"
                  }
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(supplier.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o fornecedor "{supplier.trade_name}"? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(supplier.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm 
              ? "Tente ajustar os termos da busca." 
              : "Comece criando seu primeiro potencial fornecedor."
            }
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Fornecedor
            </Button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <PotentialSupplierCreateFullscreen
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        supplierId={editingSupplier}
      />
    </div>
  );
};

export default PotentialSuppliers;