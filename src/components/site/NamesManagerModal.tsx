import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAutoTranslation } from '@/hooks/useAutoTranslation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Edit2, Trash2, Languages, RotateCcw, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductName {
  id: string;
  name: string;
  name_en: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface NamesManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNameCreated?: (name: ProductName) => void;
}

export const NamesManagerModal: React.FC<NamesManagerModalProps> = ({
  open,
  onOpenChange,
  onNameCreated
}) => {
  const [productNames, setProductNames] = useState<ProductName[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', name_en: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [newNameForm, setNewNameForm] = useState({ name: '', name_en: '' });
  const { toast } = useToast();

  // Hook de tradução automática
  const { translateText, retranslate, isTranslating } = useAutoTranslation({
    enabled: true,
    debounceMs: 1500
  });

  // Carregar nomes de produtos
  const loadProductNames = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_product_names')
        .select('*')
        .order('name');

      if (error) throw error;
      setProductNames(data || []);
    } catch (error) {
      console.error('Erro ao carregar nomes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os nomes de produtos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadProductNames();
    }
  }, [open]);

  // Filtrar nomes baseado na busca
  const filteredNames = useMemo(() => {
    if (!searchTerm.trim()) return productNames;
    
    return productNames.filter(name =>
      name.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (name.name_en && name.name_en.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [productNames, searchTerm]);

  // Criar novo nome
  const handleCreateName = async () => {
    if (!newNameForm.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Verificar se já existe
      const existingName = productNames.find(
        p => p.name.toLowerCase() === newNameForm.name.trim().toLowerCase()
      );

      if (existingName) {
        toast({
          title: "Erro",
          description: "Já existe um nome com este texto.",
          variant: "destructive",
        });
        return;
      }

      // Obter ID do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Criar nome
      const { data, error } = await supabase
        .from('site_product_names')
        .insert({
          name: newNameForm.name.trim(),
          name_en: newNameForm.name_en.trim() || null,
          is_active: true,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Se não foi fornecido nome em inglês, traduzir automaticamente
        if (!newNameForm.name_en.trim() && data.name) {
          translateText(data.name, `product-name-${data.id}`, async (translatedText) => {
            if (translatedText && translatedText !== data.name) {
              try {
                await supabase
                  .from('site_product_names')
                  .update({ name_en: translatedText })
                  .eq('id', data.id);
                
                // Atualizar estado local
                setProductNames(prev =>
                  prev.map(name =>
                    name.id === data.id ? { ...name, name_en: translatedText } : name
                  )
                );
              } catch (updateError) {
                console.error('Erro ao atualizar tradução:', updateError);
              }
            }
          });
        }

        const newName: ProductName = {
          ...data,
          name_en: newNameForm.name_en.trim() || null
        };

        setProductNames(prev => [newName, ...prev]);
        setNewNameForm({ name: '', name_en: '' });
        onNameCreated?.(newName);

      toast({
        title: "Nome criado",
        description: "Nome criado com sucesso.",
      });

      // Não navegar ou fechar o modal - manter usuário na tela de gerenciamento
      }
    } catch (error) {
      console.error('Erro ao criar nome:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o nome.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Editar nome
  const handleStartEdit = (name: ProductName) => {
    setEditingId(name.id);
    setEditForm({
      name: name.name,
      name_en: name.name_en || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.name.trim()) return;

    try {
      const { error } = await supabase
        .from('site_product_names')
        .update({
          name: editForm.name.trim(),
          name_en: editForm.name_en.trim() || null,
        })
        .eq('id', editingId);

      if (error) throw error;

      setProductNames(prev =>
        prev.map(name =>
          name.id === editingId
            ? { ...name, name: editForm.name.trim(), name_en: editForm.name_en.trim() || null }
            : name
        )
      );

      setEditingId(null);
      setEditForm({ name: '', name_en: '' });

      toast({
        title: "Nome atualizado",
        description: "Nome atualizado com sucesso.",
      });

      // Não navegar ou fechar o modal - manter usuário na tela de gerenciamento
    } catch (error) {
      console.error('Erro ao atualizar nome:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o nome.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', name_en: '' });
  };

  // Alternar status ativo/inativo
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('site_product_names')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setProductNames(prev =>
        prev.map(name =>
          name.id === id ? { ...name, is_active: !currentStatus } : name
        )
      );

      toast({
        title: "Status alterado",
        description: `Nome ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`,
      });

      // Não navegar ou fechar o modal - manter usuário na tela de gerenciamento
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status.",
        variant: "destructive",
      });
    }
  };

  // Retraduzir nome
  const handleRetranslate = async (name: ProductName) => {
    translateText(name.name, `product-name-${name.id}`, async (translatedText) => {
      if (translatedText) {
        try {
          await supabase
            .from('site_product_names')
            .update({ name_en: translatedText })
            .eq('id', name.id);

          setProductNames(prev =>
            prev.map(n =>
              n.id === name.id ? { ...n, name_en: translatedText } : n
            )
          );

          toast({
            title: "Tradução atualizada",
            description: "Tradução foi atualizada com sucesso.",
          });

          // Não navegar ou fechar o modal - manter usuário na tela de gerenciamento
        } catch (error) {
          console.error('Erro ao atualizar tradução:', error);
          toast({
            title: "Erro",
            description: "Não foi possível atualizar a tradução.",
            variant: "destructive",
          });
        }
      }
    });
  };

  // Excluir nome
  const handleDeleteName = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o nome "${name}"?`)) {
      return;
    }

    try {
      // Verificar se existem produtos usando este nome
      const { data: productsUsingName, error: checkError } = await supabase
        .from('site_products')
        .select('id')
        .eq('name_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (productsUsingName && productsUsingName.length > 0) {
        toast({
          title: "Não é possível excluir",
          description: "Este nome está sendo usado por produtos. Remova-o dos produtos primeiro.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('site_product_names')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProductNames(prev => prev.filter(n => n.id !== id));

      toast({
        title: "Nome excluído",
        description: "Nome excluído com sucesso.",
      });

      // Não fechar o modal após exclusão - manter usuário na tela de gerenciamento
    } catch (error) {
      console.error('Erro ao excluir nome:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o nome.",
        variant: "destructive",
      });
    }
  };

  const handleCloseModal = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciar Nomes de Produtos</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Criar novo nome */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Adicionar Novo Nome</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Nome em Português</label>
                  <Input
                    placeholder="Nome do produto..."
                    value={newNameForm.name}
                    onChange={(e) => setNewNameForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Nome em Inglês (opcional)</label>
                  <Input
                    placeholder="Product name..."
                    value={newNameForm.name_en}
                    onChange={(e) => setNewNameForm(prev => ({ ...prev, name_en: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Deixe vazio para tradução automática
                  </p>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleCreateName}
                    disabled={isCreating || !newNameForm.name.trim()}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isCreating ? 'Criando...' : 'Adicionar'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nomes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Tabela de nomes */}
          <div className="flex-1 overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome em Português</TableHead>
                  <TableHead>Nome em Inglês</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredNames.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Nenhum nome encontrado' : 'Nenhum nome cadastrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNames.map((name) => (
                    <TableRow key={name.id}>
                      <TableCell>
                        {editingId === name.id ? (
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full"
                          />
                        ) : (
                          <span className="font-medium">{name.name}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === name.id ? (
                          <Input
                            value={editForm.name_en}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name_en: e.target.value }))}
                            placeholder="Product name..."
                            className="w-full"
                          />
                        ) : (
                          <span className="text-muted-foreground">
                            {name.name_en || 'Não traduzido'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={name.is_active}
                            onCheckedChange={() => handleToggleActive(name.id, name.is_active)}
                          />
                          <Badge variant={name.is_active ? "default" : "secondary"}>
                            {name.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {editingId === name.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSaveEdit}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                           ) : (
                             <>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handleStartEdit(name)}
                                 title="Editar nome"
                               >
                                 <Edit2 className="h-4 w-4" />
                               </Button>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handleRetranslate(name)}
                                 disabled={isTranslating}
                                 title="Retraduzir"
                               >
                                 <RotateCcw className={cn("h-4 w-4", isTranslating && "animate-spin")} />
                               </Button>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handleDeleteName(name.id, name.name)}
                                 className="text-destructive hover:text-destructive"
                                 title="Excluir nome"
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