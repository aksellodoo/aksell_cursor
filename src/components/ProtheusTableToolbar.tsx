import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Filter, X, RefreshCw } from 'lucide-react';

interface ProtheusTableToolbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  columnFilters: Record<string, string>;
  onColumnFiltersChange: (filters: Record<string, string>) => void;
  onRefresh: () => void;
  loading?: boolean;
  filterFields: Array<{ key: string; label: string; placeholder?: string }>;
  middleAction?: React.ReactNode;
  compactButtons?: boolean;
}

export const ProtheusTableToolbar: React.FC<ProtheusTableToolbarProps> = ({
  searchTerm,
  onSearchChange,
  columnFilters = {},
  onColumnFiltersChange,
  onRefresh,
  loading = false,
  filterFields = [],
  middleAction,
  compactButtons = false
}) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const activeFiltersCount = Object.values(columnFilters || {}).filter(value => value && value.trim() !== '').length;
  const hasActiveFilters = activeFiltersCount > 0 || searchTerm.trim() !== '';

  const clearAllFilters = () => {
    onSearchChange('');
    onColumnFiltersChange({});
    setIsFiltersOpen(false);
  };

  const removeColumnFilter = (key: string) => {
    const newFilters = { ...columnFilters };
    delete newFilters[key];
    onColumnFiltersChange(newFilters);
  };

  const updateColumnFilter = (key: string, value: string) => {
    const newFilters = { ...columnFilters };
    if (value.trim() === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onColumnFiltersChange(newFilters);
  };

  return (
    <div className="space-y-4">
      {/* Main toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Search */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar em todos os campos..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="relative"
                size={compactButtons ? "sm" : "default"}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filtros por coluna</h4>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-auto p-1 text-xs"
                    >
                      Limpar tudo
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {filterFields.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <Label htmlFor={`filter-${field.key}`} className="text-sm">
                        {field.label}
                      </Label>
                      <Input
                        id={`filter-${field.key}`}
                        placeholder={field.placeholder || `Filtrar ${field.label.toLowerCase()}...`}
                        value={columnFilters[field.key] || ''}
                        onChange={(e) => updateColumnFilter(field.key, e.target.value)}
                        className="h-8"
                      />
                    </div>
                  ))}
                </div>
                
                <div className="text-xs text-muted-foreground border-t pt-2">
                  Os filtros são aplicados como busca por substring (case-insensitive)
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {middleAction && middleAction}

          <Button 
            onClick={onRefresh} 
            variant="outline" 
            size={compactButtons ? "sm" : "default"}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="default"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-2" />
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Active filters badges */}
      {(searchTerm.trim() !== '' || activeFiltersCount > 0) && (
        <div className="flex flex-wrap gap-2">
          {searchTerm.trim() !== '' && (
            <Badge variant="secondary" className="px-2 py-1">
              Busca geral: "{searchTerm}"
              <button
                onClick={() => onSearchChange('')}
                className="ml-2 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          
          {Object.entries(columnFilters).map(([key, value]) => {
            const field = filterFields.find(f => f.key === key);
            if (!value.trim()) return null;
            
            return (
              <Badge key={key} variant="secondary" className="px-2 py-1">
                {field?.label || key}: "{value}"
                <button
                  onClick={() => removeColumnFilter(key)}
                  className="ml-2 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};