import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getBaseUrl } from '@/lib/config';

export interface FormPublicationData {
  publication_status: 'draft' | 'published_internal' | 'published_external' | 'published_mixed';
  allows_anonymous_responses: boolean;
  internal_recipients: {
    users: string[];
    departments: string[];
    roles: string[];
  };
  external_recipients: Array<{
    name: string;
    email: string;
  }>;
  publication_settings: {
    auto_notify: boolean;
    collect_metadata: boolean;
    max_responses_per_user: number | null;
    response_deadline: string | null;
  };
}

export const useFormPublication = () => {
  const { user } = useAuth();
  const [publishing, setPublishing] = useState(false);

  const publishForm = async (formId: string, publicationData: FormPublicationData) => {
    if (!user) return null;

    try {
      setPublishing(true);

      // 1. Gerar tokens seguros para os links
      const baseUrl = getBaseUrl();
      
      // Gerar tokens seguros
      const { data: internalToken } = await supabase.rpc('generate_form_publication_token');
      const { data: externalToken } = await supabase.rpc('generate_form_publication_token');
      const { data: directToken } = await supabase.rpc('generate_form_publication_token');
      
      if (!internalToken || !externalToken || !directToken) {
        throw new Error('Erro ao gerar tokens de publicação');
      }
      
      // Criar hashes dos tokens para armazenamento
      const { data: internalHash } = await supabase.rpc('hash_form_token', { token_text: internalToken });
      const { data: externalHash } = await supabase.rpc('hash_form_token', { token_text: externalToken });
      const { data: directHash } = await supabase.rpc('hash_form_token', { token_text: directToken });
      
      // Salvar tokens na base de dados
      const { error: tokenError } = await supabase
        .from('form_publication_tokens')
        .insert([
          {
            form_id: formId,
            token_hash: internalHash,
            token_type: 'internal',
            created_by: user.id,
            metadata: { link_type: 'internal' }
          },
          {
            form_id: formId,
            token_hash: externalHash,
            token_type: 'external',
            created_by: user.id,
            metadata: { link_type: 'external' }
          },
          {
            form_id: formId,
            token_hash: directHash,
            token_type: 'direct_external',
            created_by: user.id,
            metadata: { link_type: 'direct_external' }
          }
        ]);
      
      if (tokenError) throw tokenError;
      
      // Gerar links seguros com tokens
      const publicationLinks = {
        internal: `${baseUrl}/formulario/${internalToken}`,
        external: `${baseUrl}/formulario/${externalToken}`,
        direct_external: `${baseUrl}/forms/external/${directToken}`
      };

      // 2. Criar destinatários externos (se houver)
      let externalRecipientIds: string[] = [];
      if (publicationData.external_recipients.length > 0) {
        for (const recipient of publicationData.external_recipients) {
          // Gerar senha segura
          const { data: generatedPassword } = await supabase.rpc('generate_secure_form_password');

          const { data: externalRecipient, error: recipientError } = await supabase
            .from('form_external_recipients')
            .insert({
              form_id: formId,
              name: recipient.name,
              email: recipient.email
            })
            .select()
            .single();

          if (recipientError) throw recipientError;
          externalRecipientIds.push(externalRecipient.id);

          // Enviar credenciais por email usando token seguro
          try {
            await supabase.functions.invoke('send-form-credentials', {
              body: {
                form_token: externalToken, // Usar token seguro em vez de form_id
                recipient_name: recipient.name,
                recipient_email: recipient.email,
                generated_password: generatedPassword,
                form_title: (await supabase.from('forms').select('title').eq('id', formId).single()).data?.title || 'Formulário'
              }
            });
            console.log(`Credenciais enviadas para ${recipient.email}`);
          } catch (emailError) {
            console.error('Erro ao enviar credenciais:', emailError);
            // Não falhar a publicação por causa do email
          }
        }
      }

      // 3. Atualizar formulário com dados de publicação
      const { error: updateError } = await supabase
        .from('forms')
        .update({
          publication_status: publicationData.publication_status,
          allows_anonymous_responses: publicationData.allows_anonymous_responses,
          internal_recipients: publicationData.internal_recipients,
          publication_settings: publicationData.publication_settings,
          publication_links: publicationLinks,
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq('id', formId);

      if (updateError) throw updateError;

      // 4. Enviar notificações (se habilitado)
      if (publicationData.publication_settings.auto_notify) {
        await sendNotifications(formId, publicationData);
      }

      toast.success('Formulário publicado com sucesso!');
      return true;
    } catch (error) {
      console.error('Error publishing form:', error);
      toast.error('Erro ao publicar formulário');
      return false;
    } finally {
      setPublishing(false);
    }
  };

  const unpublishForm = async (formId: string) => {
    try {
      const { error } = await supabase
        .from('forms')
        .update({
          publication_status: 'draft',
          is_published: false
        })
        .eq('id', formId);

      if (error) throw error;

      toast.success('Formulário despublicado');
      return true;
    } catch (error) {
      console.error('Error unpublishing form:', error);
      toast.error('Erro ao despublicar formulário');
      return false;
    }
  };

  const sendNotifications = async (formId: string, publicationData: FormPublicationData) => {
    try {
      // Chamar edge function para enviar notificações
      const { error } = await supabase.functions.invoke('send-form-notifications', {
        body: {
          form_id: formId,
          publication_data: publicationData
        }
      });

      if (error) throw error;

      // Criar notificações internas no app para destinatários internos
      if (publicationData.internal_recipients && 
          (publicationData.internal_recipients.users?.length > 0 ||
           publicationData.internal_recipients.departments?.length > 0 ||
           publicationData.internal_recipients.roles?.length > 0)) {
        
        // Buscar título do formulário
        const { data: form } = await supabase
          .from('forms')
          .select('title')
          .eq('id', formId)
          .single();

        const formTitle = form?.title || 'Formulário';

        // Criar notificações para usuários específicos
        if (publicationData.internal_recipients.users?.length > 0) {
          for (const userId of publicationData.internal_recipients.users) {
            await supabase.from('app_notifications').insert({
              user_id: userId,
              type: 'form_assigned',
              title: 'Novo formulário para preencher',
              message: `Você foi designado para responder ao formulário "${formTitle}"`,
              data: {
                form_id: formId,
                form_title: formTitle,
                navigation_url: '/formularios'
              }
            });
          }
        }

        // Criar notificações para departamentos
        if (publicationData.internal_recipients.departments?.length > 0) {
          const { data: deptUsers } = await supabase
            .from('profiles')
            .select('id')
            .in('department_id', publicationData.internal_recipients.departments)
            .eq('status', 'active');

          if (deptUsers) {
            for (const user of deptUsers) {
              await supabase.from('app_notifications').insert({
                user_id: user.id,
                type: 'form_assigned',
                title: 'Novo formulário para preencher',
                message: `Seu departamento foi designado para responder ao formulário "${formTitle}"`,
                data: {
                  form_id: formId,
                  form_title: formTitle,
                  navigation_url: '/formularios'
                }
              });
            }
          }
        }

        // Criar notificações para roles
        if (publicationData.internal_recipients.roles?.length > 0) {
          const roles = publicationData.internal_recipients.roles;
          let query = supabase
            .from('profiles')
            .select('id, role, is_leader')
            .eq('status', 'active');

          const { data: roleUsers } = await query;

          if (roleUsers) {
            for (const user of roleUsers) {
              let shouldNotify = false;
              
              if (roles.includes(user.role)) {
                shouldNotify = true;
              }
              
              if (roles.includes('leader') && user.is_leader) {
                shouldNotify = true;
              }

              if (shouldNotify) {
                await supabase.from('app_notifications').insert({
                  user_id: user.id,
                  type: 'form_assigned',
                  title: 'Novo formulário para preencher',
                  message: `Sua função foi designada para responder ao formulário "${formTitle}"`,
                  data: {
                    form_id: formId,
                    form_title: formTitle,
                    navigation_url: '/formularios'
                  }
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      // Não falhar a publicação por causa das notificações
    }
  };

  const createNewVersion = async (formId: string) => {
    try {
      // O trigger do banco irá criar automaticamente uma nova versão
      // quando o formulário for atualizado e já tiver respostas
      const { data: form, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (error) throw error;

      if (form.has_responses) {
        toast.info('Nova versão será criada automaticamente ao salvar as alterações');
      }

      return form;
    } catch (error) {
      console.error('Error checking form version:', error);
      return null;
    }
  };

  const getFormVersions = async (formId: string) => {
    try {
      const { data, error } = await supabase
        .from('form_versions')
        .select('*')
        .eq('form_id', formId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching form versions:', error);
      return [];
    }
  };

  const getExternalRecipients = async (formId: string) => {
    try {
      const { data, error } = await supabase
        .from('form_external_recipients')
        .select('*')
        .eq('form_id', formId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching external recipients:', error);
      return [];
    }
  };

  const updateExternalRecipient = async (recipientId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('form_external_recipients')
        .update(updates)
        .eq('id', recipientId);

      if (error) throw error;
      toast.success('Destinatário atualizado');
      return true;
    } catch (error) {
      console.error('Error updating external recipient:', error);
      toast.error('Erro ao atualizar destinatário');
      return false;
    }
  };

  const deleteExternalRecipient = async (recipientId: string) => {
    try {
      const { error } = await supabase
        .from('form_external_recipients')
        .update({ is_active: false })
        .eq('id', recipientId);

      if (error) throw error;
      toast.success('Destinatário removido');
      return true;
    } catch (error) {
      console.error('Error deleting external recipient:', error);
      toast.error('Erro ao remover destinatário');
      return false;
    }
  };

  return {
    publishing,
    publishForm,
    unpublishForm,
    createNewVersion,
    getFormVersions,
    getExternalRecipients,
    updateExternalRecipient,
    deleteExternalRecipient
  };
};