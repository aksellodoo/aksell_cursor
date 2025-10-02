import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Contact } from './useContacts';

export interface FormInvitation {
  id: string;
  form_id: string;
  contact_id: string;
  contact?: Contact;
  send_via_email: boolean;
  send_via_whatsapp: boolean;
  send_via_telegram: boolean;
  email_sent_at?: string | null;
  email_opened_at?: string | null;
  whatsapp_sent_at?: string | null;
  telegram_sent_at?: string | null;
  form_access_token: string;
  responded_at?: string | null;
  response_id?: string | null;
  created_at: string;
  created_by?: string | null;
  updated_at: string;
}

export interface DeliveryChannelConfig {
  contact_id: string;
  send_via_email: boolean;
  send_via_whatsapp: boolean;
  send_via_telegram: boolean;
}

export interface SendInvitationsRequest {
  form_id: string;
  form_title: string;
  form_description?: string;
  estimated_minutes?: number;
  deadline?: string;
  creator_name: string;
  delivery_configs: DeliveryChannelConfig[];
}

export const useFormInvitations = () => {
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });

  /**
   * Generate a secure random token for form access
   */
  const generateAccessToken = (): string => {
    return crypto.randomUUID();
  };

  /**
   * Create invitation records in database
   */
  const createInvitations = async (
    formId: string,
    deliveryConfigs: DeliveryChannelConfig[]
  ): Promise<FormInvitation[]> => {
    const invitations: any[] = deliveryConfigs.map(config => ({
      form_id: formId,
      contact_id: config.contact_id,
      send_via_email: config.send_via_email,
      send_via_whatsapp: config.send_via_whatsapp,
      send_via_telegram: config.send_via_telegram,
      form_access_token: generateAccessToken(),
    }));

    const { data, error } = await supabase
      .from('form_external_invitations')
      .upsert(invitations, {
        onConflict: 'form_id,contact_id',
        ignoreDuplicates: false
      })
      .select('*');

    if (error) {
      console.error('Error creating invitations:', error);
      throw new Error('Erro ao criar convites no banco de dados');
    }

    return data as FormInvitation[];
  };

  /**
   * Send invitation via edge function
   */
  const sendInvitation = async (
    invitation: FormInvitation,
    contact: Contact,
    formData: {
      title: string;
      description?: string;
      estimated_minutes?: number;
      deadline?: string;
      creator_name: string;
    }
  ): Promise<{ success: boolean; channel: string; error?: string }[]> => {
    const results: { success: boolean; channel: string; error?: string }[] = [];

    // Send via Email
    if (invitation.send_via_email && contact.email_primary) {
      try {
        const { data, error } = await supabase.functions.invoke('send-form-invitation', {
          body: {
            invitation_id: invitation.id,
            contact_id: contact.id,
            contact_name: contact.name,
            contact_email: contact.email_primary,
            form_id: invitation.form_id,
            form_title: formData.title,
            form_description: formData.description,
            estimated_minutes: formData.estimated_minutes,
            deadline: formData.deadline,
            creator_name: formData.creator_name,
            access_token: invitation.form_access_token,
            channel: 'email'
          }
        });

        if (error) throw error;

        results.push({ success: true, channel: 'email' });

        // Update email_sent_at
        await supabase
          .from('form_external_invitations')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('id', invitation.id);

      } catch (error: any) {
        console.error('Error sending email:', error);
        results.push({ success: false, channel: 'email', error: error.message });
      }
    }

    // Send via WhatsApp (placeholder for future implementation)
    if (invitation.send_via_whatsapp && contact.mobile_phone && contact.messaging_whatsapp) {
      // TODO: Implement WhatsApp sending
      results.push({ success: false, channel: 'whatsapp', error: 'WhatsApp integration not yet implemented' });
    }

    // Send via Telegram (placeholder for future implementation)
    if (invitation.send_via_telegram && contact.mobile_phone && contact.messaging_telegram) {
      // TODO: Implement Telegram sending
      results.push({ success: false, channel: 'telegram', error: 'Telegram integration not yet implemented' });
    }

    return results;
  };

  /**
   * Main function to send all invitations
   */
  const sendInvitations = async (
    request: SendInvitationsRequest,
    contacts: Contact[]
  ): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    errors: Array<{ contact: string; channel: string; error: string }>;
  }> => {
    setIsSending(true);
    setSendProgress({ current: 0, total: request.delivery_configs.length });

    let sent = 0;
    let failed = 0;
    const errors: Array<{ contact: string; channel: string; error: string }> = [];

    try {
      // Step 1: Create all invitation records
      const invitations = await createInvitations(
        request.form_id,
        request.delivery_configs
      );

      // Step 2: Send invitations one by one
      for (let i = 0; i < invitations.length; i++) {
        const invitation = invitations[i];
        const contact = contacts.find(c => c.id === invitation.contact_id);

        if (!contact) {
          failed++;
          errors.push({
            contact: invitation.contact_id,
            channel: 'all',
            error: 'Contact not found'
          });
          continue;
        }

        setSendProgress({ current: i + 1, total: invitations.length });

        const results = await sendInvitation(invitation, contact, {
          title: request.form_title,
          description: request.form_description,
          estimated_minutes: request.estimated_minutes,
          deadline: request.deadline,
          creator_name: request.creator_name
        });

        // Process results
        results.forEach(result => {
          if (result.success) {
            sent++;
          } else {
            failed++;
            errors.push({
              contact: contact.name,
              channel: result.channel,
              error: result.error || 'Unknown error'
            });
          }
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return {
        success: failed === 0,
        sent,
        failed,
        errors
      };

    } catch (error: any) {
      console.error('Error sending invitations:', error);
      toast.error('Erro ao enviar convites: ' + error.message);
      return {
        success: false,
        sent,
        failed: request.delivery_configs.length,
        errors: [{
          contact: 'all',
          channel: 'all',
          error: error.message
        }]
      };
    } finally {
      setIsSending(false);
      setSendProgress({ current: 0, total: 0 });
    }
  };

  /**
   * Get invitations for a form
   */
  const getFormInvitations = async (formId: string): Promise<FormInvitation[]> => {
    const { data, error } = await supabase
      .from('form_external_invitations')
      .select(`
        *,
        contact:contacts(*)
      `)
      .eq('form_id', formId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      throw error;
    }

    return data as FormInvitation[];
  };

  /**
   * Validate access token and get invitation
   */
  const validateToken = async (token: string): Promise<FormInvitation | null> => {
    const { data, error } = await supabase
      .from('form_external_invitations')
      .select(`
        *,
        contact:contacts(*)
      `)
      .eq('form_access_token', token)
      .single();

    if (error) {
      console.error('Error validating token:', error);
      return null;
    }

    return data as FormInvitation;
  };

  /**
   * Mark invitation as responded
   */
  const markAsResponded = async (
    invitationId: string,
    responseId: string
  ): Promise<void> => {
    const { error } = await supabase
      .from('form_external_invitations')
      .update({
        responded_at: new Date().toISOString(),
        response_id: responseId
      })
      .eq('id', invitationId);

    if (error) {
      console.error('Error marking as responded:', error);
      throw error;
    }
  };

  return {
    sendInvitations,
    getFormInvitations,
    validateToken,
    markAsResponded,
    isSending,
    sendProgress
  };
};
