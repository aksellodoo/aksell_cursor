import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, CheckCircle, XCircle, Clock, Activity, Table, Trash2, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProtheusConfig } from '@/hooks/useProtheusConfig';
import { SQLResultsViewer } from './SQLResultsViewer';

type ProtheusConfig = ReturnType<typeof useProtheusConfig>['config'];

interface TestResult {
  endpoint: string;
  status: 'success' | 'error' | 'timeout';
  responseTime: number;
  data?: any;
  error?: string;
  timestamp: string;
  meta?: {
    projectionApplied?: boolean;
    excludedBinaryFields?: string[];
    note?: string;
  };
}

interface ProtheusConnectionTestsProps {
  config: ProtheusConfig | null;
}

export const ProtheusConnectionTests: React.FC<ProtheusConnectionTestsProps> = ({ config }) => {
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [isTestingConsulta, setIsTestingConsulta] = useState(false);
  const [isTestingSQL, setIsTestingSQL] = useState(false);
  const DEFAULT_SQL = 'SELECT * FROM U_CGIFBA_PR.SA1010';
  const [customSQL, setCustomSQL] = useState(() => {
    const saved = localStorage.getItem('protheus-custom-sql');
    return saved || DEFAULT_SQL;
  });
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showSQLResults, setShowSQLResults] = useState(false);
  const [lastSQLResult, setLastSQLResult] = useState<TestResult | null>(null);
  const [isRestoringFromServer, setIsRestoringFromServer] = useState(false);
  const { toast } = useToast();
  
  const STORAGE_KEY = 'protheus-connection-tests';

  // Save customSQL to localStorage immediately when it changes
  useEffect(() => {
    localStorage.setItem('protheus-custom-sql', customSQL);
  }, [customSQL]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.customSQL) setCustomSQL(parsed.customSQL);
        if (parsed.testResults) setTestResults(parsed.testResults);
        if (parsed.lastSQLResult) setLastSQLResult(parsed.lastSQLResult);
      } catch (error) {
        console.error('Error loading saved test data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    const dataToSave = {
      customSQL,
      testResults: testResults.slice(0, 5), // Limit to 5 results
      lastSQLResult: lastSQLResult ? {
        ...lastSQLResult,
        data: Array.isArray(lastSQLResult.data) && lastSQLResult.data.length > 100 
          ? lastSQLResult.data.slice(0, 100) // Truncate large datasets for storage
          : lastSQLResult.data
      } : null
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [customSQL, testResults, lastSQLResult]);

  const getEnabledEndpoints = () => {
    try {
      if (!config?.endpoints_documentation) return [];
      
      const endpoints = typeof config.endpoints_documentation === 'string' 
        ? JSON.parse(config.endpoints_documentation) 
        : config.endpoints_documentation;
      
      if (!endpoints.endpoints || !Array.isArray(endpoints.endpoints)) return [];
      return endpoints.endpoints.filter((endpoint: any) => endpoint.enabled);
    } catch (error) {
      console.error('Erro ao parsear endpoints_documentation:', error);
      return [];
    }
  };

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [result, ...prev.slice(0, 4)]); // Manter apenas os últimos 5
  };

  const testEndpoint = async (endpoint: string, requestData: any = {}) => {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('test-protheus-connection', {
        body: {
          endpoint,
          config: config,
          requestData
        }
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        const result: TestResult = {
          endpoint,
          status: 'error',
          responseTime,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        addTestResult(result);
        return result;
      }

      const result: TestResult = {
        endpoint,
        status: 'success',
        responseTime,
        data,
        timestamp: new Date().toISOString()
      };
      addTestResult(result);
      return result;

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const result: TestResult = {
        endpoint,
        status: responseTime > 30000 ? 'timeout' : 'error',
        responseTime,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      addTestResult(result);
      return result;
    }
  };

  const handlePingTest = async () => {
    if (!config?.is_active) {
      toast({
        title: "Configuração inativa",
        description: "Ative a configuração antes de testar.",
        variant: "destructive"
      });
      return;
    }

    const enabledEndpoints = getEnabledEndpoints();
    const pingEndpoint = enabledEndpoints.find(e => e.path === '/ping');
    
    if (!pingEndpoint) {
      toast({
        title: "Endpoint desabilitado",
        description: "O endpoint /ping está desabilitado.",
        variant: "destructive"
      });
      return;
    }

    setIsTestingPing(true);
    try {
      const result = await testEndpoint('/ping');
      toast({
        title: result.status === 'success' ? "Sucesso" : "Erro",
        description: result.status === 'success' 
          ? `Ping executado em ${result.responseTime}ms` 
          : result.error,
        variant: result.status === 'success' ? "default" : "destructive"
      });
    } finally {
      setIsTestingPing(false);
    }
  };

  const handleConsultaTest = async () => {
    if (!config?.is_active) {
      toast({
        title: "Configuração inativa",
        description: "Ative a configuração antes de testar.",
        variant: "destructive"
      });
      return;
    }

    const enabledEndpoints = getEnabledEndpoints();
    const consultaEndpoint = enabledEndpoints.find(e => e.path === '/consulta');
    
    if (!consultaEndpoint) {
      toast({
        title: "Endpoint desabilitado",
        description: "O endpoint /consulta está desabilitado.",
        variant: "destructive"
      });
      return;
    }

    setIsTestingConsulta(true);
    try {
      const result = await testEndpoint('/consulta');
      toast({
        title: result.status === 'success' ? "Sucesso" : "Erro",
        description: result.status === 'success' 
          ? `Consulta executada em ${result.responseTime}ms` 
          : result.error,
        variant: result.status === 'success' ? "default" : "destructive"
      });
    } finally {
      setIsTestingConsulta(false);
    }
  };

  const handleSQLTest = async () => {
    console.log('handleSQLTest iniciado - função chamada');
    if (!config?.is_active) {
      toast({
        title: "Configuração inativa",
        description: "Ative a configuração antes de testar.",
        variant: "destructive"
      });
      return;
    }

    const enabledEndpoints = getEnabledEndpoints();
    const sqlEndpoint = enabledEndpoints.find(e => e.path === '/sql');
    
    if (!sqlEndpoint) {
      toast({
        title: "Endpoint desabilitado",
        description: "O endpoint /sql está desabilitado.",
        variant: "destructive"
      });
      return;
    }

    if (!customSQL.trim()) {
      toast({
        title: "Query SQL obrigatória",
        description: "Digite uma query SQL para testar.",
        variant: "destructive"
      });
      return;
    }

    setIsTestingSQL(true);
    try {
      const result = await testEndpoint('/sql', { query: customSQL });
      
      // Armazenar resultado para visualização em tabela
      if (result.status === 'success') {
        console.log('ProtheusConnectionTests - Extracting real data from result.data.data');
        console.log('ProtheusConnectionTests - Original result.data.data:', result.data?.data);
        console.log('ProtheusConnectionTests - Is array?', Array.isArray(result.data?.data));
        
        // Extrair os dados reais (array) do wrapper da edge function
        const realData = result.data?.data;
        const resultWithRealData = {
          ...result,
          data: realData,  // Passar apenas os dados reais (array) para SQLResultsViewer
          meta: result.data?.meta  // Include meta information
        };
        
        console.log('ProtheusConnectionTests - Final data being passed to SQLResultsViewer:', realData);
        console.log('ProtheusConnectionTests - Final data type:', typeof realData);
        console.log('ProtheusConnectionTests - Final data is array?', Array.isArray(realData));
        
        setLastSQLResult(resultWithRealData);
        setShowSQLResults(true);
        
        // Show warning if binary fields were excluded
        if (result.data?.meta?.projectionApplied) {
          toast({
            title: "Sucesso",
            description: "Query executada com sucesso. Campos binários foram excluídos automaticamente desta consulta. Para obter o conteúdo binário utilize a sincronização (download via /download/:id).",
            variant: "default"
          });
        } else {
          toast({
            title: "Sucesso",
            description: `Query executada em ${result.responseTime}ms`,
            variant: "default"
          });
        }
      } else {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive"
        });
      }
    } finally {
      setIsTestingSQL(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'timeout':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'timeout':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const clearLocalResults = () => {
    setTestResults([]);
    setLastSQLResult(null);
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: "Resultados limpos",
      description: "Todos os resultados locais foram removidos.",
    });
  };

  const restoreFromServer = async () => {
    // Cast config to access database fields, or check if it has the required structure
    const configWithId = config as any;
    if (!configWithId?.id) {
      toast({
        title: "Erro",
        description: "Configuração não encontrada para restaurar histórico.",
        variant: "destructive"
      });
      return;
    }

    setIsRestoringFromServer(true);
    try {
      const { data: logs, error } = await supabase
        .from('protheus_usage_logs')
        .select('*')
        .eq('config_id', configWithId.id)
        .order('executed_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (logs && logs.length > 0) {
        const restoredResults: TestResult[] = logs.map(log => ({
          endpoint: log.endpoint_used,
          status: log.response_status === '200' ? 'success' : 'error',
          responseTime: log.response_time_ms || 0,
          data: log.response_data,
          error: log.response_status !== '200' ? log.error_message : undefined,
          timestamp: log.executed_at
        }));

        setTestResults(restoredResults);
        
        // If there's a recent SQL result, set it as lastSQLResult
        const lastSQL = restoredResults.find(r => r.endpoint === '/sql' && r.status === 'success');
        if (lastSQL) {
          setLastSQLResult(lastSQL);
        }

        toast({
          title: "Histórico restaurado",
          description: `${logs.length} resultado(s) restaurados do servidor.`,
        });
      } else {
        toast({
          title: "Nenhum histórico encontrado",
          description: "Não foram encontrados resultados no servidor.",
        });
      }
    } catch (error: any) {
      console.error('Error restoring from server:', error);
      toast({
        title: "Erro ao restaurar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRestoringFromServer(false);
    }
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-muted-foreground">Configure o Protheus primeiro na aba "Configurações"</p>
      </div>
    );
  }

  const enabledEndpoints = getEnabledEndpoints();

  return (
    <div className="space-y-6">
      {/* Cards de Teste */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Teste Ping */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Teste Ping
              <Badge variant={enabledEndpoints.find(e => e.path === '/ping') ? 'default' : 'destructive'}>
                {enabledEndpoints.find(e => e.path === '/ping') ? 'Habilitado' : 'Desabilitado'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Verifica a conectividade básica com o servidor Oracle Proxy
            </p>
            <Button 
              onClick={handlePingTest} 
              disabled={isTestingPing || !enabledEndpoints.find(e => e.path === '/ping')}
              className="w-full"
            >
              {isTestingPing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Testar Ping
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Teste Consulta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Teste Consulta
              <Badge variant={enabledEndpoints.find(e => e.path === '/consulta') ? 'default' : 'destructive'}>
                {enabledEndpoints.find(e => e.path === '/consulta') ? 'Habilitado' : 'Desabilitado'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Executa consulta exemplo (primeiros 10 clientes)
            </p>
            <Button 
              onClick={handleConsultaTest} 
              disabled={isTestingConsulta || !enabledEndpoints.find(e => e.path === '/consulta')}
              className="w-full"
            >
              {isTestingConsulta ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Testar Consulta
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Teste SQL Customizada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Teste SQL
              <Badge variant={enabledEndpoints.find(e => e.path === '/sql') ? 'default' : 'destructive'}>
                {enabledEndpoints.find(e => e.path === '/sql') ? 'Habilitado' : 'Desabilitado'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={DEFAULT_SQL}
              value={customSQL}
              onChange={(e) => setCustomSQL(e.target.value)}
              disabled={!enabledEndpoints.find(e => e.path === '/sql')}
              className="min-h-[100px]"
            />
            <div className="space-y-2">
              <Button 
                onClick={handleSQLTest} 
                disabled={isTestingSQL || !enabledEndpoints.find(e => e.path === '/sql')}
                className="w-full"
              >
                {isTestingSQL ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executando...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Executar SQL
                  </>
                )}
              </Button>
              
              {lastSQLResult?.status === 'success' && (
                <Button 
                  variant="outline"
                  onClick={() => setShowSQLResults(true)}
                  className="w-full"
                >
                  <Table className="mr-2 h-4 w-4" />
                  Ver Resultados em Tabela
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações de Gerenciamento */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearLocalResults}
              disabled={testResults.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar Resultados Locais
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={restoreFromServer}
              disabled={isRestoringFromServer}
            >
              {isRestoringFromServer ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restaurando...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Recuperar do Histórico
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados Recentes */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <p className="font-medium">{result.endpoint}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusColor(result.status) as any}>
                      {result.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {result.responseTime}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Resultados SQL */}
      {lastSQLResult && (
        <SQLResultsViewer
          isOpen={showSQLResults}
          onClose={() => setShowSQLResults(false)}
          sqlQuery={customSQL}
          sqlData={lastSQLResult.data}
          responseTime={lastSQLResult.responseTime}
          timestamp={lastSQLResult.timestamp}
        />
      )}
    </div>
  );
};