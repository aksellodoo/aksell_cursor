import React, { useState, type ReactNode } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ColumnFilterPopoverProps {
  column: string;
  value?: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  children?: React.ReactElement; // custom trigger (e.g., the column name)
  applyMode?: 'immediate' | 'onEnter'; // New prop to control when filter is applied
}

export function ColumnFilterPopover({ column, value = '', onChange, onClear, children, applyMode = 'immediate' }: ColumnFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const hasValue = (value ?? '').length > 0;

  // Update input value when external value changes
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    if (applyMode === 'immediate') {
      onChange(newValue);
    }
  };

  const handleApply = () => {
    onChange(inputValue);
    setOpen(false);
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    onClear?.();
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && applyMode === 'onEnter') {
      handleApply();
    } else if (e.key === 'Escape') {
      setInputValue(value); // Reset to current applied value
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children ?? (
          <Button
            variant={hasValue ? 'default' : 'outline'}
            size="icon"
            className={`h-7 w-7 ${hasValue ? '' : 'text-muted-foreground'}`}
            aria-label={`Filtrar coluna ${column}`}
            title={`Filtrar coluna ${column}`}
          >
            <Filter className="h-3.5 w-3.5" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">Filtrar: {column}</div>
          <Input
            autoFocus
            placeholder={`Contém...`}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          
          {applyMode === 'onEnter' ? (
            <>
              <div className="text-xs text-muted-foreground">
                Pressione Enter para aplicar o filtro
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApply}
                  className="flex-1"
                >
                  Aplicar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="flex-1"
                >
                  Limpar
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Filtro por substring (case-insensitive)</span>
              {hasValue && (
                <button
                  type="button"
                  className="underline underline-offset-2 hover:text-foreground"
                  onClick={handleClear}
                >
                  Limpar
                </button>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
