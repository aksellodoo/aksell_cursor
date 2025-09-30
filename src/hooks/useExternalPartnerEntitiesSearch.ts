import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ExternalPartnerEntitySearchResult {
  id: string; // ID da linha de detalhes (contact_entity_external_partners)
  entity_id: string; // ID da contact_entities
  entity_name: string;
  official_name: string;
  trade_name?: string;
  cnpj?: string;
  city_name?: string;
  city_uf?: string;
  city_label?: string;
  partner_type?: string;
  tags: string[];
}

export const useExternalPartnerEntitiesSearch = () => {
  const [entities, setEntities] = useState<ExternalPartnerEntitySearchResult[]>([]);
  const [filteredEntities, setFilteredEntities] = useState<ExternalPartnerEntitySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 50;

  // Função para normalizar texto (remover acentos e converter para minúsculo)
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Função auxiliar para filtrar entidades
  const filterEntitiesWithTerm = useCallback((entitiesData: ExternalPartnerEntitySearchResult[], term: string) => {
    if (!term.trim()) {
      setFilteredEntities(entitiesData);
      setCurrentPage(0);
      return;
    }

    const normalizedTerm = normalizeText(term);
    // Normalize CNPJ search term (remove non-digits for CNPJ comparison)
    const cnpjTerm = term.replace(/\D/g, '');

    const filtered = entitiesData.filter(entity => {
      // Search in text fields
      const searchFields = [
        entity.official_name,
        entity.entity_name,
        entity.trade_name || '',
        entity.city_name || '',
        entity.city_uf || '',
        entity.city_label || '',
        entity.partner_type || '',
        ...(entity.tags || [])
      ];

      const textMatch = searchFields.some(field => 
        normalizeText(field).includes(normalizedTerm)
      );

      // Check CNPJ separately (normalize both)
      const cnpjMatch = entity.cnpj && cnpjTerm && 
        entity.cnpj.replace(/\D/g, '').includes(cnpjTerm);

      return textMatch || cnpjMatch;
    });

    setFilteredEntities(filtered);
    setCurrentPage(0);
  }, []);

  const fetchEntities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar entidades de parceiros externos (usando LEFT JOIN para incluir entidades sem detalhes)
      const { data: entitiesData, error: entitiesError } = await supabase
        .from('contact_entities')
        .select(`
          id,
          name,
          status,
          contact_entity_external_partners (
            id,
            official_name,
            trade_name,
            cnpj,
            partner_type,
            city_id,
            site_cities (
              name,
              uf
            )
          )
        `)
        .eq('type', 'parceiros_externos')
        .eq('status', 'active');

      if (entitiesError) throw entitiesError;

      // Buscar tags para cada entidade
      const entityIds = entitiesData?.map(e => e.id) || [];
      let tagsData: any[] = [];
      
      if (entityIds.length > 0) {
        const { data: tags, error: tagsError } = await supabase
          .from('contact_entity_tags')
          .select(`
            entity_id,
            email_tags (
              name
            )
          `)
          .in('entity_id', entityIds);

        if (tagsError) throw tagsError;
        tagsData = tags || [];
      }

      // Transformar dados
      const transformedData: ExternalPartnerEntitySearchResult[] = (entitiesData || []).map(entity => {
        const entityTags = tagsData
          .filter(tag => tag.entity_id === entity.id)
          .map(tag => tag.email_tags?.name)
          .filter(Boolean);

        // Get details from external partner details (if exists)
        const partnerDetails = entity.contact_entity_external_partners?.[0];

        return {
          id: partnerDetails?.id || entity.id, // Use details ID if exists, otherwise entity ID
          entity_id: entity.id,
          entity_name: entity.name,
          official_name: partnerDetails?.official_name || entity.name, // Fallback to entity name
          trade_name: partnerDetails?.trade_name || undefined,
          cnpj: partnerDetails?.cnpj || undefined,
          city_name: partnerDetails?.site_cities?.name || undefined,
          city_uf: partnerDetails?.site_cities?.uf || undefined,
          city_label: partnerDetails?.site_cities 
            ? `${partnerDetails.site_cities.name} - ${partnerDetails.site_cities.uf}` 
            : undefined,
          partner_type: partnerDetails?.partner_type || undefined,
          tags: entityTags
        };
      });

      setEntities(transformedData);
      // Re-apply current filter if there's a search term
      if (searchTerm.trim()) {
        filterEntitiesWithTerm(transformedData, searchTerm);
      } else {
        setFilteredEntities(transformedData);
      }
    } catch (err) {
      console.error('Error fetching external partner entities:', err);
      setError('Erro ao carregar entidades');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterEntitiesWithTerm]);

  // Use the improved filter function
  const filterEntities = useCallback((term: string) => {
    filterEntitiesWithTerm(entities, term);
  }, [entities, filterEntitiesWithTerm]);

  // Entidades paginadas
  const paginatedEntities = filteredEntities.slice(0, (currentPage + 1) * pageSize);
  const hasMore = paginatedEntities.length < filteredEntities.length;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore]);

  const search = useCallback((term: string) => {
    setSearchTerm(term);
    filterEntities(term);
  }, [filterEntities]);

  const refetch = useCallback(() => {
    fetchEntities();
  }, [fetchEntities]);

  return {
    entities: paginatedEntities,
    loading,
    error,
    hasMore,
    searchTerm,
    search,
    loadMore,
    refetch
  };
};