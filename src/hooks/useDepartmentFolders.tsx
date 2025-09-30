
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Folder {
  id: string;
  department_id: string;
  parent_id?: string | null;
  parent_folder_id?: string | null;
  name: string;
  slug?: string;
  status: 'active' | 'archived' | 'hidden';
  is_root: boolean;
  order_index?: number;
  acl?: any;
  path_cache?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  doc_count?: number;
}

export const useDepartmentFolders = (departmentId: string | null) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFolders = async () => {
    if (!departmentId || departmentId === 'root') {
      setFolders([]);
      return;
    }

    try {
      setLoading(true);
      
      // Usar a view existente para contagens
      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select(`
          *,
          folder_document_counts(doc_count)
        `)
        .eq('department_id', departmentId)
        .eq('status', 'active')
        .order('is_root', { ascending: false })
        .order('name', { ascending: true });

      if (foldersError) throw foldersError;

      // Transformar dados para incluir doc_count
      const foldersWithCounts = (foldersData || []).map(folder => ({
        ...folder,
        parent_id: folder.parent_folder_id, // Map from current schema
        slug: folder.name.toLowerCase().replace(/[^a-z0-9]/g, '-'), // Generate slug
        order_index: 0, // Default value
        doc_count: Array.isArray(folder.folder_document_counts) ? 
          folder.folder_document_counts[0]?.doc_count || 0 : 0
      }));

      setFolders(foldersWithCounts);
    } catch (error) {
      console.error('Error fetching folders:', error);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (name: string, isRoot = false, parentId: string | null = null) => {
    if (!departmentId) return null;

    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          department_id: departmentId,
          name,
          parent_folder_id: parentId,
          is_root: isRoot,
          status: 'active',
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchFolders();
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  };

  const updateFolder = async (folderId: string, updates: Partial<Pick<Folder, 'name' | 'status' | 'parent_id'>>) => {
    try {
      // Map parent_id back to parent_folder_id for current schema
      const schemaUpdates: any = { ...updates };
      if ('parent_id' in updates) {
        schemaUpdates.parent_folder_id = updates.parent_id;
        delete schemaUpdates.parent_id;
      }

      const { error } = await supabase
        .from('folders')
        .update(schemaUpdates)
        .eq('id', folderId);

      if (error) throw error;
      
      await fetchFolders();
    } catch (error) {
      console.error('Error updating folder:', error);
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
      
      await fetchFolders();
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [departmentId]);

  return {
    folders,
    loading,
    refetch: fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  };
};
