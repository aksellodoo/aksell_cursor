import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FavoriteDocument {
  id: string;
  name: string;
  type: 'document';
  path: string;
  lastAccessed?: string;
  size?: string;
  isFavorite: true;
}

export const useFavoriteDocuments = (limit: number = 5) => {
  const [favoriteDocuments, setFavoriteDocuments] = useState<FavoriteDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFavoriteDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          document_id,
          created_at,
          documents!fk_user_favorites_document_id (
            id,
            name,
            file_size,
            folder_id,
            folders!documents_folder_id_fkey (
              name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const favorites = data?.map((fav: any) => ({
        id: fav.documents?.id,
        name: fav.documents?.name || 'Documento sem nome',
        type: 'document' as const,
        path: fav.documents?.folders?.name || '',
        lastAccessed: fav.created_at,
        size: fav.documents?.file_size ? `${Math.round(fav.documents.file_size / 1024)}KB` : undefined,
        isFavorite: true as const
      })).filter((item: any) => item.id) || []; // Filter out null documents

      setFavoriteDocuments(favorites);
    } catch (error) {
      console.error('Error fetching favorite documents:', error);
      setError(error instanceof Error ? error.message : 'Erro ao buscar documentos favoritos');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (documentId: string, folderId: string) => {
    try {
      // Check if already favorited
      const { data: existing } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('document_id', documentId)
        .single();

      if (existing) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('document_id', documentId);

        if (error) throw error;

        toast({
          title: "Removido dos favoritos",
          description: "Documento removido da lista de favoritos."
        });
      } else {
        // Add to favorites
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');
        
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            document_id: documentId,
            folder_id: folderId
          });

        if (error) throw error;

        toast({
          title: "Adicionado aos favoritos",
          description: "Documento adicionado à lista de favoritos."
        });
      }

      // Refresh the list
      await fetchFavoriteDocuments();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao alterar favorito'
      });
    }
  };

  const checkIsFavorite = async (documentId: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('document_id', documentId)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    fetchFavoriteDocuments();
  }, [limit]);

  return {
    favoriteDocuments,
    loading,
    error,
    toggleFavorite,
    checkIsFavorite,
    refetch: fetchFavoriteDocuments
  };
};