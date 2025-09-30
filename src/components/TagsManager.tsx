
import React, { useState } from 'react';
import { CustomFullscreenModal } from '@/components/ui/custom-fullscreen-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';
import { useEmailTags } from '@/hooks/useEmailTags';
import { toast } from 'sonner';

interface TagsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TagsManager = ({ isOpen, onClose }: TagsManagerProps) => {
  const { tags, loading, createTag, updateTag, deleteTag } = useEmailTags();
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Digite um nome para a tag');
      return;
    }

    // Verificar se já existe
    const existingTag = tags.find(tag => 
      tag.name.toLowerCase() === newTagName.trim().toLowerCase()
    );
    
    if (existingTag) {
      toast.error('Tag com esse nome já existe');
      return;
    }

    setIsCreating(true);
    try {
      await createTag(newTagName.trim());
      setNewTagName('');
      toast.success('Tag criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar tag:', error);
      toast.error('Erro ao criar tag');
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateTag();
    }
  };

  const handleEditTag = (tag: { id: string; name: string }) => {
    setEditingTag(tag.id);
    setEditingName(tag.name);
  };

  const handleSaveEdit = async () => {
    if (!editingTag || !editingName.trim()) return;
    
    try {
      await updateTag(editingTag, editingName.trim());
      setEditingTag(null);
      setEditingName('');
      toast.success('Tag atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao editar tag:', error);
      toast.error('Erro ao editar tag');
    }
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditingName('');
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta tag?')) return;
    
    try {
      await deleteTag(tagId);
      toast.success('Tag deletada com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar tag:', error);
      toast.error('Erro ao deletar tag');
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <CustomFullscreenModal isOpen={isOpen} onClose={onClose} className="bg-background">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h1 className="text-2xl font-semibold text-foreground">Gerenciar Tags</h1>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl space-y-6">
            {/* Nova Tag */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Criar Nova Tag</Label>
              <div className="flex gap-2">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite o nome da tag..."
                  className="flex-1"
                />
                <Button 
                  onClick={handleCreateTag}
                  disabled={isCreating || !newTagName.trim()}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {isCreating ? 'Criando...' : 'Criar'}
                </Button>
              </div>
            </div>

            {/* Lista de Tags */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tags Existentes</Label>
              {loading ? (
                <p className="text-muted-foreground">Carregando tags...</p>
              ) : tags.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma tag encontrada</p>
              ) : (
                <div className="space-y-1">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-3 border border-border rounded-md bg-card"
                    >
                      {editingTag === tag.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyPress={handleEditKeyPress}
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            className="h-8 px-2"
                          >
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="h-8 px-2"
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm">{tag.name}</span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditTag(tag)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteTag(tag.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </CustomFullscreenModal>
  );
};
