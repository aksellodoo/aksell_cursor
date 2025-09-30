import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, Trash2, Search } from 'lucide-react';

interface Family {
  id: string;
  name: string;
  name_en: string | null;
  is_active: boolean;
  created_at: string;
}

interface FamiliesManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}

export const FamiliesManagerModal: React.FC<FamiliesManagerModalProps> = ({
  open,
  onOpenChange,
  onChanged
}) => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [filteredFamilies, setFilteredFamilies] = useState<Family[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingNameEn, setEditingNameEn] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load families from database
  const loadFamilies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site_product_families')
        .select('*')
        .order('is_active', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      setFamilies(data || []);
    } catch (error) {
      console.error('Erro ao carregar famílias:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar famílias',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter families based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredFamilies(families);
    } else {
      const filtered = families.filter(family =>
        family.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (family.name_en && family.name_en.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredFamilies(filtered);
    }
  }, [families, searchTerm]);

  // Load families when modal opens
  useEffect(() => {
    if (open) {
      loadFamilies();
      setSearchTerm('');
      setEditingId(null);
    }
  }, [open]);

  // Start editing a family
  const startEdit = (family: Family) => {
    setEditingId(family.id);
    setEditingName(family.name);
    setEditingNameEn(family.name_en || '');
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingNameEn('');
  };

  // Save edited family
  const saveEdit = async () => {
    if (!editingId || !editingName.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome da família é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('site_product_families')
        .update({
          name: editingName.trim(),
          name_en: editingNameEn.trim() || null
        })
        .eq('id', editingId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Família atualizada com sucesso'
      });

      setEditingId(null);
      setEditingName('');
      setEditingNameEn('');
      loadFamilies();
      onChanged?.();
    } catch (error) {
      console.error('Erro ao salvar família:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar família',
        variant: 'destructive'
      });
    }
  };

  // Delete family (with usage check)
  const deleteFamily = async (family: Family) => {
    try {
      // Check if family is used in any products
      const { data: products, error: checkError } = await supabase
        .from('site_products')
        .select('id')
        .eq('family_id', family.id)
        .limit(1);

      if (checkError) throw checkError;

      if (products && products.length > 0) {
        toast({
          title: 'Não é possível excluir',
          description: 'Esta família está sendo usada por produtos cadastrados',
          variant: 'destructive'
        });
        return;
      }

      // Confirm deletion
      if (!confirm(`Tem certeza que deseja excluir a família "${family.name}"?`)) {
        return;
      }

      const { error } = await supabase
        .from('site_product_families')
        .delete()
        .eq('id', family.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Família excluída com sucesso'
      });

      loadFamilies();
      onChanged?.();
    } catch (error) {
      console.error('Erro ao excluir família:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir família',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciar Famílias de Produtos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar famílias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome (PT)</TableHead>
                  <TableHead>Nome (EN)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredFamilies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      {searchTerm ? 'Nenhuma família encontrada' : 'Nenhuma família cadastrada'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFamilies.map((family) => (
                    <TableRow key={family.id}>
                      <TableCell>
                        {editingId === family.id ? (
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="h-8"
                            autoFocus
                          />
                        ) : (
                          family.name
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === family.id ? (
                          <Input
                            value={editingNameEn}
                            onChange={(e) => setEditingNameEn(e.target.value)}
                            className="h-8"
                            placeholder="Nome em inglês"
                          />
                        ) : (
                          family.name_en || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={family.is_active ? 'default' : 'secondary'}>
                          {family.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {editingId === family.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={saveEdit}
                                className="h-8 w-8 p-0"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEdit}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEdit(family)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteFamily(family)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};