
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Segment {
  id: string;
  name: string;
}

interface QuickSegmentSelectorProps {
  selectedSegments: Segment[];
  onSegmentsChange: (segments: Segment[]) => void;
  className?: string;
}

export const QuickSegmentSelector: React.FC<QuickSegmentSelectorProps> = ({
  selectedSegments,
  onSegmentsChange,
  className
}) => {
  const [open, setOpen] = useState(false);
  const [allSegments, setAllSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_product_segments')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAllSegments(data || []);
    } catch (error) {
      console.error('Erro ao carregar segmentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSegmentToggle = (segment: Segment) => {
    const isSelected = selectedSegments.some(s => s.id === segment.id);
    
    if (isSelected) {
      onSegmentsChange(selectedSegments.filter(s => s.id !== segment.id));
    } else {
      onSegmentsChange([...selectedSegments, segment]);
    }
  };

  const handleRemoveSegment = (segmentId: string) => {
    onSegmentsChange(selectedSegments.filter(s => s.id !== segmentId));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={loading}
          >
            {loading 
              ? "Carregando segmentos..."
              : selectedSegments.length > 0 
                ? `${selectedSegments.length} segmento(s) selecionado(s)`
                : "Selecionar segmentos..."
            }
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar segmentos..." />
            <CommandList>
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Carregando segmentos...
                </div>
              ) : allSegments.length === 0 ? (
                <CommandEmpty>Nenhum segmento ativo encontrado.</CommandEmpty>
              ) : (
                <>
                  <CommandEmpty>Nenhum segmento encontrado.</CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-72">
                      {allSegments.map((segment) => {
                        const isSelected = selectedSegments.some(s => s.id === segment.id);
                        return (
                          <CommandItem
                            key={segment.id}
                            value={segment.name}
                            onSelect={() => handleSegmentToggle(segment)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                isSelected ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {segment.name}
                          </CommandItem>
                        );
                      })}
                    </ScrollArea>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Segmentos selecionados */}
      {selectedSegments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSegments.map((segment) => (
            <Badge key={segment.id} variant="secondary" className="pr-1">
              {segment.name}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemoveSegment(segment.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
