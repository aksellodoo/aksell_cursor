import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PublicOrgEntitySearchResult {
  id: string;
  entity_id: string;
  entity_name: string;
  official_name: string;
  cnpj?: string;
  city_name?: string;
  city_uf?: string;
  city_label?: string;
  tags: string[];
}

export const usePublicOrgEntitiesSearch = () => {
  const [entities, setEntities] = useState<PublicOrgEntitySearchResult[]>([]);
  const [filteredEntities, setFilteredEntities] = useState<PublicOrgEntitySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 50;

  const normalizeText = (text: string) => 
    text.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const fetchEntities = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query public org entities with joins
      const { data: publicOrgs, error: publicOrgError } = await supabase
        .from('contact_entity_public_orgs')
        .select(`
          id,
          contact_entity_id,
          official_name,
          cnpj,
          city_id,
          contact_entities!inner (
            id,
            name,
            type,
            status
          ),
          site_cities (
            name,
            uf
          )
        `)
        .eq('contact_entities.type', 'orgaos_publicos_controle')
        .eq('contact_entities.status', 'active');

      if (publicOrgError) throw publicOrgError;

      if (!publicOrgs || publicOrgs.length === 0) {
        setEntities([]);
        setFilteredEntities([]);
        return;
      }

      // Get entity IDs for tag lookup
      const entityIds = publicOrgs.map(org => org.contact_entity_id);

      // Fetch tags for these entities
      const { data: tagData, error: tagError } = await supabase
        .from('contact_entity_tags')
        .select(`
          entity_id,
          email_tags (
            name
          )
        `)
        .in('entity_id', entityIds);

      if (tagError) {
        console.warn('Error fetching tags:', tagError);
      }

      // Group tags by entity ID
      const tagsByEntity: Record<string, string[]> = {};
      if (tagData) {
        tagData.forEach(item => {
          if (!tagsByEntity[item.entity_id]) {
            tagsByEntity[item.entity_id] = [];
          }
          if (item.email_tags?.name) {
            tagsByEntity[item.entity_id].push(item.email_tags.name);
          }
        });
      }

      // Transform data
      const transformedEntities: PublicOrgEntitySearchResult[] = publicOrgs.map(org => ({
        id: org.id,
        entity_id: org.contact_entity_id,
        entity_name: org.contact_entities?.name || '',
        official_name: org.official_name || '',
        cnpj: org.cnpj || undefined,
        city_name: org.site_cities?.name || undefined,
        city_uf: org.site_cities?.uf || undefined,
        city_label: org.site_cities 
          ? `${org.site_cities.name} - ${org.site_cities.uf}` 
          : undefined,
        tags: tagsByEntity[org.contact_entity_id] || []
      }));

      setEntities(transformedEntities);
      setFilteredEntities(transformedEntities);
    } catch (err) {
      console.error('Error fetching public org entities:', err);
      setError(err);
      toast.error('Erro ao carregar entidades');
    } finally {
      setLoading(false);
    }
  };

  // Filter entities based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEntities(entities);
      setCurrentPage(0);
      return;
    }

    const normalizedSearch = normalizeText(searchTerm);
    const filtered = entities.filter(entity => {
      // Search in official name
      if (normalizeText(entity.official_name).includes(normalizedSearch)) return true;
      
      // Search in entity name
      if (normalizeText(entity.entity_name).includes(normalizedSearch)) return true;
      
      // Search in CNPJ (digits only)
      if (entity.cnpj && entity.cnpj.replace(/[^0-9]/g, '').includes(searchTerm.replace(/[^0-9]/g, ''))) return true;
      
      // Search in city name and UF
      if (entity.city_name && normalizeText(entity.city_name).includes(normalizedSearch)) return true;
      if (entity.city_uf && normalizeText(entity.city_uf).includes(normalizedSearch)) return true;
      
      // Search in tags
      if (entity.tags.some(tag => normalizeText(tag).includes(normalizedSearch))) return true;
      
      return false;
    });

    setFilteredEntities(filtered);
    setCurrentPage(0);
  }, [searchTerm, entities]);

  // Get paginated results
  const paginatedEntities = filteredEntities.slice(0, (currentPage + 1) * pageSize);
  const hasMore = paginatedEntities.length < filteredEntities.length;

  const loadMore = () => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const search = (term: string) => {
    setSearchTerm(term);
  };

  const refetch = () => {
    fetchEntities();
  };

  // Initial fetch
  useEffect(() => {
    fetchEntities();
  }, []);

  return {
    entities: paginatedEntities,
    loading,
    error,
    search,
    refetch,
    hasMore,
    loadMore,
    totalCount: filteredEntities.length,
    searchTerm
  };
};