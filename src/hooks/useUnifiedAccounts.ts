import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UnifiedAccount {
  id: string;
  seq_id: number;
  status: 'lead_only' | 'customer' | 'lead_and_customer' | 'archived';
  lead_id?: string;
  protheus_filial?: string;
  protheus_cod?: string;
  protheus_loja?: string;
  service_type: 'direct' | 'representative';
  representative_id?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  segment_ids?: string[];
  segments?: { id: string; name: string }[];
  economic_group_id?: number | null;
}

export interface CreateUnifiedAccountData {
  status?: 'lead_only' | 'customer' | 'lead_and_customer' | 'archived';
  lead_id?: string;
  protheus_filial?: string;
  protheus_cod?: string;
  protheus_loja?: string;
  service_type: 'direct' | 'representative';
  representative_id?: string;
  notes?: string;
  segment_ids?: string[];
}

export const useUnifiedAccounts = () => {
  const [accounts, setAccounts] = useState<UnifiedAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('unified_accounts')
        .select('*, economic_group_id')
        .order('seq_id', { ascending: false });

      if (error) throw error;
      
      // Buscar segmentos para cada account usando consultas diretas ao Supabase
      const accountsWithSegments = await Promise.all(
        (data || []).map(async (account) => {
          try {
            // Buscar mapeamentos de segmentos diretamente
            const { data: segmentMaps, error: segmentError } = await supabase
              .from('unified_account_segments_map' as any)
              .select('segment_id')
              .eq('account_id', account.id);
            
            if (segmentError) {
              console.error('Error fetching segments:', segmentError);
              return {
                ...account,
                service_type: account.service_type as 'direct' | 'representative',
                segment_ids: [],
                segments: []
              };
            }

            const segmentIds = segmentMaps?.map((s: any) => s.segment_id).filter(Boolean) || [];
            
            // Buscar os nomes dos segmentos diretamente
            let segmentsWithNames: { id: string; name: string }[] = [];
            if (segmentIds.length > 0) {
              try {
                const { data: segmentNames, error: segmentNamesError } = await supabase
                  .from('site_product_segments')
                  .select('id, name')
                  .in('id', segmentIds);
                
                if (!segmentNamesError && segmentNames) {
                  segmentsWithNames = segmentNames.map(segment => ({
                    id: segment.id,
                    name: segment.name
                  }));
                }
              } catch (segmentNameErr) {
                console.error('Error fetching segment names:', segmentNameErr);
              }
            }
            
            return {
              ...account,
              service_type: account.service_type as 'direct' | 'representative',
              segment_ids: segmentIds,
              segments: segmentsWithNames
            };
          } catch (segmentErr) {
            console.error('Error processing segments for account:', account.id, segmentErr);
            return {
              ...account,
              service_type: account.service_type as 'direct' | 'representative',
              segment_ids: [],
              segments: []
            };
          }
        })
      );
      
      setAccounts(accountsWithSegments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar clientes unificados';
      console.error('Error fetching unified accounts:', err);
      setError(errorMessage);
      toast({ 
        title: "Erro", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const manageAccountSegments = async (accountId: string, segmentIds: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Remover todos os vínculos existentes
    const { error: deleteError } = await supabase
      .from('unified_account_segments_map' as any)
      .delete()
      .eq('account_id', accountId);

    if (deleteError) {
      console.error('Error deleting existing segment links:', deleteError);
      throw deleteError;
    }

    // Adicionar novos vínculos se houver segmentos selecionados
    if (segmentIds.length > 0) {
      const segmentMaps = segmentIds.map(segmentId => ({
        account_id: accountId,
        segment_id: segmentId,
        created_by: user.id
      }));

      const { error: insertError } = await supabase
        .from('unified_account_segments_map' as any)
        .insert(segmentMaps);

      if (insertError) throw insertError;
    }
  };

  const createAccount = async (accountData: CreateUnifiedAccountData) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { segment_ids, ...accountDataWithoutSegments } = accountData;

      const { data, error } = await supabase
        .from('unified_accounts')
        .insert({
          ...accountDataWithoutSegments,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Gerenciar segmentos se houver
      if (segment_ids && segment_ids.length > 0) {
        await manageAccountSegments(data.id, segment_ids);
      }

      toast({ 
        title: "Sucesso", 
        description: "Cliente unificado criado com sucesso" 
      });
      
      await fetchAccounts();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar cliente unificado';
      console.error('Error creating unified account:', err);
      toast({ 
        title: "Erro", 
        description: errorMessage, 
        variant: "destructive" 
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async (id: string, updates: Partial<CreateUnifiedAccountData>) => {
    try {
      setLoading(true);
      
      const { segment_ids, ...updatesWithoutSegments } = updates;

      const { data, error } = await supabase
        .from('unified_accounts')
        .update(updatesWithoutSegments)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Gerenciar segmentos se fornecidos
      if (segment_ids !== undefined) {
        await manageAccountSegments(id, segment_ids);
      }

      toast({ 
        title: "Sucesso", 
        description: "Cliente unificado atualizado com sucesso" 
      });
      
      await fetchAccounts();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar cliente unificado';
      console.error('Error updating unified account:', err);
      toast({ 
        title: "Erro", 
        description: errorMessage, 
        variant: "destructive" 
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('unified_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ 
        title: "Sucesso", 
        description: "Cliente unificado excluído com sucesso" 
      });
      
      await fetchAccounts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir cliente unificado';
      console.error('Error deleting unified account:', err);
      toast({ 
        title: "Erro", 
        description: errorMessage, 
        variant: "destructive" 
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const createMissingUnifiedAccounts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('create_missing_unified_accounts');
      
      if (error) throw error;
      
      const result = data as {
        created_from_protheus: number;
        created_from_leads: number;
        linked_protheus_to_leads: number;
      };
      
      const total = result.created_from_protheus + result.created_from_leads + result.linked_protheus_to_leads;
      
      if (total > 0) {
        let message = `${total} operações realizadas: `;
        const details = [];
        
        if (result.created_from_protheus > 0) {
          details.push(`${result.created_from_protheus} criados do Protheus`);
        }
        if (result.created_from_leads > 0) {
          details.push(`${result.created_from_leads} criados de leads`);
        }
        if (result.linked_protheus_to_leads > 0) {
          details.push(`${result.linked_protheus_to_leads} leads vinculados ao Protheus por CNPJ`);
        }
        
        message += details.join(', ');
        
        toast({ 
          title: "Sucesso", 
          description: message
        });
      } else {
        toast({ 
          title: "Informação", 
          description: "Nenhum cliente unificado faltante encontrado"
        });
      }
      
      await fetchAccounts();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar clientes unificados faltantes';
      console.error('Error creating missing unified accounts:', err);
      toast({ 
        title: "Erro", 
        description: errorMessage, 
        variant: "destructive" 
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    createMissingUnifiedAccounts
  };
};
