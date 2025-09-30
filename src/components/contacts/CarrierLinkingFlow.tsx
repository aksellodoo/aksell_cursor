import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface CarrierLinkingFlowProps {
  onConfirm: (links: { link_type: 'entidade'; target_id: string; target_kind: 'carrier' }[]) => void;
  onCancel: () => void;
}

interface Carrier {
  id: string;
  a4_nreduz: string;
  a4_nome: string;
  a4_cgc: string;
  a4_filial: string;
  a4_cod: string;
  a4_est: string;
  a4_cod_mun: string;
}

export function CarrierLinkingFlow({ onConfirm, onCancel }: CarrierLinkingFlowProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: carriers = [], isLoading } = useQuery({
    queryKey: ['carriers-search', debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm.trim()) return [];

      const term = debouncedSearchTerm.trim();
      
      // Search for cities that match the term
      let cityFilter = '';
      const { data: cities } = await supabase
        .from('site_cities')
        .select('id')
        .ilike('name', `%${term}%`)
        .limit(100);
      
      if (cities && cities.length > 0) {
        const cityIds = cities.map(city => city.id).join(',');
        cityFilter = `,a4_cod_mun.in.(${cityIds})`;
      }
      
      // Start with base query
      let query = supabase
        .from('protheus_sa4010_ea26a13a')
        .select('id, a4_nreduz, a4_nome, a4_cgc, a4_filial, a4_cod, a4_est, a4_cod_mun');

      // Search by name (a4_nreduz or a4_nome)
      const nameFilter = `a4_nreduz.ilike.%${term}%,a4_nome.ilike.%${term}%`;
      
      // If term has digits (potential CNPJ search)
      const digits = term.replace(/\D/g, '');
      let cnpjFilter = '';
      if (digits.length >= 6) {
        const cnpjPattern = digits.split('').join('%');
        cnpjFilter = `,a4_cgc.ilike.%${cnpjPattern}%`;
      }

      // Search by state (if 2 letters)
      let stateFilter = '';
      if (term.length === 2 && /^[A-Za-z]{2}$/.test(term)) {
        stateFilter = `,a4_est.ilike.%${term.toUpperCase()}%`;
      }

      // Combine all filters
      const combinedFilter = nameFilter + cnpjFilter + stateFilter + cityFilter;
      
      const { data, error } = await query
        .or(combinedFilter)
        .order('a4_nreduz', { ascending: true })
        .limit(50);

      if (error) throw error;
      
      return data || [];
    },
    enabled: debouncedSearchTerm.trim().length > 0,
  });

  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return '';
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length === 14) {
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return cnpj;
  };

  const filteredCarriers = useMemo(() => {
    return carriers.map(carrier => ({
      ...carrier,
      displayName: carrier.a4_nreduz || carrier.a4_nome || 'Transportadora sem nome',
      secondaryInfo: [
        carrier.a4_cgc ? formatCNPJ(carrier.a4_cgc) : null,
        carrier.a4_est || null,
        carrier.a4_filial && carrier.a4_cod ? `${carrier.a4_filial}/${carrier.a4_cod}` : null,
      ].filter(Boolean).join(' • ')
    }));
  }, [carriers]);

  const handleConfirm = useCallback(() => {
    if (selectedCarrierId) {
      onConfirm([{
        link_type: 'entidade',
        target_id: selectedCarrierId,
        target_kind: 'carrier'
      }]);
    }
  }, [selectedCarrierId, onConfirm]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="carrier-search">Buscar Transportadora</Label>
        <Input
          id="carrier-search"
          type="text"
          placeholder="Digite o nome, CNPJ, cidade ou estado da transportadora..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
        <p className="text-sm text-muted-foreground">
          Busque por nome fantasia, razão social, CNPJ, cidade ou estado (UF).
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Buscando transportadoras...</span>
        </div>
      )}

      {!isLoading && debouncedSearchTerm.trim() && filteredCarriers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhuma transportadora encontrada.</p>
          <p className="text-sm">Tente refinar sua busca.</p>
        </div>
      )}

      {!isLoading && filteredCarriers.length > 0 && (
        <div className="space-y-3">
          <Label>Selecione a Transportadora</Label>
          <RadioGroup value={selectedCarrierId} onValueChange={setSelectedCarrierId}>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredCarriers.map((carrier) => (
                <div key={carrier.id} className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={carrier.id} id={carrier.id} className="mt-1" />
                  <label htmlFor={carrier.id} className="flex-1 cursor-pointer">
                    <div className="space-y-1">
                      <div className="font-medium">{carrier.displayName}</div>
                      {carrier.secondaryInfo && (
                        <div className="text-sm text-muted-foreground">{carrier.secondaryInfo}</div>
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      )}

      <div className="flex gap-4 justify-end pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleConfirm} disabled={!selectedCarrierId}>
          Vincular
        </Button>
      </div>
    </div>
  );
}