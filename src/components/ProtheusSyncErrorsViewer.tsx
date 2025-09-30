import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Eye, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface SyncError {
  id: string;
  sync_log_id: string;
  protheus_table_id: string;
  record_data: any;
  error_type: string;
  error_message: string;
  error_details: any;
  protheus_key_fields: any;
  attempt_number: number;
  created_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

interface ProtheusSyncErrorsViewerProps {
  tableId: string;
  syncLogId?: string;
}

export function ProtheusSyncErrorsViewer({ tableId, syncLogId }: ProtheusSyncErrorsViewerProps) {
  const [errors, setErrors] = useState<SyncError[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<SyncError | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  const fetchErrors = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('protheus_sync_errors')
        .select('*')
        .eq('protheus_table_id', tableId)
        .order('created_at', { ascending: false });
      
      if (syncLogId) {
        query = query.eq('sync_log_id', syncLogId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setErrors(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar erros",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getErrorTypeColor = (type: string) => {
    switch (type) {
      case 'duplicate_key': return 'bg-yellow-100 text-yellow-800';
      case 'foreign_key_violation': return 'bg-red-100 text-red-800';
      case 'not_null_violation': return 'bg-orange-100 text-orange-800';
      case 'check_constraint_violation': return 'bg-purple-100 text-purple-800';
      case 'unexpected_error': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getErrorTypeLabel = (type: string) => {
    switch (type) {
      case 'duplicate_key': return 'Chave Duplicada';
      case 'foreign_key_violation': return 'Violação FK';
      case 'not_null_violation': return 'Campo Obrigatório';
      case 'check_constraint_violation': return 'Violação Constraint';
      case 'unexpected_error': return 'Erro Inesperado';
      default: return 'Erro Desconhecido';
    }
  };

  const markAsResolved = async (errorId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('protheus_sync_errors')
        .update({
          resolved_at: new Date().toISOString(),
          resolution_notes: notes
        })
        .eq('id', errorId);
      
      if (error) throw error;
      
      toast({
        title: "Erro marcado como resolvido",
        description: "O erro foi marcado como resolvido com sucesso."
      });
      
      fetchErrors();
    } catch (error: any) {
      toast({
        title: "Erro ao marcar como resolvido",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchErrors();
  }, [tableId, syncLogId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Carregando erros...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Erros de Sincronização
            {errors.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {errors.filter(e => !e.resolved_at).length} não resolvidos
              </Badge>
            )}
          </CardTitle>
          <Button 
            onClick={fetchErrors} 
            size="sm" 
            variant="outline"
            className="w-fit"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {errors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum erro de sincronização encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {errors.map((error) => (
                <div 
                  key={error.id}
                  className={`border rounded-lg p-4 ${error.resolved_at ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getErrorTypeColor(error.error_type)}>
                          {getErrorTypeLabel(error.error_type)}
                        </Badge>
                        <Badge variant="outline">
                          Tentativa {error.attempt_number}
                        </Badge>
                        {error.resolved_at && (
                          <Badge className="bg-green-100 text-green-800">
                            Resolvido
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <div><strong>Erro:</strong> {error.error_message}</div>
                        <div><strong>Chaves:</strong> {JSON.stringify(error.protheus_key_fields)}</div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(error.created_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedError(error);
                          setShowDetails(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {!error.resolved_at && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => markAsResolved(error.id, 'Marcado como resolvido manualmente')}
                        >
                          Resolver
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Detalhes do Erro de Sincronização</DialogTitle>
          </DialogHeader>
          
          {selectedError && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Informações Básicas</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                    <div><strong>Tipo:</strong> {getErrorTypeLabel(selectedError.error_type)}</div>
                    <div><strong>Mensagem:</strong> {selectedError.error_message}</div>
                    <div><strong>Tentativa:</strong> {selectedError.attempt_number}</div>
                    <div><strong>Data:</strong> {new Date(selectedError.created_at).toLocaleString('pt-BR')}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Chaves do Registro</h4>
                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(selectedError.protheus_key_fields, null, 2)}
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Dados do Registro</h4>
                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-40">
                    {JSON.stringify(selectedError.record_data, null, 2)}
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Detalhes Técnicos</h4>
                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-40">
                    {JSON.stringify(selectedError.error_details, null, 2)}
                  </pre>
                </div>

                {selectedError.resolved_at && (
                  <div>
                    <h4 className="font-semibold mb-2">Resolução</h4>
                    <div className="bg-green-50 p-3 rounded text-sm space-y-1">
                      <div><strong>Resolvido em:</strong> {new Date(selectedError.resolved_at).toLocaleString('pt-BR')}</div>
                      {selectedError.resolution_notes && (
                        <div><strong>Notas:</strong> {selectedError.resolution_notes}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}