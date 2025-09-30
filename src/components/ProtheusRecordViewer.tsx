import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FullscreenDialogContent } from '@/components/ui/fullscreen-dialog';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Copy, Search, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProtheusRecordViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: string;
  recordId: string;
  titleFields?: string[];
  fetchRecordById: (id: string) => Promise<any | null>;
  tableName?: string;
}

export const ProtheusRecordViewer: React.FC<ProtheusRecordViewerProps> = ({
  open,
  onOpenChange,
  tableId,
  recordId,
  titleFields = [],
  fetchRecordById,
  tableName
}) => {
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyFilled, setShowOnlyFilled] = useState(true);
  const { toast } = useToast();

  const getRecordStatus = (record: any): 'new' | 'updated' | 'unchanged' => {
    if (record?.is_new_record) return 'new';
    if (record?.was_updated_last_sync) return 'updated';
    return 'unchanged';
  };

  const generateTitle = (record: any) => {
    if (!record) return 'Carregando...';
    
    if (titleFields.length > 0) {
      const titleParts = titleFields
        .map(field => record[field])
        .filter(value => value && value !== '-')
        .join(' - ');
      
      if (titleParts) return titleParts;
    }

    // Fallback title based on common Protheus patterns
    if (record.a1_nome) {
      return `Cliente: ${record.a1_cod || ''}/${record.a1_loja || ''} - ${record.a1_nome}`;
    } else if (record.a3_nome) {
      return `Vendedor: ${record.a3_cod || ''} - ${record.a3_nome}`;
    }
    
    return `Registro: ${record.id?.substring(0, 8) || 'N/A'}`;
  };

  const formatFieldValue = (key: string, value: any) => {
    if (value === null || value === undefined || value === '') return '-';
    
    // Format dates
    if (key.includes('_at') || key.includes('date') || key.includes('data')) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
        }
      } catch (e) {
        // Continue with regular formatting if date parsing fails
      }
    }

    // Format booleans
    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não';
    }

    // Format arrays
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : '-';
    }

    // Format objects
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  };

  const getFieldDisplayName = (key: string) => {
    // Convert snake_case to readable format
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/^A1 /, 'Cliente: ')
      .replace(/^A3 /, 'Vendedor: ');
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: `${label} copiado para a área de transferência`,
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar para a área de transferência",
        variant: "destructive",
      });
    }
  };

  const filteredFields = React.useMemo(() => {
    if (!record) return [];
    
    let fields = Object.entries(record).filter(([key, value]) => {
      // Always show basic fields
      const basicFields = ['id', 'created_at', 'updated_at', 'protheus_id'];
      if (basicFields.includes(key)) return true;
      
      // Apply filled filter
      if (showOnlyFilled && (value === null || value === undefined || value === '')) {
        return false;
      }
      
      // Apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const keyMatch = key.toLowerCase().includes(searchLower);
        const valueMatch = String(value).toLowerCase().includes(searchLower);
        return keyMatch || valueMatch;
      }
      
      return true;
    });

    // Sort fields: basic fields first, then alphabetically
    fields.sort(([keyA], [keyB]) => {
      const basicFields = ['id', 'protheus_id', 'created_at', 'updated_at'];
      const aIsBasic = basicFields.includes(keyA);
      const bIsBasic = basicFields.includes(keyB);
      
      if (aIsBasic && !bIsBasic) return -1;
      if (!aIsBasic && bIsBasic) return 1;
      
      return keyA.localeCompare(keyB);
    });

    return fields;
  }, [record, searchQuery, showOnlyFilled]);

  const fetchRecord = async () => {
    if (!recordId || !fetchRecordById) return;

    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchRecordById(recordId);
      if (data) {
        setRecord(data);
      } else {
        setError('Registro não encontrado');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar registro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && recordId) {
      fetchRecord();
    } else if (!open) {
      setRecord(null);
      setError(null);
      setSearchQuery('');
    }
  }, [open, recordId]);

  if (!open) return null;

  return (
    <FullscreenDialogContent
      open={open}
      onOpenChange={onOpenChange}
      className="flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center space-x-4">
          <FileText className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">
              {generateTitle(record)}
            </h2>
            {tableName && (
              <p className="text-sm text-muted-foreground">
                Tabela: {tableName}
              </p>
            )}
          </div>
          {record && (
            <StatusBadge
              status={getRecordStatus(record)}
              recordHash={record.record_hash}
              updatedAt={record.updated_at}
            />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {record && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(record.id, 'ID do registro')}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar ID
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(JSON.stringify(record, null, 2), 'Dados do registro')}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar JSON
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner text="Carregando registro..." />
          </div>
        )}

        {error && (
          <div className="flex justify-center py-12">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchRecord} variant="outline">
                  Tentar novamente
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {record && !loading && !error && (
          <div className="p-6 space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Filtros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Buscar campos</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Digite para buscar campos ou valores..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-filled"
                      checked={showOnlyFilled}
                      onCheckedChange={setShowOnlyFilled}
                    />
                    <Label htmlFor="show-filled">Apenas campos preenchidos</Label>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Mostrando {filteredFields.length} de {Object.keys(record).length} campos
                </div>
              </CardContent>
            </Card>

            {/* Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFields.map(([key, value]) => (
                <Card key={key} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-muted-foreground">
                          {getFieldDisplayName(key)}
                        </Label>
                        {key === 'id' || key === 'protheus_id' ? (
                          <Badge variant="secondary" className="text-xs">
                            {key === 'id' ? 'ID' : 'Protheus'}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="min-h-[1.5rem] text-sm break-words">
                        {formatFieldValue(key, value)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredFields.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">
                    Nenhum campo encontrado com os filtros aplicados.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setShowOnlyFilled(false);
                    }}
                    className="mt-2"
                  >
                    Limpar filtros
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </FullscreenDialogContent>
  );
};