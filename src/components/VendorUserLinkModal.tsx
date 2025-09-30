
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, User, Link } from 'lucide-react';
import { useProfiles } from '@/hooks/useProfiles';
import { useVendorUserLinks } from '@/hooks/useVendorUserLinks';
import { toast } from 'sonner';

interface VendorUserLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: {
    a3_cod?: string;
    a3_nome?: string;
    a3_nreduz?: string;
  };
}

export const VendorUserLinkModal = ({ open, onOpenChange, vendor }: VendorUserLinkModalProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const { profiles, loading: profilesLoading } = useProfiles();
  const { createMutation, updateMutation, deleteMutation, getLinkByVendorCode } = useVendorUserLinks();

  const vendorCode = vendor.a3_cod?.trim() || '';
  const existingLink = getLinkByVendorCode(vendorCode);
  const isLinked = !!existingLink;

  const handleSubmit = async () => {
    if (!vendorCode) {
      toast.error('Código do vendedor não encontrado');
      return;
    }

    if (!selectedUserId && !isLinked) {
      toast.error('Selecione um usuário para vincular');
      return;
    }

    try {
      if (isLinked && !selectedUserId) {
        // Remover vínculo
        await deleteMutation.mutateAsync(existingLink.id);
        toast.success('Vínculo removido com sucesso');
      } else if (isLinked && selectedUserId) {
        // Atualizar vínculo existente
        await updateMutation.mutateAsync({
          id: existingLink.id,
          user_id: selectedUserId
        });
        toast.success('Vínculo atualizado com sucesso');
      } else {
        // Criar novo vínculo
        await createMutation.mutateAsync({
          vendor_code: vendorCode,
          user_id: selectedUserId
        });
        toast.success('Vendedor vinculado com sucesso');
      }

      onOpenChange(false);
      setSelectedUserId('');
    } catch (error) {
      console.error('Erro ao gerenciar vínculo:', error);
      toast.error('Erro ao gerenciar vínculo');
    }
  };

  const handleRemoveLink = async () => {
    if (!existingLink) return;

    try {
      await deleteMutation.mutateAsync(existingLink.id);
      toast.success('Vínculo removido com sucesso');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao remover vínculo:', error);
      toast.error('Erro ao remover vínculo');
    }
  };

  const activeProfiles = profiles?.filter(profile => profile.status === 'active') || [];
  const linkedUser = isLinked ? activeProfiles.find(p => p.id === existingLink.user_id) : null;

  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Vincular Usuário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Vendedor */}
          <div className="bg-muted/30 p-3 rounded-md">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Vendedor</h4>
            <div className="space-y-1">
              <p className="text-sm font-medium">{vendor.a3_nome || 'Nome não disponível'}</p>
              <p className="text-xs text-muted-foreground">
                Código: {vendorCode} • Nome Reduzido: {vendor.a3_nreduz || '-'}
              </p>
            </div>
          </div>

          {/* Status atual do vínculo */}
          {isLinked && (
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Vendedor já vinculado
                </span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">
                {linkedUser?.name || 'Usuário não encontrado'}
              </p>
              <p className="text-xs text-green-500 dark:text-green-500">
                {linkedUser?.email || ''}
              </p>
            </div>
          )}

          {/* Seleção de usuário */}
          <div className="space-y-2">
            <Label htmlFor="user-select">
              {isLinked ? 'Alterar usuário vinculado' : 'Selecionar usuário'}
            </Label>
            <Select 
              value={selectedUserId || (isLinked ? existingLink.user_id : '')} 
              onValueChange={setSelectedUserId}
              disabled={profilesLoading || isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  profilesLoading 
                    ? "Carregando usuários..." 
                    : "Selecione um usuário"
                } />
              </SelectTrigger>
              <SelectContent>
                {activeProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{profile.name}</span>
                      <span className="text-xs text-muted-foreground">{profile.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || profilesLoading || (!selectedUserId && !isLinked)}
              className="w-full"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isLinked
                ? (selectedUserId ? 'Atualizar Vínculo' : 'Remover Vínculo')
                : 'Criar Vínculo'
              }
            </Button>

            {isLinked && selectedUserId && (
              <Button
                variant="destructive"
                onClick={handleRemoveLink}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Remover Vínculo Completamente
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setSelectedUserId('');
              }}
              disabled={isLoading}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
