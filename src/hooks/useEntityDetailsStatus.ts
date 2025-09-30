import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EntityDetailsStatus {
  hasDetails: boolean;
  loading: boolean;
}

export function useEntityDetailsStatus(entityId: string, entityType: string) {
  const [status, setStatus] = useState<EntityDetailsStatus>({
    hasDetails: true,
    loading: true
  });

  useEffect(() => {
    if (!entityId || !entityType) return;

    const checkDetails = async () => {
      setStatus(prev => ({ ...prev, loading: true }));

      try {
        let hasDetails = true;

        if (entityType === 'parceiros_externos') {
          const { data } = await supabase
            .from('contact_entity_external_partners')
            .select('id')
            .eq('contact_entity_id', entityId)
            .maybeSingle();
          hasDetails = !!data;
        } else if (entityType === 'orgaos_publicos_controle') {
          const { data } = await supabase
            .from('contact_entity_public_orgs')
            .select('id')
            .eq('contact_entity_id', entityId)
            .maybeSingle();
          hasDetails = !!data;
        } else if (entityType === 'associacoes_sindicatos') {
          const { data } = await supabase
            .from('contact_entity_associations')
            .select('id')
            .eq('contact_entity_id', entityId)
            .maybeSingle();
          hasDetails = !!data;
        }

        setStatus({ hasDetails, loading: false });
      } catch (error) {
        console.error('Error checking entity details:', error);
        setStatus({ hasDetails: true, loading: false });
      }
    };

    checkDetails();
  }, [entityId, entityType]);

  return status;
}