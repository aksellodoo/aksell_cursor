import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2 } from "lucide-react"
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UnifiedSupplierSearchResult {
  unified_id: string;
  display_name: string;
  unified_status: string;
  protheus_filial?: string;
  protheus_cod?: string;
  protheus_loja?: string;
  current_group_id?: string;
  current_group_name?: string;
}

export function UnifiedSupplierSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UnifiedSupplierSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.rpc('search_unified_suppliers_for_groups_simple', {
        p_search_term: term.trim()
      });

      if (error) throw error;

      setSearchResults(data || []);
      setHasSearched(true);
    } catch (error) {
      console.error('Error searching suppliers:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar fornecedores",
        variant: "destructive"
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, handleSearch]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'potential_only':
        return 'secondary';
      case 'supplier':
        return 'default';
      case 'potential_and_supplier':
        return 'success';
      case 'archived':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'potential_only':
        return 'Potencial Fornecedor';
      case 'supplier':
        return 'Fornecedor Protheus';
      case 'potential_and_supplier':
        return 'Potencial + Fornecedor';
      case 'archived':
        return 'Arquivado';
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Busca de Fornecedores para Grupos</CardTitle>
        <CardDescription>
          Busque fornecedores unificados para adicionar a grupos econômicos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Digite nome, CNPJ, código Protheus..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {isSearching && (
            <Button disabled variant="outline">
              <Loader2 className="w-4 h-4 animate-spin" />
            </Button>
          )}
        </div>

        {hasSearched && (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Protheus</TableHead>
                  <TableHead>Grupo Atual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <TableRow key={result.unified_id}>
                      <TableCell className="font-medium">
                        {result.display_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(result.unified_status) as any}>
                          {getStatusLabel(result.unified_status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {result.protheus_cod ? (
                          <span className="text-sm">
                            {result.protheus_filial}/{result.protheus_cod}/{result.protheus_loja}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {result.current_group_name ? (
                          <Badge variant="outline" className="text-xs">
                            {result.current_group_name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sem grupo</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      {searchTerm.trim() ? 'Nenhum fornecedor encontrado.' : 'Digite algo para buscar...'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}