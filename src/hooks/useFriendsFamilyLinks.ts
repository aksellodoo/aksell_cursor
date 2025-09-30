import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FriendFamilyLink {
  id: string;
  contact_id: string;
  relationship: string;
  relationship_other?: string;
  is_minor: boolean;
  legal_guardian_name?: string;
  legal_guardian_contact?: string;
  usage_types: string[];
  usage_other?: string;
  legal_basis: string;
  has_consent: boolean;
  consent_date?: string;
  contact_restrictions?: string;
  dnc_list: boolean;
  conflict_notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FriendFamilyEmployee {
  id: string;
  link_id: string;
  employee_id: string;
  created_at: string;
}

export type CreateFriendFamilyLinkData = {
  relationship: 'conjuge' | 'filho_filha' | 'pai_mae' | 'amigo' | 'companheiro' | 'outro';
  relationship_other?: string;
  is_minor: boolean;
  legal_guardian_name?: string;
  legal_guardian_contact?: string;
  usage_types: ('emergencia' | 'convites_eventos' | 'beneficios' | 'comunicacao_institucional' | 'outro')[];
  usage_other?: string;
  legal_basis: 'consentimento' | 'legitimo_interesse' | 'obrigacao_legal';
  has_consent: boolean;
  consent_date?: string;
  contact_restrictions?: string;
  dnc_list: boolean;
  conflict_notes?: string;
  employee_ids: string[];
};

export function useFriendsFamilyLinks(contactId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: links = [], isLoading: isFetching, error } = useQuery({
    queryKey: ['friend-family-links', contactId],
    queryFn: async () => {
      if (!contactId) return [];
      
      const { data, error } = await supabase
        .from('contact_friend_family_links')
        .select(`
          *,
          contact_friend_family_link_employees (
            id,
            employee_id
          )
        `)
        .eq('contact_id', contactId);

      if (error) throw error;
      return data as (FriendFamilyLink & { 
        contact_friend_family_link_employees: FriendFamilyEmployee[]
      })[];
    },
    enabled: !!contactId
  });

  const createLinkMutation = useMutation({
    mutationFn: async ({ contactId, linkData }: { contactId: string; linkData: CreateFriendFamilyLinkData }) => {
      const { employee_ids, ...linkFields } = linkData;
      
      // Create the main link
      const { data: link, error: linkError } = await supabase
        .from('contact_friend_family_links')
        .insert({
          contact_id: contactId,
          ...linkFields
        })
        .select()
        .single();

      if (linkError) throw linkError;

      // Create employee relationships
      if (employee_ids.length > 0) {
        const employeeLinks = employee_ids.map(employeeId => ({
          link_id: link.id,
          employee_id: employeeId
        }));

        const { error: employeeError } = await supabase
          .from('contact_friend_family_link_employees')
          .insert(employeeLinks);

        if (employeeError) throw employeeError;
      }

      return link;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-family-links'] });
      toast.success('Vínculo amigos/familiares criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar vínculo:', error);
      toast.error('Erro ao criar vínculo amigos/familiares');
    }
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_friend_family_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-family-links'] });
      toast.success('Vínculo excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir vínculo:', error);
      toast.error('Erro ao excluir vínculo');
    }
  });

  const createLink = async (contactId: string, linkData: CreateFriendFamilyLinkData) => {
    setIsLoading(true);
    try {
      return await createLinkMutation.mutateAsync({ contactId, linkData });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLink = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteLinkMutation.mutateAsync(id);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    links,
    isLoading: isLoading || isFetching,
    error,
    createLink,
    deleteLink,
    isCreating: createLinkMutation.isPending,
    isDeleting: deleteLinkMutation.isPending
  };
}