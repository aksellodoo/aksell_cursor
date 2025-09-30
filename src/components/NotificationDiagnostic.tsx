import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle, PlayCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DiagnosticResult {
  success: boolean;
  summary: {
    total_users_configured: number;
    users_with_issues: number;
    users_working_correctly: number;
    timestamp: string;
  };
  detailed_diagnosis: Array<{
    user_id: string;
    user_name: string;
    table_name: string;
    configured_statuses: string[];
    configured_channels: Record<string, boolean>;
    issues: string[];
    recommendations: string[];
    available_records: number;
    matching_records: number;
    recent_notifications: number;
    status_breakdown: Record<string, number>;
    config_created_at: string;
  }>;
}

export const NotificationDiagnostic: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('diagnose-notifications', {
        body: {}
      });

      if (error) {
        throw error;
      }

      setDiagnostic(data);
      toast.success('Diagnóstico executado com sucesso!');
    } catch (error) {
      console.error('Erro ao executar diagnóstico:', error);
      toast.error('Erro ao executar diagnóstico');
    } finally {
      setLoading(false);
    }
  };

  const getIssueIcon = (issue: string) => {
    if (issue.includes('❌')) return <XCircle className="w-4 h-4 text-red-500" />;
    if (issue.includes('⚠️')) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    if (issue.includes('✅')) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <AlertTriangle className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Diagnóstico de Notificações Protheus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Execute um diagnóstico completo para identificar problemas nas configurações de notificações.
            </p>
            
            <Button 
              onClick={runDiagnostic} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              {loading ? 'Executando...' : 'Executar Diagnóstico'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {diagnostic && (
        <div className="space-y-4">
          {/* Resumo Geral */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {diagnostic.summary.total_users_configured}
                  </div>
                  <div className="text-sm text-blue-700">Usuários Configurados</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {diagnostic.summary.users_with_issues}
                  </div>
                  <div className="text-sm text-red-700">Com Problemas</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {diagnostic.summary.users_working_correctly}
                  </div>
                  <div className="text-sm text-green-700">Funcionando</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diagnóstico Detalhado */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Diagnóstico por Usuário</h3>
            
            {diagnostic.detailed_diagnosis.map((user, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{user.user_name}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline">{user.table_name}</Badge>
                      <Badge variant="secondary">
                        {user.matching_records}/{user.available_records} registros
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status Configurados */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Status Configurados:</h4>
                    <div className="flex gap-2 flex-wrap">
                      {user.configured_statuses.map(status => (
                        <Badge key={status} variant="outline">{status}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Breakdown de Status */}
                  {Object.keys(user.status_breakdown).length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Status Disponíveis na Tabela:</h4>
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(user.status_breakdown).map(([status, count]) => (
                          <Badge key={status} variant={
                            user.configured_statuses.includes(status) ? "default" : "secondary"
                          }>
                            {status}: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Canais Configurados */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Canais Configurados:</h4>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(user.configured_channels).map(([channel, enabled]) => (
                        <Badge key={channel} variant={enabled ? "default" : "secondary"}>
                          {channel}: {enabled ? 'Ativo' : 'Inativo'}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Problemas Identificados */}
                  {user.issues.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Problemas Identificados:</h4>
                      <div className="space-y-2">
                        {user.issues.map((issue, issueIndex) => (
                          <Alert key={issueIndex} className="py-2">
                            <div className="flex items-start gap-2">
                              {getIssueIcon(issue)}
                              <AlertDescription className="text-sm">
                                {issue.replace(/❌|⚠️|✅/g, '').trim()}
                              </AlertDescription>
                            </div>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recomendações */}
                  {user.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Recomendações:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {user.recommendations.map((rec, recIndex) => (
                          <li key={recIndex}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Estatísticas */}
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    <div>Configuração criada: {new Date(user.config_created_at).toLocaleString('pt-BR')}</div>
                    <div>Notificações recentes (7 dias): {user.recent_notifications}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};