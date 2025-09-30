import { useState } from 'react';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useBuyers, type Buyer } from '@/hooks/useBuyers';

interface BuyerSelectorProps {
  value?: string; // buyer_code
  onSelect: (buyer: Buyer | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function BuyerSelector({ value, onSelect, placeholder = "Selecionar comprador...", disabled }: BuyerSelectorProps) {
  const [open, setOpen] = useState(false);
  const { listQuery } = useBuyers();
  
  const buyers = listQuery.data || [];
  const selectedBuyer = buyers.find(({ buyer }) => buyer.y1_cod === value)?.buyer;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 shrink-0" />
            {selectedBuyer ? (
              <span className="truncate">
                {selectedBuyer.y1_nome} ({selectedBuyer.y1_cod}/{selectedBuyer.y1_filial})
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar comprador..." />
          <CommandEmpty>Nenhum comprador encontrado.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {value && (
              <CommandItem
                onSelect={() => {
                  onSelect(null);
                  setOpen(false);
                }}
                className="text-muted-foreground"
              >
                <Check className={cn("mr-2 h-4 w-4", !value && "opacity-100")} />
                Nenhum selecionado
              </CommandItem>
            )}
            {buyers.map(({ buyer }) => (
              <CommandItem
                key={`${buyer.y1_cod}-${buyer.y1_filial}`}
                value={`${buyer.y1_nome} ${buyer.y1_cod} ${buyer.y1_filial}`}
                onSelect={() => {
                  onSelect(buyer);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === buyer.y1_cod ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex-1">
                  <div className="font-medium">{buyer.y1_nome}</div>
                  <div className="text-sm text-muted-foreground">
                    Código: {buyer.y1_cod} | Filial: {buyer.y1_filial}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}