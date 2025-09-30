import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { RefreshCw, Search, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './ui/use-toast';

interface MissingRecordsAnalyzerProps {
  tableId: string;
}

interface AnalysisResult {
  protheusCount: number;
  supabaseCount: number;
  uniqueProtheusCount: number;
  missing: number;
  nullKeyRecords: number;
  pendingDeletionCount: number;
  duplicatesInProtheus: Array<{
    key: string;
    count: number;
    records: any[];
  }>;
  missingRecords: Array<{
    key: string;
    preview: Record<string, any>;
  }>;
  nullKeyRecordsDetails: Array<{
    missingFields: string[];
    preview: Record<string, any>;
  }>;
  pendingDeletionRecords: Array<{
    key: string;
    preview: Record<string, any>;
    pending_deletion_at: string;
  }>;
  lastSyncStats?: {
    processed: number;
    created: number;
    errors: number;
  };
}

export const MissingRecordsAnalyzer: React.FC<MissingRecordsAnalyzerProps> = ({ tableId }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const analyzeRecords = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get table configuration
      const { data: tableConfig } = await supabase
        .from('protheus_tables')
        .select('*')
        .eq('id', tableId)
        .single();

      if (!tableConfig) {
        throw new Error('Table configuration not found');
      }

      // Get dynamic table info
      const { data: dynamicTable } = await supabase
        .from('protheus_dynamic_tables')
        .select('*')
        .eq('protheus_table_id', tableId)
        .single();

      if (!dynamicTable) {
        throw new Error('Dynamic table not found');
      }

      // Get Protheus configuration
      const { data: protheusConfig } = await supabase
        .from('protheus_config')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('is_active', true)
        .single();

      if (!protheusConfig) {
        throw new Error('Protheus configuration not found');
      }

      // Get latest sync stats
      const { data: latestSync } = await supabase
        .from('protheus_sync_logs')
        .select('*')
        .eq('protheus_table_id', tableId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Call analysis function
      const { data: result, error: functionError } = await supabase.functions.invoke('analyze-missing-records', {
        body: {
          tableId,
          tableConfig,
          dynamicTable,
          protheusConfig
        }
      });

      if (functionError) {
        throw functionError;
      }

      setAnalysis({
        ...result,
        lastSyncStats: latestSync ? {
          processed: latestSync.records_processed || 0,
          created: latestSync.records_created || 0,
          errors: (latestSync.sync_details as any)?.errors || 0
        } : undefined
      });

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze records');
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar os registros faltantes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resyncMissingRecords = async () => {
    if (!analysis?.missingRecords.length) return;

    try {
      setLoading(true);
      
      const { error } = await supabase.functions.invoke('sync-protheus-table', {
        body: {
          tableId,
          forceFullSync: true,
          skipBinary: true, // Skip binary fields for missing records re-sync
          targetRecords: analysis.missingRecords.map(record => record.key)
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Re-sincronização iniciada",
        description: "Os registros faltantes estão sendo processados novamente."
      });

      // Refresh analysis after a moment
      setTimeout(() => {
        analyzeRecords();
      }, 2000);

    } catch (err) {
      console.error('Resync error:', err);
      toast({
        title: "Erro na re-sincronização",
        description: "Não foi possível re-sincronizar os registros.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processPendingDeletions = async () => {
    if (!analysis?.pendingDeletionRecords.length) return;

    try {
      setLoading(true);
      
      const { error } = await supabase.functions.invoke('process-pending-deletions', {
        body: {
          tableId,
          recordKeys: analysis.pendingDeletionRecords.map(record => record.key)
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Processamento iniciado",
        description: "Os registros marcados para exclusão estão sendo processados."
      });

      // Refresh analysis after a moment
      setTimeout(() => {
        analyzeRecords();
      }, 2000);

    } catch (err) {
      console.error('Process deletion error:', err);
      toast({
        title: "Erro no processamento",
        description: "Não foi possível processar as exclusões pendentes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Análise de Registros Faltantes</h3>
          <p className="text-sm text-muted-foreground">
            Compare registros entre Protheus e Supabase para identificar discrepâncias
          </p>
        </div>
        <Button onClick={analyzeRecords} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Analisar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysis && (
        <div className="grid gap-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Protheus Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysis.protheusCount}</div>
                <p className="text-xs text-muted-foreground">registros</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Protheus Válidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysis.uniqueProtheusCount}</div>
                <p className="text-xs text-muted-foreground">únicos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Supabase</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysis.supabaseCount}</div>
                <p className="text-xs text-muted-foreground">registros</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Faltantes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${analysis.missing > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {analysis.missing}
                </div>
                <p className="text-xs text-muted-foreground">registros</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Chaves Inválidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${analysis.nullKeyRecords > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {analysis.nullKeyRecords}
                </div>
                <p className="text-xs text-muted-foreground">registros</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pendente Exclusão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${analysis.pendingDeletionCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {analysis.pendingDeletionCount}
                </div>
                <p className="text-xs text-muted-foreground">registros</p>
              </CardContent>
            </Card>
          </div>

          {/* Last Sync Stats */}
          {analysis.lastSyncStats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Última Sincronização</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Processados:</span> {analysis.lastSyncStats.processed}
                  </div>
                  <div>
                    <span className="font-medium">Criados:</span> {analysis.lastSyncStats.created}
                  </div>
                  <div>
                    <span className="font-medium">Erros:</span> {analysis.lastSyncStats.errors}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* NULL Key Records Warning */}
          {analysis.nullKeyRecords > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                ⚠️ Encontrados {analysis.nullKeyRecords} registros com chaves primárias incompletas (campos NULL/vazios). Estes registros não podem ser sincronizados.
              </AlertDescription>
            </Alert>
          )}

          {/* Pending Deletion Warning */}
          {analysis.pendingDeletionCount > 0 && (
            <Alert variant="destructive">
              <Trash2 className="h-4 w-4" />
              <AlertDescription>
                🗑️ Encontrados {analysis.pendingDeletionCount} registros marcados para exclusão. Estes registros podem estar aguardando processamento.
              </AlertDescription>
            </Alert>
          )}

          {/* Status */}
          {analysis.missing === 0 && analysis.duplicatesInProtheus.length === 0 && analysis.nullKeyRecords === 0 && analysis.pendingDeletionCount === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ✅ Todos os registros estão sincronizados corretamente. Não há registros faltantes, duplicatas, chaves inválidas ou exclusões pendentes.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                ⚠️ Encontradas discrepâncias nos dados. Verifique os detalhes abaixo.
              </AlertDescription>
            </Alert>
          )}

          {/* Duplicates in Protheus */}
          {analysis.duplicatesInProtheus.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Duplicatas no Protheus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40">
                  <div className="space-y-2">
                    {analysis.duplicatesInProtheus.map((duplicate, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-mono text-sm">{duplicate.key}</span>
                        <Badge variant="destructive">{duplicate.count} registros</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* NULL Key Records Details */}
          {analysis.nullKeyRecordsDetails && analysis.nullKeyRecordsDetails.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Registros com Chaves Inválidas ({analysis.nullKeyRecordsDetails.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40">
                  <div className="space-y-2">
                    {analysis.nullKeyRecordsDetails.map((record, index) => (
                      <div key={index} className="p-3 border rounded bg-yellow-50/50">
                        <div className="text-sm font-medium text-yellow-800">
                          Campos ausentes: {record.missingFields.join(', ')}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {Object.entries(record.preview).map(([key, value]) => (
                            <span key={key} className="mr-4">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Pending Deletion Records */}
          {analysis.pendingDeletionRecords && analysis.pendingDeletionRecords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-orange-600" />
                    Registros Pendentes de Exclusão ({analysis.pendingDeletionRecords.length})
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={processPendingDeletions}
                    disabled={loading}
                    className="gap-2"
                  >
                    <Trash2 className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    Processar Exclusões
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-60">
                  <div className="space-y-2">
                    {analysis.pendingDeletionRecords.slice(0, 50).map((record, index) => (
                      <div key={index} className="p-3 border rounded bg-orange-50/50">
                        <div className="font-mono text-sm font-medium">{record.key}</div>
                        <div className="text-xs text-orange-700 mt-1">
                          Marcado para exclusão em: {new Date(record.pending_deletion_at).toLocaleString('pt-BR')}
                        </div>
                        {record.preview && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {Object.entries(record.preview).slice(0, 3).map(([key, value]) => (
                              <span key={key} className="mr-4">
                                {key}: {String(value)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {analysis.pendingDeletionRecords.length > 50 && (
                      <div className="text-center py-2 text-sm text-muted-foreground">
                        ... e mais {analysis.pendingDeletionRecords.length - 50} registros
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Missing Records */}
          {analysis.missingRecords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-destructive" />
                    Registros Faltantes ({analysis.missingRecords.length})
                  </span>
                  <Button 
                    size="sm" 
                    onClick={resyncMissingRecords}
                    disabled={loading}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    Re-sincronizar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-60">
                  <div className="space-y-2">
                    {analysis.missingRecords.slice(0, 50).map((record, index) => (
                      <div key={index} className="p-3 border rounded bg-muted/50">
                        <div className="font-mono text-sm font-medium">{record.key}</div>
                        {record.preview && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {Object.entries(record.preview).slice(0, 3).map(([key, value]) => (
                              <span key={key} className="mr-4">
                                {key}: {String(value)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {analysis.missingRecords.length > 50 && (
                      <div className="text-center py-2 text-sm text-muted-foreground">
                        ... e mais {analysis.missingRecords.length - 50} registros
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
