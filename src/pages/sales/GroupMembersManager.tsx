
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCustomerGroupsWithId } from '@/hooks/useCustomerGroupsWithId';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { GroupMembersManagerContent } from '@/components/GroupMembersManagerContent';
import { GroupDetailsEditForm } from '@/components/GroupDetailsEditForm';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';

export const GroupMembersManager = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const {
    groups,
    fetchGroups,
    deleteGroup,
    loading: hookLoading
  } = useCustomerGroupsWithId();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchGroups();
      setLoading(false);
    };
    loadData();
  }, [fetchGroups]);

  useEffect(() => {
    if (groups.length > 0 && groupId) {
      const group = groups.find(g => g.id_grupo === parseInt(groupId));
      setSelectedGroup(group || null);
    }
  }, [groups, groupId]);

  const handleBack = () => {
    navigate('/vendas/grupos-economicos');
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    
    try {
      await deleteGroup(selectedGroup.id_grupo);
      navigate('/vendas/grupos-economicos');
    } catch (error) {
      console.error('Erro ao excluir grupo:', error);
    }
  };

  const handleGroupUpdate = async () => {
    await fetchGroups();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner text="Carregando grupo..." />
      </div>
    );
  }

  if (!selectedGroup) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Grupo não encontrado</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Grupos
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold">
                Gerenciar Grupo {selectedGroup.id_grupo}
              </h1>
              <p className="text-muted-foreground">
                {selectedGroup.nome_grupo} • {selectedGroup.member_count} membro(s)
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={hookLoading}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Grupo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir o grupo "{selectedGroup.nome_grupo}"? 
                    Esta ação removerá todos os membros e leads do grupo e não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Formulário de edição dos detalhes do grupo */}
        <SectionErrorBoundary sectionName="Detalhes do Grupo">
          <GroupDetailsEditForm 
            group={selectedGroup}
            onUpdate={handleGroupUpdate}
          />
        </SectionErrorBoundary>

        {/* Gestão de membros */}
        <SectionErrorBoundary sectionName="Membros do Grupo">
          <GroupMembersManagerContent
            groupId={selectedGroup.id_grupo}
            groupName={selectedGroup.nome_grupo}
            onClose={handleBack}
          />
        </SectionErrorBoundary>
      </div>
    </div>
  );
};
