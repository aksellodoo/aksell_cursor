
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronDown, MapPin, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCitySearchPaginated } from '@/hooks/useCitySearchPaginated';

interface CitySelectorProps {
  value?: string;
  onValueChange: (cityId: string | undefined) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

export const CitySelector = ({ 
  value, 
  onValueChange, 
  placeholder = "Selecione uma cidade...",
  label,
  required,
  className 
}: CitySelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUF, setSelectedUF] = useState('ALL');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  const { cityOptions, uniqueUFs, isLoading, isFetching, hasMore, loadMore, totalCount } = useCitySearchPaginated({
    searchTerm: debouncedSearchTerm,
    selectedUF: selectedUF === 'ALL' ? '' : selectedUF,
    enabled: open
  });

  const selectedCity = cityOptions.find(city => city.value === value);

  const handleSelect = (cityId: string) => {
    onValueChange(cityId === value ? undefined : cityId);
    setOpen(false);
  };

  const handleClear = () => {
    onValueChange(undefined);
    setSearchTerm('');
    setSelectedUF('ALL');
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10"
            disabled={isLoading}
          >
            {selectedCity ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{selectedCity.label}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput 
                placeholder="Buscar cidade..." 
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="flex-1"
              />
              {isFetching && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-50" />
              )}
            </div>
            
            {/* Filtro por UF */}
            <div className="border-b p-2">
              <Select value={selectedUF} onValueChange={setSelectedUF}>
                <SelectTrigger className="w-full h-8">
                  <SelectValue placeholder="Filtrar por estado..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os estados</SelectItem>
                  {uniqueUFs.map((uf) => (
                    <SelectItem key={uf.value} value={uf.value}>
                      {uf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <CommandList className="max-h-60">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Carregando cidades...
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    <div className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Nenhuma cidade encontrada.
                      </p>
                      {(searchTerm || selectedUF !== 'ALL') && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedUF('ALL');
                          }}
                        >
                          Limpar filtros
                        </Button>
                      )}
                    </div>
                  </CommandEmpty>
                  
                  <CommandGroup>
                    {cityOptions.map((city) => (
                      <CommandItem
                        key={city.value}
                        value={city.value}
                        onSelect={() => handleSelect(city.value)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{city.city}</span>
                          <span className="text-xs text-muted-foreground">- {city.uf} - {city.country}</span>
                        </div>
                        <Check
                          className={cn(
                            "h-4 w-4",
                            value === city.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                    
                    {/* Load More Button */}
                    {hasMore && !isFetching && cityOptions.length > 0 && (
                      <div className="p-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={loadMore}
                          className="w-full"
                        >
                          Carregar mais cidades... ({totalCount} carregadas)
                        </Button>
                      </div>
                    )}
                    
                    {isFetching && cityOptions.length > 0 && (
                      <div className="p-2 border-t">
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Carregando mais...
                        </div>
                      </div>
                    )}
                  </CommandGroup>
                </>
              )}
            </CommandList>
            
            {/* Botão para limpar seleção */}
            {selectedCity && (
              <div className="border-t p-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClear}
                  className="w-full"
                >
                  Limpar seleção
                </Button>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
