import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Lead {
  id: string;
  lead_number?: number;
  lead_code?: string;
  trade_name: string;
  legal_name?: string;
  cnpj?: string;
  website?: string;
  segment_id?: string;
  city_id?: string;
  economic_group_id?: number;
  assigned_vendor_cod?: string;
  assigned_vendor_filial?: string;
  attendance_type: 'direct' | 'representative';
  representative_id?: string;
  source_channel?: 'referral' | 'website' | 'social' | 'organic_search' | 'paid_search' | 'event' | 'outbound' | 'marketplace' | 'other';
  source_subchannel?: string;
  referral_name?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  segment?: {
    id: string;
    name: string;
  };
  city?: {
    id: string;
    name: string;
    uf: string;
  };
  segments?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  economicGroup?: {
    id_grupo: number;
    nome_grupo: string;
  };
  tags?: Array<{
    id: string;
    name: string;
  }>;
  assignedVendor?: {
    a3_cod: string;
    a3_filial: string;
    a3_nome: string;
  };
  representative?: {
    id: string;
    company_name: string;
  };
}

export const useLeads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      let leadsData: any[] = [];
      let leadsError: any = null;
      
      // Try to fetch with new columns first
      try {
        const { data, error } = await supabase
          .from('sales_leads')
          .select(`
            id,
            lead_number,
            lead_code,
            trade_name,
            legal_name,
            cnpj,
            website,
            segment_id,
            city_id,
            economic_group_id,
            assigned_vendor_cod,
            assigned_vendor_filial,
            attendance_type,
            representative_id,
            source_channel,
            source_subchannel,
            referral_name,
            created_by,
            created_at,
            updated_at,
            segment:site_product_segments(
              id,
              name
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          // Check if it's a column not found error
          if (error.code === '42703' || error.message?.includes('does not exist')) {
            throw error; // Will be caught by outer try-catch
          } else {
            leadsError = error;
          }
        } else {
          leadsData = data || [];
        }
      } catch (columnError: any) {
        // Fallback to basic query without lead_number and lead_code
        console.log('Falling back to basic query without lead_number/lead_code');
        const { data, error } = await supabase
          .from('sales_leads')
          .select(`
            id,
            trade_name,
            legal_name,
            cnpj,
            website,
            segment_id,
            city_id,
            economic_group_id,
            assigned_vendor_cod,
            assigned_vendor_filial,
            attendance_type,
            representative_id,
            source_channel,
            source_subchannel,
            referral_name,
            created_by,
            created_at,
            updated_at,
            segment:site_product_segments(
              id,
              name
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          leadsError = error;
        } else {
          leadsData = data || [];
        }
      }

      if (leadsError) {
        console.error('Error fetching leads:', leadsError);
        toast.error('Erro ao carregar leads: ' + leadsError.message);
        return;
      }

      if (!leadsData || leadsData.length === 0) {
        setLeads([]);
        return;
      }

      // Process each lead to fetch additional data
      const processedLeads = await Promise.all(
        leadsData.map(async (lead) => {
          let segments: Array<{ id: string; name: string; color: string; }> = [];
          let city: { id: string; name: string; uf: string; } | undefined;
          let economicGroup: { id_grupo: number; nome_grupo: string; } | undefined;
          let tags: Array<{ id: string; name: string; }> = [];
          let assignedVendor: { a3_cod: string; a3_filial: string; a3_nome: string; } | undefined;
          let representative: { id: string; company_name: string; } | undefined;

          // Fetch segments
          if (lead.segment_id) {
            try {
              const { data: segmentData } = await supabase
                .from('site_product_segments')
                .select('id, name')
                .eq('id', lead.segment_id)
                .single();

              if (segmentData) {
                segments = [{
                  id: segmentData.id,
                  name: segmentData.name,
                  color: '#3B82F6'
                }];
              }
            } catch (error) {
              console.error('Error fetching segments for lead:', lead.id, error);
            }
          }

          // Fetch city
          if (lead.city_id) {
            try {
              const { data: cityData } = await supabase
                .from('site_cities')
                .select('id, name, uf')
                .eq('id', lead.city_id)
                .single();

              if (cityData) {
                city = cityData;
              }
            } catch (error) {
              console.error('Error fetching city for lead:', lead.id, error);
            }
          }

          // Fetch economic group
          if (lead.economic_group_id) {
            try {
              const { data: groupData } = await supabase
                .from('protheus_customer_groups')
                .select('id_grupo, name, ai_suggested_name')
                .eq('id_grupo', lead.economic_group_id)
                .single();

              if (groupData) {
                economicGroup = {
                  id_grupo: groupData.id_grupo,
                  nome_grupo: groupData.name || groupData.ai_suggested_name || `Grupo ${groupData.id_grupo}`
                };
              }
            } catch (error) {
              console.error('Error fetching economic group for lead:', lead.id, error);
            }
          }

          // Fetch tags
          try {
            const { data: tagData } = await supabase
              .from('sales_lead_tags')
              .select(`
                tag:email_tags(id, name)
              `)
              .eq('lead_id', lead.id);

            if (tagData) {
              tags = tagData
                .map(item => item.tag)
                .filter(tag => tag !== null) as Array<{ id: string; name: string; }>;
            }
          } catch (error) {
            console.error('Error fetching tags for lead:', lead.id, error);
          }

          // Fetch assigned vendor
          if (lead.assigned_vendor_cod && lead.assigned_vendor_filial) {
            try {
              const { data: vendorData } = await supabase
                .from('protheus_sa3010_fc3d70f6')
                .select('a3_cod, a3_filial, a3_nome')
                .eq('a3_cod', lead.assigned_vendor_cod)
                .eq('a3_filial', lead.assigned_vendor_filial)
                .single();

              if (vendorData) {
                assignedVendor = vendorData;
              }
            } catch (error) {
              console.error('Error fetching assigned vendor for lead:', lead.id, error);
            }
          }

          // Fetch representative
          if (lead.representative_id) {
            try {
              const { data: representativeData } = await supabase
                .from('commercial_representatives')
                .select('id, company_name')
                .eq('id', lead.representative_id)
                .single();

              if (representativeData) {
                representative = representativeData;
              }
            } catch (error) {
              console.error('Error fetching representative for lead:', lead.id, error);
            }
          }

          return {
            ...lead,
            attendance_type: lead.attendance_type || 'direct',
            segments,
            city,
            economicGroup,
            tags,
            assignedVendor,
            representative
          } as Lead;
        })
      );
      
      setLeads(processedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const createLead = async (leadData: { 
    source_channel: 'referral' | 'website' | 'social' | 'organic_search' | 'paid_search' | 'event' | 'outbound' | 'marketplace' | 'other';
    source_subchannel?: string;
    referral_name?: string;
    trade_name: string;
    legal_name?: string;
    cnpj?: string;
    website?: string;
    segment_ids: string[];
    city_id?: string;
    economic_group_id?: number;
    assigned_vendor_cod?: string;
    assigned_vendor_filial?: string;
    attendance_type: 'direct' | 'representative';
    representative_id?: string;
    tag_ids?: string[];
  }) => {
    if (!user?.id) return null;

    try {
      // 1. Criar o lead
      const leadInsertData: any = {
        source_channel: leadData.source_channel,
        trade_name: leadData.trade_name,
        attendance_type: leadData.attendance_type,
        created_by: user.id
      };

      if (leadData.source_subchannel) {
        leadInsertData.source_subchannel = leadData.source_subchannel;
      }

      if (leadData.referral_name) {
        leadInsertData.referral_name = leadData.referral_name;
      }

      if (leadData.legal_name) {
        leadInsertData.legal_name = leadData.legal_name;
      }

      if (leadData.cnpj) {
        leadInsertData.cnpj = leadData.cnpj;
      }

      if (leadData.website) {
        leadInsertData.website = leadData.website;
      }

      if (leadData.city_id) {
        leadInsertData.city_id = leadData.city_id;
      }

      if (leadData.economic_group_id) {
        leadInsertData.economic_group_id = leadData.economic_group_id;
      }

      if (leadData.assigned_vendor_cod && leadData.assigned_vendor_filial) {
        leadInsertData.assigned_vendor_cod = leadData.assigned_vendor_cod;
        leadInsertData.assigned_vendor_filial = leadData.assigned_vendor_filial;
      }

      if (leadData.representative_id) {
        leadInsertData.representative_id = leadData.representative_id;
      }

      // Por compatibilidade, usar o primeiro segmento como segment_id
      if (leadData.segment_ids.length > 0) {
        leadInsertData.segment_id = leadData.segment_ids[0];
      }

      const { data: lead, error: leadError } = await supabase
        .from('sales_leads')
        .insert(leadInsertData)
        .select()
        .single();

      if (leadError) throw leadError;

      // 2. Criar vínculos com tags se fornecidas
      if (leadData.tag_ids && leadData.tag_ids.length > 0) {
        const tagLinks = leadData.tag_ids.map(tagId => ({
          lead_id: lead.id,
          tag_id: tagId,
          created_by: user.id
        }));

        const { error: tagError } = await supabase
          .from('sales_lead_tags')
          .insert(tagLinks);

        if (tagError) {
          console.error('Error linking tags:', tagError);
          // Não falhar a criação do lead por causa das tags
          toast.error('Lead criado, mas houve erro ao vincular algumas tags');
        }
      }

      // 3. Recarregar os leads
      await fetchLeads();
      
      toast.success('Lead criado com sucesso!');
      return lead;
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Erro ao criar lead');
      return null;
    }
  };

  const updateLead = async (id: string, updates: Partial<{
    source_channel: 'referral' | 'website' | 'social' | 'organic_search' | 'paid_search' | 'event' | 'outbound' | 'marketplace' | 'other';
    source_subchannel: string;
    referral_name: string;
    trade_name: string;
    legal_name: string;
    cnpj: string;
    website: string;
    segment_ids: string[];
    city_id: string;
    economic_group_id: number;
    assigned_vendor_cod: string;
    assigned_vendor_filial: string;
    attendance_type: 'direct' | 'representative';
    representative_id: string;
    tag_ids: string[];
  }>) => {
    try {
      // 1. Atualizar dados básicos do lead
      const basicUpdates: any = {};
      if (updates.source_channel !== undefined) basicUpdates.source_channel = updates.source_channel;
      if (updates.source_subchannel !== undefined) basicUpdates.source_subchannel = updates.source_subchannel;
      if (updates.referral_name !== undefined) basicUpdates.referral_name = updates.referral_name;
      if (updates.trade_name !== undefined) basicUpdates.trade_name = updates.trade_name;
      if (updates.legal_name !== undefined) basicUpdates.legal_name = updates.legal_name;
      if (updates.cnpj !== undefined) basicUpdates.cnpj = updates.cnpj;
      if (updates.website !== undefined) basicUpdates.website = updates.website;
      if (updates.city_id !== undefined) basicUpdates.city_id = updates.city_id;
      if (updates.economic_group_id !== undefined) basicUpdates.economic_group_id = updates.economic_group_id;
      if (updates.attendance_type !== undefined) basicUpdates.attendance_type = updates.attendance_type;
      if (updates.representative_id !== undefined) basicUpdates.representative_id = updates.representative_id;

      // Por compatibilidade, usar o primeiro segmento como segment_id
      if (updates.segment_ids && updates.segment_ids.length > 0) {
        basicUpdates.segment_id = updates.segment_ids[0];
      }

      if (updates.assigned_vendor_cod !== undefined && updates.assigned_vendor_filial !== undefined) {
        basicUpdates.assigned_vendor_cod = updates.assigned_vendor_cod;
        basicUpdates.assigned_vendor_filial = updates.assigned_vendor_filial;
      }

      if (Object.keys(basicUpdates).length > 0) {
        const { error: leadError } = await supabase
          .from('sales_leads')
          .update(basicUpdates)
          .eq('id', id);

        if (leadError) throw leadError;
      }

      // 2. Atualizar tags se fornecidas
      if (updates.tag_ids !== undefined) {
        // Remover vínculos existentes
        const { error: deleteError } = await supabase
          .from('sales_lead_tags')
          .delete()
          .eq('lead_id', id);

        if (deleteError) throw deleteError;

        // Adicionar novos vínculos
        if (updates.tag_ids.length > 0 && user?.id) {
          const tagLinks = updates.tag_ids.map(tagId => ({
            lead_id: id,
            tag_id: tagId,
            created_by: user.id
          }));

          const { error: insertError } = await supabase
            .from('sales_lead_tags')
            .insert(tagLinks);

          if (insertError) throw insertError;
        }
      }

      // 3. Recarregar os leads
      await fetchLeads();
      
      toast.success('Lead atualizado com sucesso!');
      return true;
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Erro ao atualizar lead');
      return null;
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sales_leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLeads(prev => prev.filter(lead => lead.id !== id));
      toast.success('Lead excluído com sucesso!');
      return true;
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Erro ao excluir lead');
      return false;
    }
  };

  return {
    leads,
    loading,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead
  };
};
