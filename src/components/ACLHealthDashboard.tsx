import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle, RefreshCw, Activity, FileText, Database } from 'lucide-react';
import { useACLHealth } from '@/hooks/useACLHealth';
import { toast } from 'sonner';

export const ACLHealthDashboard = () => {
  const { loading, report, error, hasACLIssues, isHealthy, checkACLHealth, reprocessDocument } = useACLHealth();
  const [reprocessingDocs, setReprocessingDocs] = useState<Set<string>>(new Set());

  const handleCheckHealth = async () => {
    try {
      await checkACLHealth();
      toast.success('Verificação de saúde ACL concluída');
    } catch (err) {
      toast.error('Falha na verificação de saúde ACL');
    }
  };

  const handleReprocessDocument = async (documentId: string, documentName: string) => {
    setReprocessingDocs(prev => new Set(prev).add(documentId));
    
    try {
      await reprocessDocument(documentId);
      toast.success(`Reprocessamento iniciado para: ${documentName}`);
      
      // Refresh health check after a moment
      setTimeout(() => {
        checkACLHealth();
      }, 2000);
    } catch (err) {
      toast.error(`Falha ao reprocessar: ${documentName}`);
    } finally {
      setReprocessingDocs(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="h-5 w-5 animate-spin" />;
    if (hasACLIssues) return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    if (isHealthy) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <Activity className="h-5 w-5 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (loading) return 'Verificando...';
    if (hasACLIssues) return 'Problemas Detectados';
    if (isHealthy) return 'Sistema Saudável';
    return 'Não Verificado';
  };

  const getStatusColor = () => {
    if (hasACLIssues) return 'bg-amber-500';
    if (isHealthy) return 'bg-green-500';
    return 'bg-muted';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div>
                <CardTitle>Saúde do Sistema ACL</CardTitle>
                <CardDescription>
                  Monitore e resolva problemas de controle de acesso a documentos
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`${getStatusColor()} text-white`}>
                {getStatusText()}
              </Badge>
              <Button 
                onClick={handleCheckHealth} 
                disabled={loading}
                size="sm"
                variant="outline"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Activity className="h-4 w-4 mr-2" />
                )}
                Verificar Agora
              </Button>
            </div>
          </div>
        </CardHeader>

        {report && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {report.total_departments}
                </div>
                <div className="text-sm text-muted-foreground">Departamentos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {report.summary.documents_with_acl_issues}
                </div>
                <div className="text-sm text-muted-foreground">Docs com Problemas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {report.summary.chunks_with_acl_issues}
                </div>
                <div className="text-sm text-muted-foreground">Chunks Afetados</div>
              </div>
            </div>

            {report.summary.recommendations.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Recomendações:</h4>
                  <ul className="space-y-1">
                    {report.summary.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full mt-2 mr-2 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {report.acl_issues.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">Problemas Detectados:</h4>
                  <div className="space-y-3">
                    {report.acl_issues.map((issue, index) => (
                      <Card key={index} className="border-amber-200 bg-amber-50">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Database className="h-4 w-4 text-amber-600" />
                                <span className="font-medium">{issue.department_name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {issue.affected_documents} docs
                                </Badge>
                              </div>
                              
                              {issue.mismatched_chunks && (
                                <div className="text-sm text-muted-foreground">
                                  {issue.mismatched_chunks} chunks com ACL desatualizado
                                </div>
                              )}

                              {issue.document_names && issue.document_names.length > 0 && (
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-muted-foreground">
                                    Documentos afetados:
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {issue.document_names.slice(0, 3).map((name, docIndex) => (
                                      <Badge key={docIndex} variant="secondary" className="text-xs">
                                        <FileText className="h-3 w-3 mr-1" />
                                        {name}
                                      </Badge>
                                    ))}
                                    {issue.document_names.length > 3 && (
                                      <Badge variant="secondary" className="text-xs">
                                        +{issue.document_names.length - 3} mais
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}

                              {issue.error && (
                                <div className="text-sm text-red-600">
                                  Erro: {issue.error}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}

            {report && (
              <div className="text-xs text-muted-foreground pt-2 border-t">
                Última verificação: {new Date(report.timestamp).toLocaleString('pt-BR')}
              </div>
            )}
          </CardContent>
        )}

        {error && (
          <CardContent>
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};