import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Edit, Trash, Users, RefreshCw } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from "@/components/ui/skeleton"

interface SupplierGroup {
  id: string;
  name?: string;
  ai_suggested_name?: string;
  supplier_count: number;
  material_types: string[];
  created_at: string;
}

export function UnifiedSupplierGroupsSection() {
  const [groups, setGroups] = useState<SupplierGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchGroups = async () => {
    setLoading(true);
    try {
      // Buscar grupos de fornecedores
      const { data: groupsData, error: groupsError } = await supabase
        .from('protheus_supplier_groups')
        .select(`
          id,
          name,
          ai_suggested_name,
          created_at
        `)
        .order('name', { nullsFirst: false });

      if (groupsError) throw groupsError;

      // Para cada grupo, buscar contagem de fornecedores e tipos de material
      const groupsWithDetails = await Promise.all(
        (groupsData || []).map(async (group) => {
          // Contar fornecedores no grupo
          const { count: supplierCount, error: countError } = await supabase
            .from('purchases_unified_suppliers')
            .select('*', { count: 'exact', head: true })
            .eq('economic_group_id', group.id);

          if (countError) {
            console.error('Error counting suppliers for group:', group.id, countError);
          }

          // Buscar tipos de material do grupo (nova tabela dinâmica)
          const { data: materialTypes, error: materialError } = await supabase
            .from('purchases_supplier_group_material_types')
            .select(`
              material_type_id,
              purchases_material_types:material_type_id (
                id,
                name
              )
            `)
            .eq('group_id', group.id);

          if (materialError) {
            console.error('Error fetching material types for group:', group.id, materialError);
          }

          return {
            ...group,
            supplier_count: supplierCount || 0,
            material_types: materialTypes?.map(mt => mt.purchases_material_types?.name).filter(Boolean) || []
          };
        })
      );

      setGroups(groupsWithDetails);
    } catch (error) {
      console.error('Error fetching supplier groups:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar grupos de fornecedores",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleDeleteGroup = async (group: SupplierGroup) => {
    if (window.confirm(`Tem certeza que deseja excluir o grupo "${group.name || group.ai_suggested_name}"?`)) {
      try {
        const { error } = await supabase
          .from('protheus_supplier_groups')
          .delete()
          .eq('id', group.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Grupo excluído com sucesso"
        });

        fetchGroups();
      } catch (error) {
        console.error('Error deleting group:', error);
        toast({
          title: "Erro",
          description: "Erro ao excluir grupo",
          variant: "destructive"
        });
      }
    }
  };

  const formatMaterialTypes = (types: string[]) => {
    if (types.length === 0) return 'Nenhum';
    
    if (types.length <= 2) {
      return types.join(', ');
    }
    
    return `${types.slice(0, 2).join(', ')} (+${types.length - 2})`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grupos de Fornecedores</CardTitle>
          <CardDescription>Gerenciar grupos econômicos de fornecedores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Grupos de Fornecedores</CardTitle>
            <CardDescription>
              Gerenciar grupos econômicos de fornecedores e tipos de material
            </CardDescription>
          </div>
          <Button onClick={fetchGroups} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Grupo</TableHead>
                <TableHead>Fornecedores</TableHead>
                <TableHead>Tipos de Material</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.length > 0 ? (
                groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">
                      {group.name || group.ai_suggested_name || 'Sem nome'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {group.supplier_count} fornecedor{group.supplier_count !== 1 ? 'es' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatMaterialTypes(group.material_types)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(group.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Users className="mr-2 h-4 w-4" />
                            Ver Membros
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Grupo
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteGroup(group)}
                            className="text-destructive"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Nenhum grupo de fornecedor encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}