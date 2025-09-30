
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useFolderOperations = () => {
  const { toast } = useToast();

  const createSubfolder = async (name: string, departmentId: string, parentId?: string) => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          name,
          department_id: departmentId,
          parent_folder_id: parentId || null,
          status: 'active',
          is_root: false,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao criar pasta",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const renameFolder = async (folderId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .update({ name: newName })
        .eq('id', folderId);

      if (error) throw error;
      
      toast({
        title: "Pasta renomeada",
        description: "A pasta foi renomeada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao renomear pasta",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const moveFolder = async (folderId: string, newParentId: string | null) => {
    try {
      const { error } = await supabase
        .from('folders')
        .update({ parent_folder_id: newParentId })
        .eq('id', folderId);

      if (error) throw error;
      
      toast({
        title: "Pasta movida",
        description: "A pasta foi movida com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao mover pasta",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const reorderFolder = async (folderId: string, newOrderIndex: number) => {
    try {
      // For now, just update a simple order field if it exists
      // TODO: Implement when order_index is added to schema
      toast({
        title: "Reordenação não implementada",
        description: "Esta funcionalidade será implementada em breve.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao reordenar pasta",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const archiveFolder = async (folderId: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .update({ status: 'archived' as any })
        .eq('id', folderId);

      if (error) throw error;
      
      toast({
        title: "Pasta arquivada",
        description: "A pasta foi arquivada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao arquivar pasta",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const hideFolder = async (folderId: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .update({ status: 'hidden' as any })
        .eq('id', folderId);

      if (error) throw error;
      
      toast({
        title: "Pasta ocultada",
        description: "A pasta foi ocultada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao ocultar pasta",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const unhideFolder = async (folderId: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .update({ status: 'active' as any })
        .eq('id', folderId);

      if (error) throw error;
      
      toast({
        title: "Pasta reexibida",
        description: "A pasta foi reexibida com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao reexibir pasta",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const mergeFolder = async (sourceFolderId: string, targetFolderId: string) => {
    try {
      // For now, just move documents from source to target manually
      // First, move all documents from source folder to target folder
      const { error: moveDocsError } = await supabase
        .from('documents')
        .update({ folder_id: targetFolderId })
        .eq('folder_id', sourceFolderId);

      if (moveDocsError) throw moveDocsError;

      // Then delete the source folder
      const { error: deleteFolderError } = await supabase
        .from('folders')
        .delete()
        .eq('id', sourceFolderId);

      if (deleteFolderError) throw deleteFolderError;
      
      toast({
        title: "Pastas mescladas",
        description: "As pastas foram mescladas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao mesclar pastas",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;
      
      toast({
        title: "Pasta excluída",
        description: "A pasta foi excluída com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir pasta",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    createSubfolder,
    renameFolder,
    moveFolder,
    reorderFolder,
    archiveFolder,
    hideFolder,
    unhideFolder,
    mergeFolder,
    deleteFolder,
  };
};
