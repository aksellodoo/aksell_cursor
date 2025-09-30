import { useState, useMemo, useCallback, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCitySearchPaginated } from "@/hooks/useCitySearchPaginated";
import { BRAZILIAN_UFS } from "@/constants/ufs";

interface CityComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CityCombobox({ value, onValueChange, placeholder = "Selecione uma cidade...", className }: CityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedUF, setSelectedUF] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");

  // Helper function to normalize text for search
  const normalize = (str: string) => 
    str.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[-\s]+/g, ' ')
      .trim();

  // Parse search term to extract UF if present
  const parseSearchTerm = (search: string) => {
    const normalized = normalize(search);
    const tokens = normalized.split(' ').filter(Boolean);
    
    // Check if any token is a UF (2 letters) and matches Brazilian UFs
    const ufToken = tokens.find(token => 
      token.length === 2 && 
      /^[a-z]{2}$/.test(token) &&
      BRAZILIAN_UFS.some(uf => uf.value.toLowerCase() === token)
    );
    const cityTokens = tokens.filter(token => token !== ufToken);
    
    return {
      citySearch: cityTokens.join(' '),
      ufFromSearch: ufToken?.toUpperCase()
    };
  };

  // Parse current search and auto-detect UF
  const { citySearch, ufFromSearch } = parseSearchTerm(debouncedSearchTerm);
  const activeUF = ufFromSearch || selectedUF;

  // Use paginated search hook
  const { 
    cityOptions, 
    uniqueUFs, 
    isLoading, 
    isFetching, 
    hasMore, 
    loadMore 
  } = useCitySearchPaginated({
    searchTerm: citySearch,
    selectedUF: activeUF,
    enabled: open
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  // Handle UF selection
  const handleUFChange = useCallback((uf: string) => {
    const actualUF = uf === "ALL" ? "" : uf;
    setSelectedUF(actualUF);
    // Clear search input when UF is changed manually
    if (actualUF !== ufFromSearch) {
      setSearchInput("");
      setDebouncedSearchTerm("");
    }
  }, [ufFromSearch]);

  // Update selected label when value changes
  useEffect(() => {
    if (value && !selectedLabel) {
      const foundCity = cityOptions.find((city) => city.value === value);
      if (foundCity) {
        setSelectedLabel(foundCity.label);
      }
    }
  }, [value, cityOptions, selectedLabel]);

  // Find selected city from options or use stored label
  const selectedCity = cityOptions.find((city) => city.value === value) || 
    (value && selectedLabel ? { value, label: selectedLabel } : null);

  // Handle infinite scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
    
    if (isNearBottom && hasMore && !isFetching) {
      loadMore();
    }
  }, [hasMore, isFetching, loadMore]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={isLoading}
        >
          {selectedCity ? selectedCity.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="p-2 border-b border-border">
          <Select value={selectedUF || "ALL"} onValueChange={handleUFChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Filtrar por estado..." />
            </SelectTrigger>
            <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
              <SelectItem value="ALL">Todos os estados</SelectItem>
              {uniqueUFs.map((uf) => (
                <SelectItem key={uf.value} value={uf.value}>
                  {uf.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Buscar cidade... (ex: Indaiatuba, Indaiatuba SP, SP Indaiatuba)" 
            className="h-9"
            value={searchInput}
            onValueChange={handleSearchChange}
          />
          <CommandList onScroll={handleScroll} className="max-h-64">
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Carregando cidades...</span>
                </div>
              ) : (
                "Nenhuma cidade encontrada."
              )}
            </CommandEmpty>
            <CommandGroup>
              {cityOptions.map((city) => (
                <CommandItem
                  key={city.value}
                  value={city.value}
                  onSelect={() => {
                    onValueChange(city.value);
                    setSelectedLabel(city.label);
                    setOpen(false);
                    setSearchInput("");
                    setDebouncedSearchTerm("");
                    setSelectedUF("");
                  }}
                >
                  {city.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === city.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
              {isFetching && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Carregando mais...</span>
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}