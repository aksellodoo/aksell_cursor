import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DocumentTreeItem } from '@/pages/DocumentManagement';
import { generateColorFromName } from '@/utils/colorUtils';

interface UseDocumentTreeOptions {
  includeHidden?: boolean;
}

export const useDocumentTree = (options: UseDocumentTreeOptions = {}) => {
  const [tree, setTree] = useState<DocumentTreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { includeHidden = false } = options;

  const fetchTree = async () => {
    try {
      setLoading(true);

      // Build status filter  
      let statusFilter: ('active' | 'archived')[] = ['active'];
      if (includeHidden) statusFilter.push('archived');

      // Fetch departments
      const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          color,
          icon
        `)
        .order('name');

      if (deptError) throw deptError;

      // Fetch folders with document counts
      const { data: folders, error: foldersError } = await supabase
        .from('folders')
        .select(`
          id, 
          name, 
          status,
          department_id,
          parent_folder_id,
          is_root,
          created_at,
          folder_document_counts (
            doc_count
          )
        `)
        .order('name');

      if (foldersError) throw foldersError;

      // Fetch document counts per department
      const { data: docCounts, error: docCountsError } = await supabase
        .from('folder_document_counts')
        .select(`
          doc_count,
          folder:folders!inner (
            department_id
          )
        `);

      if (docCountsError) throw docCountsError;

      // Build tree structure
      const tree: DocumentTreeItem[] = [];

      // Create department nodes
      for (const dept of departments || []) {
        const deptFolders = folders?.filter(f => f.department_id === dept.id) || [];

        // Calculate total doc count for department
        const totalDocCount = docCounts
          ?.filter(count => count.folder?.department_id === dept.id)
          ?.reduce((total, count) => total + (count.doc_count || 0), 0) || 0;

        const deptNode: DocumentTreeItem = {
          id: dept.id,
          name: dept.name,
          type: 'department',
          status: 'active',
          department_id: dept.id,
          doc_count: totalDocCount,
          color: dept.color || generateColorFromName(dept.name),
          icon: dept.icon,
          children: []
        };

        // Build folder hierarchy
        const buildFolderTree = (parentId: string | null, level = 0): DocumentTreeItem[] => {
          return deptFolders
            .filter(f => f.parent_folder_id === parentId)
            .map(folder => ({
              id: folder.id,
              name: folder.name,
              type: 'folder' as const,
              status: folder.status as 'active' | 'archived' | 'hidden',
              department_id: dept.id,
              parent_id: folder.parent_folder_id,
              color: dept.color || generateColorFromName(dept.name),
              icon: dept.icon,
              doc_count: folder.folder_document_counts?.[0]?.doc_count || 0,
              children: buildFolderTree(folder.id, level + 1),
              has_custom_acl: false // TODO: Check for custom ACL
            }));
        };

        deptNode.children = buildFolderTree(null);
        tree.push(deptNode);
      }

      setTree(tree);
    } catch (error) {
      console.error('Error fetching document tree:', error);
      setTree([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, [includeHidden]);

  return {
    tree,
    loading,
    refetch: fetchTree
  };
};