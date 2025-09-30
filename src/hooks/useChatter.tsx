import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';

export interface ChatterMessage {
  id: string;
  record_type: string;
  record_id: string;
  message_type: 'internal' | 'external';
  subject?: string;
  message: string;
  author_id: string;
  mentioned_users?: string[];
  attachments?: any[];
  parent_message_id?: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
    email: string;
  };
  replies?: ChatterMessage[];
}

export interface ChatterTimelineItem {
  id: string;
  type: 'message' | 'audit';
  timestamp: string;
  author?: {
    id: string;
    name: string;
    email: string;
  };
  content: any;
}

export const useChatter = (recordType: string, recordId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatterMessage[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'messages' | 'audit'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chatter_messages')
        .select(`
          *,
          author:profiles!chatter_messages_author_id_fkey(id, name, email)
        `)
        .eq('record_type', recordType)
        .eq('record_id', recordId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group replies under parent messages
      const messageMap = new Map();
      const rootMessages: ChatterMessage[] = [];

      data?.forEach((msg) => {
        const message: ChatterMessage = {
          id: msg.id,
          record_type: msg.record_type,
          record_id: msg.record_id,
          message_type: msg.message_type as 'internal' | 'external',
          subject: msg.subject,
          message: msg.message,
          author_id: msg.author_id,
          mentioned_users: msg.mentioned_users,
          attachments: Array.isArray(msg.attachments) ? msg.attachments : [],
          parent_message_id: msg.parent_message_id,
          is_pinned: msg.is_pinned,
          created_at: msg.created_at,
          updated_at: msg.updated_at,
          author: Array.isArray(msg.author) ? msg.author[0] : msg.author,
          replies: []
        };
        messageMap.set(msg.id, message);

        if (!msg.parent_message_id) {
          rootMessages.push(message);
        }
      });

      // Add replies to parent messages
      data?.forEach((msg) => {
        if (msg.parent_message_id) {
          const parent = messageMap.get(msg.parent_message_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(messageMap.get(msg.id));
          }
        }
      });

      setMessages(rootMessages);
    } catch (error) {
      console.error('Error fetching chatter messages:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as mensagens do chatter",
        variant: "destructive",
      });
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('field_audit_log')
        .select(`
          *,
          changer:profiles!field_audit_log_changed_by_fkey(id, name, email)
        `)
        .eq('record_type', recordType)
        .eq('record_id', recordId) // Now using record_id for all record types
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  // Create timeline combining messages and audit logs
  const getTimeline = (): ChatterTimelineItem[] => {
    const timeline: ChatterTimelineItem[] = [];

    // Add messages to timeline
    if (filter === 'all' || filter === 'messages') {
      messages.forEach((message) => {
        timeline.push({
          id: message.id,
          type: 'message',
          timestamp: message.created_at,
          author: message.author,
          content: message
        });

        // Add replies
        message.replies?.forEach((reply) => {
          timeline.push({
            id: reply.id,
            type: 'message',
            timestamp: reply.created_at,
            author: reply.author,
            content: reply
          });
        });
      });
    }

    // Add audit logs to timeline
    if (filter === 'all' || filter === 'audit') {
      auditLogs.forEach((log) => {
        timeline.push({
          id: log.id,
          type: 'audit',
          timestamp: log.timestamp,
          author: log.changer,
          content: log
        });
      });
    }

    // Sort by timestamp
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Filter by search term
    if (searchTerm) {
      return timeline.filter((item) => {
        if (item.type === 'message') {
          return item.content.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.author?.name.toLowerCase().includes(searchTerm.toLowerCase());
        } else {
          return item.content.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.content.old_value?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.content.new_value?.toLowerCase().includes(searchTerm.toLowerCase());
        }
      });
    }

    return timeline;
  };

  // Send message
  const sendMessage = async (message: string, messageType: 'internal' | 'external' = 'internal', parentId?: string, mentionedUserIds?: string[]) => {
    if (!user) return;

    console.log('sendMessage called with:', {
      message,
      messageType,
      parentId,
      mentionedUserIds,
      recordType,
      recordId
    });

    try {
      // Use provided mentions or extract from message format
      let mentionedUsers: string[] = mentionedUserIds || [];

      if (!mentionedUserIds || mentionedUserIds.length === 0) {
        // Extract mentions from message (@[Name](id) format)
        const mentionMatches = message.match(/@\[([^\]]+)\]\(([^)]+)\)/g);
        
        if (mentionMatches) {
          mentionedUsers = mentionMatches.map(match => {
            const idMatch = match.match(/@\[([^\]]+)\]\(([^)]+)\)/);
            return idMatch ? idMatch[2] : '';
          }).filter(id => id);
        }
      }

      console.log('Final mentionedUsers array:', mentionedUsers);

      const { data, error } = await supabase
        .from('chatter_messages')
        .insert({
          record_type: recordType,
          record_id: recordId,
          message_type: messageType,
          message,
          author_id: user.id,
          mentioned_users: mentionedUsers.length > 0 ? mentionedUsers : null,
          parent_message_id: parentId
        })
        .select(`
          *,
          author:profiles!chatter_messages_author_id_fkey(id, name, email)
        `)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Message sent successfully:', data);

      toast({
        title: "Sucesso",
        description: "Mensagem enviada com sucesso",
      });

      // Refresh messages
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Pin/unpin message
  const togglePin = async (messageId: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('chatter_messages')
        .update({ is_pinned: !isPinned })
        .eq('id', messageId);

      if (error) throw error;
      
      await fetchMessages();
      
      toast({
        title: "Sucesso",
        description: isPinned ? "Mensagem desafixada" : "Mensagem fixada",
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status da mensagem",
        variant: "destructive",
      });
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chatter_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      
      await fetchMessages();
      
      toast({
        title: "Sucesso",
        description: "Mensagem excluída com sucesso",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a mensagem",
        variant: "destructive",
      });
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`chatter-${recordType}-${recordId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chatter_messages',
          filter: `record_id=eq.${recordId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'field_audit_log',
          filter: `record_id=eq.${recordId}`,
        },
        () => {
          fetchAuditLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [recordType, recordId]);

  // Initial load
  useEffect(() => {
    if (recordType && recordId) {
      setLoading(true);
      Promise.all([fetchMessages(), fetchAuditLogs()])
        .finally(() => setLoading(false));
    }
  }, [recordType, recordId]);

  return {
    messages,
    auditLogs,
    timeline: getTimeline(),
    loading,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    sendMessage,
    togglePin,
    deleteMessage,
    refreshData: () => Promise.all([fetchMessages(), fetchAuditLogs()])
  };
};