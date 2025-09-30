import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, History, Folder, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface SearchFilter {
  departments: string[];
  status: ('active' | 'archived' | 'hidden')[];
  documentTypes: string[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

interface SearchBarEnhancedProps {
  onSearch: (query: string, filters: SearchFilter) => void;
  onFilterChange?: (filters: SearchFilter) => void;
  departments: { id: string; name: string }[];
  recentSearches?: string[];
  placeholder?: string;
  className?: string;
}

export const SearchBarEnhanced: React.FC<SearchBarEnhancedProps> = ({
  onSearch,
  onFilterChange,
  departments = [],
  recentSearches = [],
  placeholder = "Buscar documentos e pastas...",
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState<SearchFilter>({
    departments: [],
    status: ['active'],
    documentTypes: []
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const documentTypes = [
    'PDF', 'Word', 'Excel', 'PowerPoint', 'Imagem', 'Outros'
  ];

  const statusOptions = [
    { value: 'active', label: 'Ativo' },
    { value: 'archived', label: 'Arquivado' },
    { value: 'hidden', label: 'Oculto' }
  ] as const;

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (query?: string) => {
    const searchTerm = query ?? searchQuery;
    onSearch(searchTerm, filters);
    setShowSuggestions(false);
  };

  const handleFilterChange = (newFilters: Partial<SearchFilter>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const selectRecentSearch = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const getActiveFiltersCount = () => {
    return filters.departments.length + 
           (filters.status.length !== 1 ? filters.status.length : 0) +
           filters.documentTypes.length;
  };

  return (
    <div className={cn("relative w-full max-w-2xl", className)}>
      {/* Main search bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="pl-10 pr-20 h-12 text-base border-0 bg-background/95 backdrop-blur-sm shadow-sm"
          />
          
          {/* Clear button */}
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-12 h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* Filter button */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 h-8 w-8 p-0 hover:bg-muted"
              >
                <div className="relative">
                  <Filter className="h-4 w-4" />
                  {getActiveFiltersCount() > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center"
                    >
                      {getActiveFiltersCount()}
                    </Badge>
                  )}
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-3">Filtros de Busca</h4>
                </div>

                {/* Department filters */}
                <div>
                  <Label className="text-sm font-medium">Departamentos</Label>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {departments.map((dept) => (
                      <div key={dept.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dept-${dept.id}`}
                          checked={filters.departments.includes(dept.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleFilterChange({
                                departments: [...filters.departments, dept.id]
                              });
                            } else {
                              handleFilterChange({
                                departments: filters.departments.filter(id => id !== dept.id)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`dept-${dept.id}`} className="text-sm">
                          {dept.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Status filters */}
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-2 space-y-2">
                    {statusOptions.map((status) => (
                      <div key={status.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status.value}`}
                          checked={filters.status.includes(status.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleFilterChange({
                                status: [...filters.status, status.value]
                              });
                            } else {
                              handleFilterChange({
                                status: filters.status.filter(s => s !== status.value)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`status-${status.value}`} className="text-sm">
                          {status.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Document type filters */}
                <div>
                  <Label className="text-sm font-medium">Tipos de Documento</Label>
                  <div className="mt-2 space-y-2">
                    {documentTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={filters.documentTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleFilterChange({
                                documentTypes: [...filters.documentTypes, type]
                              });
                            } else {
                              handleFilterChange({
                                documentTypes: filters.documentTypes.filter(t => t !== type)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`type-${type}`} className="text-sm">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Search suggestions */}
        {showSuggestions && (searchQuery || recentSearches.length > 0) && (
          <Card 
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 z-50 border-0 shadow-lg bg-background/95 backdrop-blur-sm"
          >
            <CardContent className="p-2">
              {/* Recent searches */}
              {recentSearches.length > 0 && !searchQuery && (
                <div>
                  <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                    <History className="h-3 w-3" />
                    <span>Buscas recentes</span>
                  </div>
                  {recentSearches.slice(0, 5).map((recent, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start h-8 text-sm font-normal"
                      onClick={() => selectRecentSearch(recent)}
                    >
                      <Search className="h-3 w-3 mr-2" />
                      {recent}
                    </Button>
                  ))}
                </div>
              )}

              {/* Search suggestions based on current query */}
              {searchQuery && (
                <div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-8 text-sm font-medium"
                    onClick={() => handleSearch()}
                  >
                    <Search className="h-3 w-3 mr-2" />
                    Buscar por "{searchQuery}"
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Active filters display */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {filters.departments.map((deptId) => {
            const dept = departments.find(d => d.id === deptId);
            return dept ? (
              <Badge key={deptId} variant="secondary" className="text-xs">
                <Folder className="h-3 w-3 mr-1" />
                {dept.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                  onClick={() => handleFilterChange({
                    departments: filters.departments.filter(id => id !== deptId)
                  })}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ) : null;
          })}

          {filters.documentTypes.map((type) => (
            <Badge key={type} variant="secondary" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              {type}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                onClick={() => handleFilterChange({
                  documentTypes: filters.documentTypes.filter(t => t !== type)
                })}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};