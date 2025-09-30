import React, { useState } from 'react';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateInputProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  disableFuture?: boolean;
  disablePast?: boolean;
  className?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  placeholder = "Selecione uma data",
  disabled = false,
  disableFuture = false,
  disablePast = false,
  className,
}) => {
  const [inputValue, setInputValue] = useState(
    value ? format(value, "dd/MM/yyyy") : ""
  );
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Tentar fazer parse da data conforme o usuário digita
    if (newValue.length === 10) { // dd/MM/yyyy
      try {
        const parsedDate = parse(newValue, "dd/MM/yyyy", new Date());
        if (isValid(parsedDate)) {
          onChange(parsedDate);
        }
      } catch (error) {
        // Ignorar erros de parse enquanto o usuário está digitando
      }
    } else if (newValue === "") {
      onChange(undefined);
    }
  };

  const handleInputBlur = () => {
    // Validar e formatar a data quando o usuário sair do campo
    if (inputValue) {
      try {
        const parsedDate = parse(inputValue, "dd/MM/yyyy", new Date());
        if (isValid(parsedDate)) {
          setInputValue(format(parsedDate, "dd/MM/yyyy"));
          onChange(parsedDate);
        } else {
          // Se a data não for válida, resetar para o valor anterior
          setInputValue(value ? format(value, "dd/MM/yyyy") : "");
        }
      } catch (error) {
        setInputValue(value ? format(value, "dd/MM/yyyy") : "");
      }
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    onChange(date);
    setInputValue(date ? format(date, "dd/MM/yyyy") : "");
    setIsPopoverOpen(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir apenas números, barras e teclas de navegação
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (!allowedKeys.includes(e.key) && !/[0-9\/]/.test(e.key)) {
      e.preventDefault();
    }

    // Auto-inserir barras
    if (/[0-9]/.test(e.key)) {
      const currentValue = e.currentTarget.value;
      if (currentValue.length === 2 || currentValue.length === 5) {
        if (!currentValue.endsWith('/')) {
          setInputValue(currentValue + '/');
        }
      }
    }
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (disableFuture && date > today) return true;
    if (disablePast && date < today) return true;
    if (date < new Date("1900-01-01")) return true;
    
    return false;
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <div className="flex-1">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          placeholder="dd/mm/aaaa"
          disabled={disabled}
          maxLength={10}
          className="font-mono"
        />
      </div>
      
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={disabled}
            className="shrink-0"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleCalendarSelect}
            disabled={isDateDisabled}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};