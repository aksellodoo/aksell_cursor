import { useState, useEffect } from 'react';
import { Plus, Package, Edit, Trash2, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CreateMaterialTypeForm } from './CreateMaterialTypeForm';
import { EditMaterialTypeForm } from './EditMaterialTypeForm';
import { useMaterialTypes, type MaterialType } from '@/hooks/useMaterialTypes';
import { useBuyers } from '@/hooks/useBuyers';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function MaterialTypesSection() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMaterialType, setEditingMaterialType] = useState<MaterialType | null>(null);
  const [buyerQueueCounts, setBuyerQueueCounts] = useState<Record<string, number>>({});
  const { materialTypes, loading, refetch, deleteMaterialType } = useMaterialTypes();
  const { listQuery: buyersQuery } = useBuyers();
  const { toast } = useToast();
  
  const buyers = buyersQuery.data || [];
  
  const getBuyerName = (buyerCode?: string, buyerFilial?: string) => {
    if (!buyerCode || !buyerFilial) return null;
    const buyer = buyers.find(({ buyer }) => 
      buyer.y1_cod === buyerCode && buyer.y1_filial === buyerFilial
    )?.buyer;
    return buyer ? `${buyer.y1_nome} (${buyerCode}/${buyerFilial})` : `${buyerCode}/${buyerFilial}`;
  };

  // Load buyer queue counts
  useEffect(() => {
    const loadQueueCounts = async () => {
      if (materialTypes.length === 0) return;
      
      try {
        const { data, error } = await supabase
          .from('purchases_material_type_buyer_queue')
          .select('material_type_id')
          .in('material_type_id', materialTypes.map(mt => mt.id));

        if (error) throw error;

        const counts: Record<string, number> = {};
        materialTypes.forEach(mt => counts[mt.id] = 0);
        
        data?.forEach(item => {
          counts[item.material_type_id] = (counts[item.material_type_id] || 0) + 1;
        });

        setBuyerQueueCounts(counts);
      } catch (error) {
        console.error('Error loading queue counts:', error);
      }
    };

    loadQueueCounts();
  }, [materialTypes]);

  const handleMaterialTypeCreated = () => {
    setCreateDialogOpen(false);
    refetch();
    toast({
      title: "Sucesso",
      description: "Tipo de material/serviço criado com sucesso",
    });
  };

  const handleEditClick = (materialType: MaterialType) => {
    setEditingMaterialType(materialType);
    setEditDialogOpen(true);
  };

  const handleMaterialTypeUpdated = () => {
    setEditDialogOpen(false);
    setEditingMaterialType(null);
    refetch();
    toast({
      title: "Sucesso",
      description: "Tipo de material/serviço atualizado com sucesso",
    });
  };

  const handleDeleteMaterialType = async (materialType: MaterialType) => {
    try {
      await deleteMaterialType(materialType.id);
      toast({
        title: "Sucesso",
        description: "Tipo de material/serviço excluído com sucesso",
      });
    } catch (error) {
      console.error('Error deleting material type:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir tipo de material",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Tipos de Materiais/Serviços
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Tipos de Materiais/Serviços
        </CardTitle>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Tipo de Material/Serviço
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Tipo de Material/Serviço</DialogTitle>
              <DialogDescription>
                Adicione um novo tipo de material ou serviço para categorização.
              </DialogDescription>
            </DialogHeader>
            <CreateMaterialTypeForm onSuccess={handleMaterialTypeCreated} />
          </DialogContent>
        </Dialog>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Tipo de Material/Serviço</DialogTitle>
              <DialogDescription>
                Atualize as informações do tipo de material ou serviço.
              </DialogDescription>
            </DialogHeader>
            {editingMaterialType && (
              <EditMaterialTypeForm 
                materialType={editingMaterialType}
                onSuccess={handleMaterialTypeUpdated} 
              />
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {materialTypes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Nenhum tipo cadastrado</p>
            <p className="text-sm">Crie o primeiro tipo de material ou serviço clicando no botão acima.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materialTypes.map((type) => (
              <Card key={type.id} className="border-l-4" style={{ borderLeftColor: type.color }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: type.color }}
                        />
                        <h3 className="font-medium text-sm">{type.name}</h3>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        {type.designated_buyer_code && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span className="font-medium">Designado:</span>
                            <span>{getBuyerName(type.designated_buyer_code, type.designated_buyer_filial) || 'Comprador não encontrado'}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{buyerQueueCounts[type.id] || 0} compradores na fila</span>
                        </div>
                      </div>
                      
                      <Badge variant="secondary" className="text-xs">
                        Ativo
                      </Badge>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditClick(type)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o tipo "{type.name}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteMaterialType(type)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}