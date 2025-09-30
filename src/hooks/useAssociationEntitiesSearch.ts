import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AssociationEntitySearchResult {
  id: string;
  entity_id: string;
  entity_name: string;
  official_name: string;
  acronym?: string;
  cnpj?: string;
  city_name?: string;
  city_uf?: string;
  city_label?: string;
  tags: string[];
  association_type?: string;
}

export const useAssociationEntitiesSearch = () => {
  const [results, setResults] = useState<AssociationEntitySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [lastSearchTerm, setLastSearchTerm] = useState('');

  const search = useCallback(async (searchTerm: string = '', reset: boolean = true) => {
    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;
      
      if (reset) {
        setLastSearchTerm(searchTerm);
      }
      
      // Buscar entidades base (associacoes_sindicatos)
      const { data: entities, error } = await supabase
        .from('contact_entities')
        .select(`
          id,
          name,
          type,
          status,
          contact_entity_associations (
            id,
            official_name,
            acronym,
            cnpj,
            association_type,
            city_id,
            site_cities (
              name,
              uf
            )
          )
        `)
        .eq('type', 'associacoes_sindicatos')
        .eq('status', 'active')
        .range(currentOffset, currentOffset + 49)
        .order('name');

      if (error) {
        console.error('Erro ao buscar entidades:', error);
        throw error;
      }

      // Buscar tags para cada entidade
      const entityIds = entities?.map(e => e.id) || [];
      let tagsMap: Record<string, string[]> = {};
      
      if (entityIds.length > 0) {
        const { data: entityTags } = await supabase
          .from('contact_entity_tags')
          .select(`
            entity_id,
            email_tags (
              name
            )
          `)
          .in('entity_id', entityIds);

        tagsMap = entityTags?.reduce((acc, item) => {
          if (!acc[item.entity_id]) acc[item.entity_id] = [];
          if (item.email_tags?.name) {
            acc[item.entity_id].push(item.email_tags.name);
          }
          return acc;
        }, {} as Record<string, string[]>) || {};
      }

      // Formatar resultados
      const formattedResults: AssociationEntitySearchResult[] = entities?.map(entity => {
        const association = entity.contact_entity_associations?.[0];
        const city = association?.site_cities;
        
        return {
          id: association?.id || entity.id,
          entity_id: entity.id,
          entity_name: entity.name,
          official_name: association?.official_name || entity.name,
          acronym: association?.acronym || undefined,
          cnpj: association?.cnpj || undefined,
          city_name: city?.name || undefined,
          city_uf: city?.uf || undefined,
          city_label: city ? `${city.name} - ${city.uf}` : undefined,
          tags: tagsMap[entity.id] || [],
          association_type: association?.association_type || undefined
        };
      }) || [];

      // Filtro client-side aplicado apenas se há termo de busca
      let filteredResults = formattedResults;
      if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase().trim();
        const searchCnpj = searchTerm.replace(/\D/g, '');
        
        filteredResults = formattedResults.filter(item => {
          const cnpjDigits = item.cnpj?.replace(/\D/g, '') || '';
          
          return (
            item.official_name.toLowerCase().includes(term) ||
            item.entity_name.toLowerCase().includes(term) ||
            item.acronym?.toLowerCase().includes(term) ||
            (searchCnpj && cnpjDigits.includes(searchCnpj)) ||
            item.city_name?.toLowerCase().includes(term) ||
            item.city_uf?.toLowerCase().includes(term) ||
            item.association_type?.toLowerCase().includes(term) ||
            item.tags.some(tag => tag.toLowerCase().includes(term))
          );
        });
      }

      if (reset) {
        setResults(filteredResults);
        setOffset(50);
      } else {
        setResults(prev => [...prev, ...filteredResults]);
        setOffset(prev => prev + 50);
      }
      
      // hasMore baseado no resultado bruto antes do filtro
      setHasMore((entities?.length || 0) === 50);
    } catch (error) {
      console.error('Erro na busca de associações:', error);
      if (reset) setResults([]);
    } finally {
      setLoading(false);
    }
  }, [offset]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      search(lastSearchTerm, false);
    }
  }, [search, loading, hasMore, lastSearchTerm]);

  return {
    results,
    loading,
    hasMore,
    search,
    loadMore
  };
};