import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ContactEntity {
  id: string;
  type: string;
  name: string;
  notes?: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type CreateContactEntityData = {
  type: string;
  name: string;
  notes?: string;
};

export type UpdateContactEntityData = Partial<CreateContactEntityData>;

export function useContactEntities() {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: entities = [], isLoading: isFetching, error } = useQuery({
    queryKey: ['contact-entities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_entities')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as ContactEntity[];
    }
  });

  const createEntityMutation = useMutation({
    mutationFn: async (entityData: CreateContactEntityData) => {
      const { data, error } = await supabase
        .from('contact_entities')
        .insert({
          ...entityData,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-entities'] });
      toast.success('Entidade criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar entidade:', error);
      toast.error('Erro ao criar entidade');
    }
  });

  const updateEntityMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & UpdateContactEntityData) => {
      const { data, error } = await supabase
        .from('contact_entities')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-entities'] });
      toast.success('Entidade atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar entidade:', error);
      toast.error('Erro ao atualizar entidade');
    }
  });

  const deleteEntityMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_entities')
        .update({ status: 'deleted' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-entities'] });
      toast.success('Entidade excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir entidade:', error);
      toast.error('Erro ao excluir entidade');
    }
  });

  const createEntity = async (entityData: CreateContactEntityData): Promise<ContactEntity> => {
    setIsLoading(true);
    try {
      return await createEntityMutation.mutateAsync(entityData);
    } finally {
      setIsLoading(false);
    }
  };

  const updateEntity = async (id: string, updateData: UpdateContactEntityData) => {
    setIsLoading(true);
    try {
      await updateEntityMutation.mutateAsync({ id, ...updateData });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEntity = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteEntityMutation.mutateAsync(id);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    entities,
    isLoading: isLoading || isFetching,
    error,
    createEntity,
    updateEntity,
    deleteEntity,
    isCreating: createEntityMutation.isPending,
    isUpdating: updateEntityMutation.isPending,
    isDeleting: deleteEntityMutation.isPending
  };
}

export function useContactEntity(id?: string) {
  return useQuery({
    queryKey: ['contact-entities', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('contact_entities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as ContactEntity;
    },
    enabled: !!id
  });
}