import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, Database, Hash, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProtheusTablePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  tableName: string;
}

interface StructurePreview {
  fields: Array<{
    name: string;
    type: string;
    nullable: boolean;
  }>;
  sample_data: any[];
  created_at: string;
}

interface QualityReport {
  score: number;
  emptyFields: number;
  totalFields: number;
  details: string[];
  mapping_status: 'good' | 'warning' | 'error';
}

export const ProtheusTablePreviewModal = ({ 
  isOpen, 
  onClose, 
  tableId,
  tableName 
}: ProtheusTablePreviewModalProps) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<StructurePreview | null>(null);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [dynamicTable, setDynamicTable] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && tableId) {
      fetchTablePreview();
    }
  }, [isOpen, tableId]);

  const fetchTablePreview = async () => {
    try {
      setLoading(true);

      // Fetch dynamic table info
      const { data: dynamicTableData, error: dynamicError } = await supabase
        .from('protheus_dynamic_tables')
        .select('*')
        .eq('protheus_table_id', tableId)
        .single();

      if (dynamicError) throw dynamicError;

      setDynamicTable(dynamicTableData);
      
      // Parse table structure if it's a JSON string
      const tableStructure = typeof dynamicTableData.table_structure === 'string' 
        ? JSON.parse(dynamicTableData.table_structure) 
        : dynamicTableData.table_structure;
      
      setPreview(tableStructure);

      // Generate quality report
      if (tableStructure?.sample_data) {
        const report = generateQualityReport(
          tableStructure.sample_data,
          tableStructure.fields
        );
        setQualityReport(report);
      }
    } catch (error: any) {
      console.error('Error fetching preview:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao buscar preview da estrutura da tabela",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQualityReport = (sampleData: any[], fields: any[]): QualityReport => {
    if (!sampleData || sampleData.length === 0) {
      return {
        score: 0,
        emptyFields: fields.length,
        totalFields: fields.length,
        details: ['Nenhum dado de amostra disponível'],
        mapping_status: 'error'
      };
    }

    let totalValues = 0;
    let emptyValues = 0;
    let defaultValues = 0;

    // Analyze first few records
    for (let i = 0; i < Math.min(sampleData.length, 3); i++) {
      const record = sampleData[i];
      
      if (Array.isArray(record)) {
        record.forEach(value => {
          totalValues++;
          if (value === null || value === undefined || value === '') {
            emptyValues++;
          } else if (value === 'N' || value === '0' || value === ' ') {
            defaultValues++;
          }
        });
      }
    }

    const emptyPercentage = totalValues > 0 ? Math.round((emptyValues / totalValues) * 100) : 100;
    const defaultPercentage = totalValues > 0 ? Math.round((defaultValues / totalValues) * 100) : 0;
    const score = Math.max(0, 100 - emptyPercentage - defaultPercentage);

    const details: string[] = [];
    let mapping_status: 'good' | 'warning' | 'error' = 'good';

    if (emptyPercentage > 30) {
      details.push(`${emptyPercentage}% de campos vazios`);
      mapping_status = 'warning';
    }

    if (defaultPercentage > 50) {
      details.push(`${defaultPercentage}% de valores padrão (N, 0, espaço)`);
      mapping_status = 'error';
    }

    if (score < 50) {
      details.push('Qualidade baixa - possível problema de mapeamento');
      mapping_status = 'error';
    } else if (score < 80) {
      mapping_status = 'warning';
    }

    return {
      score,
      emptyFields: emptyValues,
      totalFields: totalValues,
      details,
      mapping_status
    };
  };

  const getQualityIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatSampleValue = (value: any): string => {
    if (value === null || value === undefined) return 'NULL';
    if (value === '') return 'VAZIO';
    if (typeof value === 'string' && value.length > 20) {
      return value.substring(0, 20) + '...';
    }
    return String(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview da Estrutura - {tableName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Carregando preview...</span>
          </div>
        ) : (
          <Tabs defaultValue="structure" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="structure">Estrutura</TabsTrigger>
              <TabsTrigger value="samples">Dados de Amostra</TabsTrigger>
              <TabsTrigger value="quality">Relatório de Qualidade</TabsTrigger>
            </TabsList>

            <TabsContent value="structure" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Estrutura da Tabela
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dynamicTable && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Badge variant="outline">Tabela Supabase</Badge>
                        <p className="font-mono text-sm mt-1">{dynamicTable.supabase_table_name}</p>
                      </div>
                      <div>
                        <Badge variant="outline">Total de Campos</Badge>
                        <p className="text-sm mt-1">{preview?.fields?.length || 0} campos</p>
                      </div>
                    </div>
                  )}

                  <Separator className="my-4" />

                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {preview?.fields?.map((field, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-xs">
                              {index + 1}
                            </Badge>
                            <code className="font-mono text-sm font-medium">{field.name}</code>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{field.type}</Badge>
                            {field.nullable && (
                              <Badge variant="outline" className="text-xs">
                                NULLABLE
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="samples" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Dados de Amostra do Protheus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    {preview?.sample_data?.map((record, recordIndex) => (
                      <div key={recordIndex} className="mb-6 p-4 border rounded-lg">
                        <h4 className="font-medium mb-3">Registro {recordIndex + 1}</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {Array.isArray(record) ? (
                            record.map((value, fieldIndex) => (
                              <div key={fieldIndex} className="flex items-center justify-between py-1 px-2 bg-muted/10 rounded">
                                <span className="text-sm text-muted-foreground">
                                  Campo {fieldIndex + 1}
                                </span>
                                <code className="text-sm font-mono">{formatSampleValue(value)}</code>
                              </div>
                            ))
                          ) : (
                            Object.entries(record || {}).map(([key, value], fieldIndex) => (
                              <div key={fieldIndex} className="flex items-center justify-between py-1 px-2 bg-muted/10 rounded">
                                <span className="text-sm text-muted-foreground">{key}</span>
                                <code className="text-sm font-mono">{formatSampleValue(value)}</code>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {qualityReport && getQualityIcon(qualityReport.mapping_status)}
                    Relatório de Qualidade dos Dados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {qualityReport && (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-muted/20 rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {qualityReport.score}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Score de Qualidade
                          </div>
                        </div>
                        <div className="text-center p-3 bg-muted/20 rounded-lg">
                          <div className="text-2xl font-bold">
                            {qualityReport.emptyFields}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Campos Vazios
                          </div>
                        </div>
                        <div className="text-center p-3 bg-muted/20 rounded-lg">
                          <div className="text-2xl font-bold">
                            {qualityReport.totalFields}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total de Valores
                          </div>
                        </div>
                      </div>

                      {qualityReport.details.length > 0 && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-1">
                              {qualityReport.details.map((detail, index) => (
                                <div key={index}>• {detail}</div>
                              ))}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Recomendações:</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {qualityReport.mapping_status === 'error' && (
                            <div>• Considere recriar a tabela com descoberta automática melhorada</div>
                          )}
                          {qualityReport.score < 80 && (
                            <div>• Verifique se o mapeamento dos campos está correto</div>
                          )}
                          {qualityReport.emptyFields > qualityReport.totalFields * 0.3 && (
                            <div>• Muitos campos vazios podem indicar problema na consulta SQL</div>
                          )}
                          <div>• Use a sincronização manual para testar a importação</div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};