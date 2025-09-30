import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SiteCity } from '@/hooks/useSiteCities';
import { BRAZILIAN_UFS } from '@/constants/ufs';

export interface CityOption {
  value: string;
  label: string;
  city: string;
  uf: string;
  country: string;
}

const CITIES_PER_PAGE = 50;

interface UseCitySearchParams {
  searchTerm?: string;
  selectedUF?: string;
  enabled?: boolean;
}

export const useCitySearchPaginated = ({ searchTerm = '', selectedUF = '', enabled = true }: UseCitySearchParams) => {
  const [page, setPage] = useState(0);
  const [allCities, setAllCities] = useState<SiteCity[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Reset when search params change
  useEffect(() => {
    setPage(0);
    setAllCities([]);
    setHasMore(true);
  }, [searchTerm, selectedUF]);

  const searchQuery = useQuery({
    queryKey: ['cities_search', searchTerm, selectedUF, page],
    queryFn: async (): Promise<SiteCity[]> => {
      let query = supabase
        .from('site_cities')
        .select('*');

      // Apply search filter
      if (searchTerm.trim()) {
        query = query.ilike('name', `%${searchTerm.trim()}%`);
      }

      // Apply UF filter
      if (selectedUF.trim()) {
        query = query.eq('uf', selectedUF.trim());
      }

      // Apply pagination
      const from = page * CITIES_PER_PAGE;
      const to = from + CITIES_PER_PAGE - 1;

      query = query.order('name').range(from, to);

      const { data, error } = await query;

      if (error) {
        console.error('[useCitySearchPaginated] Error fetching cities:', error);
        throw error;
      }

      return data || [];
    },
    enabled: enabled,
  });

  // Update accumulated cities when new data arrives
  useEffect(() => {
    if (searchQuery.data) {
      if (page === 0) {
        // First page - replace all cities
        setAllCities(searchQuery.data);
      } else {
        // Subsequent pages - append to existing cities
        setAllCities(prev => [...prev, ...searchQuery.data]);
      }
      
      // Check if there are more cities to load
      setHasMore(searchQuery.data.length === CITIES_PER_PAGE);
    }
  }, [searchQuery.data, page]);

  // Use static list of Brazilian UFs
  const uniqueUFs = BRAZILIAN_UFS;

  const cityOptions = useMemo((): CityOption[] => {
    return allCities.map(city => ({
      value: city.id,
      label: `${city.name} - ${city.uf} - Brasil`,
      city: city.name,
      uf: city.uf,
      country: 'Brasil'
    }));
  }, [allCities]);

  const loadMore = () => {
    if (hasMore && !searchQuery.isFetching) {
      setPage(prev => prev + 1);
    }
  };

  return {
    cityOptions,
    uniqueUFs,
    isLoading: searchQuery.isLoading,
    isFetching: searchQuery.isFetching,
    hasMore,
    loadMore,
    totalCount: allCities.length
  };
};