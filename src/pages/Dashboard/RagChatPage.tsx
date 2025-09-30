import React from 'react';
import { RagChatInterface } from '@/components/rag/RagChatInterface';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export const RagChatPage: React.FC = () => {
  // Fetch available documents with chunks
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id, 
          name, 
          folder_id,
          doc_chunks!inner(embedding_type)
        `)
        .order('name');
      
      if (error) throw error;
      
      // Group by document and collect unique embedding types
      const documentsMap = new Map();
      data.forEach(doc => {
        if (!documentsMap.has(doc.id)) {
          documentsMap.set(doc.id, {
            id: doc.id,
            name: doc.name,
            folder_id: doc.folder_id,
            embedding_types: new Set()
          });
        }
        // doc_chunks is an array, iterate through it
        if (doc.doc_chunks && Array.isArray(doc.doc_chunks)) {
          doc.doc_chunks.forEach(chunk => {
            if (chunk.embedding_type) {
              documentsMap.get(doc.id).embedding_types.add(chunk.embedding_type);
            }
          });
        }
      });
      
      return Array.from(documentsMap.values()).map(doc => ({
        id: doc.id,
        name: doc.name,
        folder_id: doc.folder_id,
        embedding_types: Array.from(doc.embedding_types)
      }));
    }
  });

  // Fetch available folders
  const { data: folders, isLoading: foldersLoading } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('id, name, department_id')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch available departments
  const { data: departments, isLoading: departmentsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const isLoading = documentsLoading || foldersLoading || departmentsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando recursos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 h-full">
      <RagChatInterface
        availableDocuments={documents || []}
        availableFolders={folders || []}
        availableDepartments={departments || []}
      />
    </div>
  );
};