
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ChevronUp, ChevronDown, Search, Navigation, MapPin, MoreHorizontal, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface City {
  id: string;
  name: string;
  uf: string;
  country: string;
  cod_munic: string;
  codigo_ibge: string;
  population_est: number | null;
  latitude: number | null;
  longitude: number | null;
  capital: number;
  siafi_id: string;
  ddd: string;
  fuso_horario: string;
  created_at: string;
  distance_km_to_indaiatuba: number | null;
  average_truck_travel_time_hours: number | null;
  distance_source: string | null;
  route_unavailable: boolean | null;
}

interface CitiesListProps {
  refreshKey?: number;
}

type SortDirection = 'asc' | 'desc';
type SortField = 'name' | 'uf' | 'country' | 'cod_munic' | 'codigo_ibge' | 'population_est' | 'capital' | 'distance_km_to_indaiatuba' | 'average_truck_travel_time_hours';
type BadgeFilter = 'none' | 'matrix' | 'haversine';

export function CitiesList({ refreshKey }: CitiesListProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [ufFilter, setUfFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>('none');
  const [refreshingCities, setRefreshingCities] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 50;

  const fetchCities = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('site_cities')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,cod_munic.ilike.%${searchTerm}%,codigo_ibge.ilike.%${searchTerm}%`);
      }
      if (ufFilter) {
        query = query.eq('uf', ufFilter);
      }
      if (countryFilter) {
        query = query.eq('country', countryFilter);
      }
      
      // Aplicar filtro de badge
      if (badgeFilter === 'matrix') {
        query = query.in('distance_source', ['matrix', 'google_maps']);
      } else if (badgeFilter === 'haversine') {
        query = query.eq('distance_source', 'haversine');
      }

      // Aplicar ordenação
      query = query.order(sortField, { ascending: sortDirection === 'asc' });

      // Aplicar paginação
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao carregar cidades:', error);
        toast({
          title: "Erro ao carregar cidades",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setCities(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Erro ao carregar cidades:', error);
      toast({
        title: "Erro ao carregar cidades",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleApplySearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleBadgeFilterClick = () => {
    if (badgeFilter === 'none') {
      setBadgeFilter('matrix');
    } else if (badgeFilter === 'matrix') {
      setBadgeFilter('haversine');
    } else {
      setBadgeFilter('none');
    }
    setCurrentPage(1);
  };

  const handleRowBadgeClick = (sourceType: string) => {
    if (['matrix', 'google_maps'].includes(sourceType)) {
      setBadgeFilter('matrix');
    } else if (sourceType === 'haversine') {
      setBadgeFilter('haversine');
    }
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    fetchCities();
  };

  const handleRefreshCity = async (cityId: string, cityName: string) => {
    setRefreshingCities(prev => new Set(prev).add(cityId));
    
    try {
      const { data, error } = await supabase.functions.invoke('city-distance-matrix', {
        body: {
          action: 'refresh_city',
          cityId: cityId
        }
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Erro da função: ${error.message || 'Erro desconhecido'}`);
      }
      
      if (data?.success) {
        toast({
          title: "Sucesso",
          description: data.message || `Dados de ${cityName} atualizados com sucesso`,
        });
        
        // Refresh the cities list
        fetchCities();
      } else {
        console.error('Function returned error:', data);
        throw new Error(data?.error || data?.message || 'Erro desconhecido ao processar a cidade');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar cidade:', error);
      
      // More detailed error handling with Google API specific messages
      let errorMessage = `Erro ao atualizar dados de ${cityName}`;
      
      if (error.message?.includes('GOOGLE_MAPS_API_KEY not configured')) {
        errorMessage = 'Google Maps API Key não configurada. Configure nas funções do Supabase.';
      } else if (error.message?.includes('REQUEST_DENIED')) {
        errorMessage = 'Acesso negado à API do Google Maps. Verifique se a chave está correta e tem as permissões necessárias.';
      } else if (error.message?.includes('OVER_DAILY_LIMIT')) {
        errorMessage = 'Limite diário da API do Google Maps foi excedido. Tente novamente amanhã.';
      } else if (error.message?.includes('Acesso negado')) {
        errorMessage = 'Acesso negado à API do Google Maps. Verifique a configuração da chave.';
      } else if (error.message?.includes('non-2xx status code')) {
        errorMessage = 'Erro na comunicação com a API. Tente novamente em alguns minutos.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setRefreshingCities(prev => {
        const newSet = new Set(prev);
        newSet.delete(cityId);
        return newSet;
      });
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  useEffect(() => {
    fetchCities();
  }, [refreshKey, currentPage, sortField, sortDirection, searchTerm]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleFilterChange();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [ufFilter, countryFilter, badgeFilter]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, código municipal ou código IBGE..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleApplySearch();
                  }
                }}
                className="pl-10"
              />
            </div>
            <Button onClick={handleApplySearch} variant="default">
              Aplicar
            </Button>
            {(searchInput || searchTerm) && (
              <Button onClick={handleClearSearch} variant="outline">
                Limpar
              </Button>
            )}
          </div>
        </div>
        <Select value={ufFilter || "all"} onValueChange={(value) => setUfFilter(value === "all" ? "" : value)}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="AC">AC</SelectItem>
            <SelectItem value="AL">AL</SelectItem>
            <SelectItem value="AP">AP</SelectItem>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="BA">BA</SelectItem>
            <SelectItem value="CE">CE</SelectItem>
            <SelectItem value="DF">DF</SelectItem>
            <SelectItem value="ES">ES</SelectItem>
            <SelectItem value="GO">GO</SelectItem>
            <SelectItem value="MA">MA</SelectItem>
            <SelectItem value="MT">MT</SelectItem>
            <SelectItem value="MS">MS</SelectItem>
            <SelectItem value="MG">MG</SelectItem>
            <SelectItem value="PA">PA</SelectItem>
            <SelectItem value="PB">PB</SelectItem>
            <SelectItem value="PR">PR</SelectItem>
            <SelectItem value="PE">PE</SelectItem>
            <SelectItem value="PI">PI</SelectItem>
            <SelectItem value="RJ">RJ</SelectItem>
            <SelectItem value="RN">RN</SelectItem>
            <SelectItem value="RS">RS</SelectItem>
            <SelectItem value="RO">RO</SelectItem>
            <SelectItem value="RR">RR</SelectItem>
            <SelectItem value="SC">SC</SelectItem>
            <SelectItem value="SP">SP</SelectItem>
            <SelectItem value="SE">SE</SelectItem>
            <SelectItem value="TO">TO</SelectItem>
          </SelectContent>
        </Select>
        <Select value={countryFilter || "all"} onValueChange={(value) => setCountryFilter(value === "all" ? "" : value)}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="País" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Brasil">Brasil</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Informações e resultados */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>
          {loading ? 'Carregando...' : `${totalCount} cidades encontradas`}
        </span>
        {totalPages > 1 && (
          <span>
            Página {currentPage} de {totalPages}
          </span>
        )}
      </div>

      {cities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Nenhuma cidade encontrada.
          </p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('name')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Nome do Município
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('uf')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    UF
                    {sortField === 'uf' && (
                      sortDirection === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('capital')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Capital
                    {sortField === 'capital' && (
                      sortDirection === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('codigo_ibge')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Cód. IBGE
                    {sortField === 'codigo_ibge' && (
                      sortDirection === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>DDD</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('population_est')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    População
                    {sortField === 'population_est' && (
                      sortDirection === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('distance_km_to_indaiatuba')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Distância km até Indaiatuba
                      {sortField === 'distance_km_to_indaiatuba' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleBadgeFilterClick}
                      className="h-auto p-1 hover:bg-accent"
                      title={`Filtrar por: ${
                        badgeFilter === 'none' ? 'Todos' : 
                        badgeFilter === 'matrix' ? 'Matrix' : 'Haversine'
                      }`}
                    >
                      <Badge 
                        variant={badgeFilter === 'none' ? 'outline' : 'default'}
                        className={`text-xs cursor-pointer ${
                          badgeFilter === 'matrix' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                          badgeFilter === 'haversine' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' :
                          'hover:bg-accent'
                        }`}
                      >
                        {badgeFilter === 'none' ? 'Todos' : 
                         badgeFilter === 'matrix' ? 'Matrix' : 'Haversine'}
                      </Badge>
                    </Button>
                  </div>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('average_truck_travel_time_hours')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Tempo médio h caminhão
                    {sortField === 'average_truck_travel_time_hours' && (
                      sortDirection === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>Coordenadas</TableHead>
                <TableHead>Fuso Horário</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cities.map((city) => (
                <TableRow key={city.id}>
                  <TableCell className="font-medium">{city.name}</TableCell>
                  <TableCell>{city.uf}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      city.capital === 1 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {city.capital === 1 ? 'Sim' : 'Não'}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{city.codigo_ibge || city.cod_munic}</TableCell>
                  <TableCell>{city.ddd || '-'}</TableCell>
                  <TableCell>
                    {city.population_est ? city.population_est.toLocaleString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {city.distance_km_to_indaiatuba ? 
                        <>
                          <span>{city.distance_km_to_indaiatuba.toFixed(3).replace('.', ',')} km</span>
                          {city.distance_source && (
                            <Badge 
                              variant={['matrix', 'google_maps'].includes(city.distance_source) ? 'default' : 'secondary'}
                              className={`text-xs cursor-pointer transition-colors ${
                                ['matrix', 'google_maps'].includes(city.distance_source)
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                              }`}
                              onClick={() => handleRowBadgeClick(city.distance_source)}
                              title={`Filtrar por ${['matrix', 'google_maps'].includes(city.distance_source) ? 'Matrix' : 'Haversine'}`}
                            >
                              {['matrix', 'google_maps'].includes(city.distance_source) ? (
                                <><Navigation className="w-3 h-3 mr-1" />Matrix</>
                              ) : (
                                <><MapPin className="w-3 h-3 mr-1" />Haversine</>
                              )}
                            </Badge>
                          )}
                        </> : 
                        '-'
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    {city.average_truck_travel_time_hours ? 
                      `${city.average_truck_travel_time_hours.toFixed(2).replace('.', ',')} h` : 
                      '-'
                    }
                  </TableCell>
                  <TableCell className="text-xs">
                    {city.latitude && city.longitude ? (
                      <div>
                        <div>Lat: {city.latitude.toFixed(6)}</div>
                        <div>Lng: {city.longitude.toFixed(6)}</div>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-xs">{city.fuso_horario || '-'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          disabled={refreshingCities.has(city.id)}
                        >
                          {refreshingCities.has(city.id) ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleRefreshCity(city.id, city.name)}
                          disabled={refreshingCities.has(city.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Atualizar dados via Google
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <PaginationItem>
                    <span className="px-4">...</span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => setCurrentPage(totalPages)}
                      className="cursor-pointer"
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
