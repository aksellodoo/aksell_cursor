
import { useState, useEffect, useMemo } from 'react';
import { useSiteCities } from '@/hooks/useSiteCities';

export interface CityOption {
  value: string;
  label: string;
  city: string;
  uf: string;
}

export const useCitySearch = (searchTerm: string = '', selectedUF: string = '') => {
  const { cities, isLoading } = useSiteCities();

  const cityOptions = useMemo((): CityOption[] => {
    if (!cities) return [];

    return cities
      .filter(city => {
        const matchesSearch = !searchTerm || 
          city.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesUF = !selectedUF || 
          city.uf.toLowerCase() === selectedUF.toLowerCase();
        
        return matchesSearch && matchesUF;
      })
      .map(city => ({
        value: city.id,
        label: `${city.name} - ${city.uf}`,
        city: city.name,
        uf: city.uf
      }))
      .sort((a, b) => a.city.localeCompare(b.city));
  }, [cities, searchTerm, selectedUF]);

  const uniqueUFs = useMemo(() => {
    if (!cities) return [];
    
    const ufs = Array.from(new Set(cities.map(city => city.uf)))
      .sort()
      .map(uf => ({ value: uf, label: uf }));
    
    return ufs;
  }, [cities]);

  return {
    cityOptions,
    uniqueUFs,
    isLoading
  };
};
