
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Contact {
  id: string;
  name: string;
  treatment_type: 'sr' | 'sra' | 'direct' | 'custom';
  custom_treatment?: string | null;
  job_title?: string | null;
  department?: string | null;
  decision_level?: 'estrategico' | 'tatico' | 'operacional' | null;
  responsible_user_id?: string | null;
  responsible_department_id?: string | null;
  email_primary?: string | null;
  mobile_phone?: string | null;
  landline_phone?: string | null;
  messaging_whatsapp?: boolean;
  messaging_telegram?: boolean;
  linkedin_url?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  address_neighborhood?: string | null;
  cep?: string | null;
  city_id?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ContactLink {
  id: string;
  contact_id: string;
  link_type: 'cliente' | 'fornecedor' | 'representante' | 'entidade';
  target_id: string;
  target_kind: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type CreateContactData = {
  name: string;
  treatment_type: 'sr' | 'sra' | 'direct' | 'custom';
  custom_treatment?: string | null;
  job_title?: string | null;
  department?: string | null;
  decision_level?: 'estrategico' | 'tatico' | 'operacional' | null;
  responsible_user_id?: string | null;
  responsible_department_id?: string | null;
  email_primary?: string | null;
  mobile_phone?: string | null;
  landline_phone?: string | null;
  messaging_whatsapp?: boolean;
  messaging_telegram?: boolean;
  linkedin_url?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  address_neighborhood?: string | null;
  cep?: string | null;
  city_id?: string | null;
  links: Array<{
    link_type: 'cliente' | 'fornecedor' | 'representante' | 'entidade';
    target_id: string;
    target_kind?: string;
  }>;
};

export type UpdateContactData = Partial<CreateContactData>;

export function useContacts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: contacts = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Contact[];
    }
  });

  const createContactMutation = useMutation({
    mutationFn: async (contactData: CreateContactData) => {
      const { links, ...contactDataWithoutLinks } = contactData;
      
      const { data, error } = await (supabase as any)
        .from('contacts')
        .insert([contactDataWithoutLinks])
        .select()
        .single();
      
      if (error) throw error;

      // Create contact links
      if (links && links.length > 0) {
        // Get current user for audit
        const { data: { user } } = await supabase.auth.getUser();
        
        const linkData = links.map(link => ({
          contact_id: data.id,
          link_type: link.link_type,
          target_id: link.target_id,
          target_kind: link.target_kind || 'unified_customer',
          created_by: user?.id,
        }));

        const { error: linkError } = await (supabase as any)
          .from('contact_links')
          .insert(linkData);

        if (linkError) throw linkError;
      }

      return data as Contact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-links', data.id] });
      toast({
        title: "Contato criado",
        description: "O contato foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar contato",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    }
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateContactData }) => {
      const { links, ...contactDataWithoutLinks } = data;
      
      const { data: updatedData, error } = await (supabase as any)
        .from('contacts')
        .update(contactDataWithoutLinks)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;

      // Update contact links if provided
      if (links) {
        // Delete existing links
        const { error: deleteError } = await (supabase as any)
          .from('contact_links')
          .delete()
          .eq('contact_id', id);

        if (deleteError) throw deleteError;

        // Create new links
        if (links.length > 0) {
          // Get current user for audit
          const { data: { user } } = await supabase.auth.getUser();
          
          const linkData = links.map(link => ({
            contact_id: id,
            link_type: link.link_type,
            target_id: link.target_id,
            target_kind: link.target_kind || 'unified_customer',
            created_by: user?.id,
          }));

          const { error: linkError } = await (supabase as any)
            .from('contact_links')
            .insert(linkData);

          if (linkError) throw linkError;
        }
      }

      return updatedData as Contact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-links', data.id] });
      queryClient.invalidateQueries({ queryKey: ['contacts', data.id] });
      toast({
        title: "Contato atualizado",
        description: "O contato foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar contato",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    }
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('contacts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: "Contato excluído",
        description: "O contato foi excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir contato",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    }
  });

  return {
    contacts,
    isLoading,
    error,
    createContact: createContactMutation.mutate,
    updateContact: updateContactMutation.mutate,
    deleteContact: deleteContactMutation.mutate,
    isCreating: createContactMutation.isPending,
    isUpdating: updateContactMutation.isPending,
    isDeleting: deleteContactMutation.isPending
  };
}

export const useContactLinks = (contactId?: string) => {
  return useQuery({
    queryKey: ['contact-links', contactId],
    queryFn: async () => {
      if (!contactId) return [];
      
      const { data, error } = await (supabase as any)
        .from('contact_links')
        .select('*')
        .eq('contact_id', contactId);

      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
    refetchOnMount: 'always',
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Contact;
    },
    enabled: !!id
  });
}
