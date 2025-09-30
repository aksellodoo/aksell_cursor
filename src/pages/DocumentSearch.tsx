import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Download, Folder, AlertCircle, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { PageLayout } from '@/components/PageLayout';
import { ACLHealthDashboard } from '@/components/ACLHealthDashboard';

interface SearchResult {
  document_id: string;
  filename: string;
  folder_id: string;
  chunk_index: number;
  content: string;
  section: string;
  distance: number;
}

interface Department {
  id: string;
  name: string;
}

export default function DocumentSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [includeHidden, setIncludeHidden] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Load departments and user profile on mount
  useEffect(() => {
    const loadData = async () => {
      // Load departments
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      if (deptError) {
        console.error('Failed to load departments:', deptError);
      } else {
        setDepartments(deptData || []);
      }

      // Load user profile to check role
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!profileError && profile) {
          setUserRole(profile.role);
        }
      }
    };

    loadData();
  }, [user]);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Digite uma consulta para buscar');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('search-docs', {
        body: {
          query: query.trim(),
          departmentId: selectedDepartment || undefined,
          includeArchived,
          includeHidden
        }
      });

      if (error) throw error;

      setResults(data?.results || []);
      
      if (!data?.results || data.results.length === 0) {
        toast.info('Nenhum resultado encontrado para sua consulta');
      } else {
        toast.success(`Encontrados ${data.results.length} resultados`);
      }

    } catch (error: any) {
      console.error('Search error:', error);
      setError(error.message || 'Erro ao buscar documentos');
      toast.error('Erro ao buscar documentos');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownload = async (documentId: string, filename: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('download-doc', {
        body: { id: documentId }
      });

      if (error) throw error;

      if (data?.download_url) {
        // Open download URL in new window
        window.open(data.download_url, '_blank');
        toast.success(`Download iniciado: ${filename}`);
      } else {
        throw new Error('URL de download não recebida');
      }

    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(`Erro ao baixar arquivo: ${error.message}`);
    }
  };

  const openInFolder = (folderId: string) => {
    // Navigate to department page with folder
    navigate(`/departamentos?folder=${folderId}`);
  };

  const highlightQuery = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark className="bg-yellow-200 px-1 rounded">$1</mark>');
  };

  const truncateContent = (content: string, maxLength: number = 300) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (!user) {
    return (
      <PageLayout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você precisa estar logado para buscar documentos.
          </AlertDescription>
        </Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Buscar Documentos</h1>
          <p className="text-muted-foreground">
            Busque por conteúdo em documentos usando inteligência artificial
          </p>
        </div>

        {/* ACL Health Dashboard for Admins */}
        {userRole && ['admin', 'director'].includes(userRole) && (
          <ACLHealthDashboard />
        )}

        {/* Search Form */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Main Search Input */}
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    placeholder="Digite sua consulta (ex: 'políticas de RH', 'processos de qualidade')"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="text-base"
                  />
                </div>
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching || !query.trim()}
                  className="px-6"
                >
                  {isSearching ? (
                    <>
                      <Search className="h-4 w-4 mr-2 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Buscar
                    </>
                  )}
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Filtros:</span>
                </div>

                <Select value={selectedDepartment || "all"} onValueChange={(value) => setSelectedDepartment(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todos os departamentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os departamentos</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-archived"
                    checked={includeArchived}
                    onCheckedChange={(checked) => setIncludeArchived(checked === true)}
                  />
                  <label htmlFor="include-archived" className="text-sm">
                    Incluir arquivados
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-hidden"
                    checked={includeHidden}
                    onCheckedChange={(checked) => setIncludeHidden(checked === true)}
                  />
                  <label htmlFor="include-hidden" className="text-sm">
                    Incluir ocultos
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading Skeleton */}
        {isSearching && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-16 w-full" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results */}
        {!isSearching && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Resultados ({results.length})
              </h2>
              <Badge variant="outline">
                Ordenados por relevância
              </Badge>
            </div>

            {results.map((result, index) => (
              <Card key={`${result.document_id}-${result.chunk_index}`} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{result.filename}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openInFolder(result.folder_id)}
                      >
                        <Folder className="h-4 w-4 mr-1" />
                        Abrir na Pasta
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(result.document_id, result.filename)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                  {result.section && (
                    <Badge variant="secondary" className="w-fit">
                      {result.section}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <div
                    className="text-sm text-muted-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: highlightQuery(truncateContent(result.content), query)
                    }}
                  />
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">
                      Trecho {result.chunk_index + 1} • Relevância: {(1 - result.distance).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isSearching && query && results.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum resultado encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Tente ajustar sua consulta ou modificar os filtros
              </p>
              <div className="text-sm text-muted-foreground">
                <p>Dicas para melhorar a busca:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Use palavras-chave específicas</li>
                  <li>Tente sinônimos ou termos relacionados</li>
                  <li>Verifique se incluiu departamentos relevantes</li>
                  <li>Considere incluir documentos arquivados</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isSearching && !query && (
          <Card>
            <CardContent className="pt-6 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Busca Inteligente de Documentos</h3>
              <p className="text-muted-foreground">
                Digite uma consulta acima para buscar por conteúdo em documentos indexados
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}