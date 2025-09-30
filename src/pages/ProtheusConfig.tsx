import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useProtheusConfig, type EndpointConfig, type EndpointsDocumentation } from '@/hooks/useProtheusConfig';
import { Badge } from '@/components/ui/badge';
import { ProtheusConnectionTests } from '@/components/ProtheusConnectionTests';
import { ProtheusUsageHistory } from '@/components/ProtheusUsageHistory';

type ConnectionType = 'aksell' | 'totvs';

interface ApiConfig {
  url: string;
  apiKey: string;
  schema?: string;
}

export default function ProtheusConfig() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isActive, setIsActive] = useState(false);
  const [connectionType, setConnectionType] = useState<ConnectionType>('aksell');
  const [aksellConfig, setAksellConfig] = useState<ApiConfig>({ url: '', apiKey: '', schema: '' });
  const [totvsConfig, setTotvsConfig] = useState<ApiConfig>({ url: '', apiKey: '' });
  const [oracleProxyCode, setOracleProxyCode] = useState('');
  const [oracleSchema, setOracleSchema] = useState('');
  const [endpointsConfig, setEndpointsConfig] = useState<EndpointsDocumentation | null>(null);
  
  // Initialize activeTab from URL params, localStorage, or default
  const getInitialTab = (): string => {
    const urlTab = searchParams.get('tab');
    if (urlTab && ['configuracoes', 'testes', 'historico'].includes(urlTab)) {
      return urlTab;
    }
    
    const savedTab = localStorage.getItem('protheus-config-active-tab');
    if (savedTab && ['configuracoes', 'testes', 'historico'].includes(savedTab)) {
      return savedTab;
    }
    
    // Check if there are test results in localStorage - if so, default to testes tab
    const testResults = localStorage.getItem('protheus-test-results');
    if (testResults) {
      try {
        const results = JSON.parse(testResults);
        if (Array.isArray(results) && results.length > 0) {
          return 'testes';
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    return 'configuracoes';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const { toast } = useToast();
  const { config, isLoading, saveConfig, isSaving } = useProtheusConfig();

  // Sync activeTab with URL and localStorage
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL params
    const newSearchParams = new URLSearchParams(searchParams);
    if (value === 'configuracoes') {
      newSearchParams.delete('tab');
    } else {
      newSearchParams.set('tab', value);
    }
    setSearchParams(newSearchParams, { replace: true });
    
    // Update localStorage
    localStorage.setItem('protheus-config-active-tab', value);
  };

  // Strong synchronization on mount and visibility change
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && ['configuracoes', 'testes', 'historico'].includes(urlTab)) {
      setActiveTab(urlTab);
      localStorage.setItem('protheus-config-active-tab', urlTab);
    }
  }, [searchParams]);

  // Handle browser tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible - restore the active tab from localStorage or URL
        const urlTab = searchParams.get('tab');
        const savedTab = localStorage.getItem('protheus-config-active-tab');
        
        if (urlTab && ['configuracoes', 'testes', 'historico'].includes(urlTab)) {
          setActiveTab(urlTab);
        } else if (savedTab && ['configuracoes', 'testes', 'historico'].includes(savedTab)) {
          setActiveTab(savedTab);
          
          // Update URL to match localStorage
          const newSearchParams = new URLSearchParams(searchParams);
          if (savedTab === 'configuracoes') {
            newSearchParams.delete('tab');
          } else {
            newSearchParams.set('tab', savedTab);
          }
          setSearchParams(newSearchParams, { replace: true });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [searchParams, setSearchParams]);

  // Load existing config when available
  useEffect(() => {
    if (config) {
      setIsActive(config.is_active);
      setConnectionType(config.connection_type as ConnectionType);
      setAksellConfig(config.aksell_config as ApiConfig);
      setTotvsConfig(config.totvs_config as ApiConfig);
      setOracleProxyCode(config.oracle_proxy_code || '');
      setOracleSchema(config.oracle_schema || '');
      setEndpointsConfig(config.endpoints_documentation as EndpointsDocumentation || null);
    }
  }, [config]);

  const handleSave = () => {
    if (isActive) {
      const currentConfig = connectionType === 'aksell' ? aksellConfig : totvsConfig;
      if (!currentConfig.url || !currentConfig.apiKey) {
        toast({
          title: "Erro",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive"
        });
        return;
      }
      
      // Validação específica para API Aksell
      if (connectionType === 'aksell' && !oracleSchema) {
        toast({
          title: "Erro",
          description: "Por favor, preencha o campo Schema/Usuário Oracle para a API Aksell.",
          variant: "destructive"
        });
        return;
      }
    }
    
    saveConfig({
      is_active: isActive,
      connection_type: connectionType,
      aksell_config: { ...aksellConfig, schema: oracleSchema },
      totvs_config: totvsConfig,
      oracle_proxy_code: oracleProxyCode,
      oracle_schema: oracleSchema,
      endpoints_documentation: endpointsConfig || undefined,
    });
  };

  const handleTest = () => {
    handleTabChange('testes');
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações do Protheus</h1>
          <p className="text-muted-foreground">
            Configure a conexão com as APIs REST do Protheus
          </p>
        </div>

        <Tabs className="w-full" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
            <TabsTrigger value="testes">Testes de Conexão</TabsTrigger>
            <TabsTrigger value="historico">Histórico de Uso</TabsTrigger>
          </TabsList>

          <TabsContent value="configuracoes" className="space-y-4">
            {/* Status da Configuração */}
            <Card>
              <CardHeader>
                <CardTitle>Status da Configuração</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="config-active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="config-active">
                    {isActive ? 'Configuração Ativa' : 'Configuração Inativa'}
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Tipo de Conexão */}
            <Card>
              <CardHeader>
                <CardTitle>Tipo de Conexão</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={connectionType}
                  onValueChange={(value) => setConnectionType(value as ConnectionType)}
                  disabled={!isActive}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="aksell" id="aksell" />
                    <Label htmlFor="aksell">Tipo 1 - REST API Aksell</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="totvs" id="totvs" />
                    <Label htmlFor="totvs">Tipo 2 - REST API Totvs</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Configurações da API */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Configurações da {connectionType === 'aksell' ? 'API Aksell' : 'API Totvs'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-url">URL da API</Label>
                  <Input
                    id="api-url"
                    type="url"
                    placeholder={`Digite a URL da ${connectionType === 'aksell' ? 'API Aksell' : 'API Totvs'}`}
                    value={connectionType === 'aksell' ? aksellConfig.url : totvsConfig.url}
                    onChange={(e) => {
                      if (connectionType === 'aksell') {
                        setAksellConfig(prev => ({ ...prev, url: e.target.value }));
                      } else {
                        setTotvsConfig(prev => ({ ...prev, url: e.target.value }));
                      }
                    }}
                    disabled={!isActive}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key / Senha</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Digite a API Key ou senha"
                    value={connectionType === 'aksell' ? aksellConfig.apiKey : totvsConfig.apiKey}
                    onChange={(e) => {
                      if (connectionType === 'aksell') {
                        setAksellConfig(prev => ({ ...prev, apiKey: e.target.value }));
                      } else {
                        setTotvsConfig(prev => ({ ...prev, apiKey: e.target.value }));
                      }
                    }}
                    disabled={!isActive}
                  />
                </div>

                {/* Campo Schema - apenas para API Aksell */}
                {connectionType === 'aksell' && (
                  <div className="space-y-2">
                    <Label htmlFor="oracle-schema">Schema/Usuário Oracle</Label>
                    <Input
                      id="oracle-schema"
                      type="text"
                      placeholder="Digite o nome do schema (usuário Oracle)"
                      value={oracleSchema}
                      onChange={(e) => setOracleSchema(e.target.value)}
                      disabled={!isActive}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Endpoints Disponíveis */}
            <Card>
              <CardHeader>
                <CardTitle>Endpoints Disponíveis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Lista de Endpoints */}
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {/* Endpoint: Ping */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="endpoint-ping"
                            checked={endpointsConfig?.endpoints?.find(e => e.path === '/ping')?.enabled || false}
                            onCheckedChange={(enabled) => {
                              setEndpointsConfig(prev => ({
                                ...prev,
                                endpoints: prev?.endpoints?.map(e => 
                                  e.path === '/ping' ? { ...e, enabled } : e
                                ) || []
                              }));
                            }}
                          />
                          <Label htmlFor="endpoint-ping" className="font-semibold">
                            /ping
                          </Label>
                          <Badge variant="secondary">GET</Badge>
                          <Badge variant="outline" className="text-green-600">
                            Basic
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Verifica se o servidor está ativo e responsivo. Retorna status básico da conexão.
                      </p>
                      <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
                        <strong>Exemplo de resposta:</strong><br />
                        {`{ "status": "ok", "timestamp": "2024-01-01T12:00:00Z", "version": "1.0" }`}
                      </div>
                    </div>

                    {/* Endpoint: Consulta */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="endpoint-consulta"
                            checked={endpointsConfig?.endpoints?.find(e => e.path === '/consulta')?.enabled || false}
                            onCheckedChange={(enabled) => {
                              setEndpointsConfig(prev => ({
                                ...prev,
                                endpoints: prev?.endpoints?.map(e => 
                                  e.path === '/consulta' ? { ...e, enabled } : e
                                ) || []
                              }));
                            }}
                          />
                          <Label htmlFor="endpoint-consulta" className="font-semibold">
                            /consulta
                          </Label>
                          <Badge variant="secondary">POST</Badge>
                          <Badge variant="outline" className="text-yellow-600">
                            Standard
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Executa consultas pré-definidas no sistema Protheus. Permite buscar dados específicos usando parâmetros estruturados.
                      </p>
                      <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
                        <strong>Exemplo de request:</strong><br />
                        {`{ "query": "clientes", "filtros": { "ativo": true, "cidade": "São Paulo" } }`}
                      </div>
                    </div>

                    {/* Endpoint: SQL */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="endpoint-sql"
                            checked={endpointsConfig?.endpoints?.find(e => e.path === '/sql')?.enabled || false}
                            onCheckedChange={(enabled) => {
                              setEndpointsConfig(prev => ({
                                ...prev,
                                endpoints: prev?.endpoints?.map(e => 
                                  e.path === '/sql' ? { ...e, enabled } : e
                                ) || []
                              }));
                            }}
                          />
                          <Label htmlFor="endpoint-sql" className="font-semibold">
                            /sql
                          </Label>
                          <Badge variant="secondary">POST</Badge>
                          <Badge variant="destructive">Critical</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Executa comandos SQL diretos no banco de dados. <strong>ATENÇÃO:</strong> Endpoint de alto risco que permite acesso direto aos dados.
                      </p>
                      <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
                        <strong>Exemplo de request:</strong><br />
                        {`{ "sql": "SELECT * FROM SA1010 WHERE A1_COD = ?", "params": ["000001"] }`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Autenticação */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Autenticação</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• <strong>Header:</strong> Authorization: Bearer [API_KEY]</p>
                    <p>• <strong>Content-Type:</strong> application/json</p>
                    <p>• <strong>Rate Limit:</strong> 100 requests/minuto por API Key</p>
                  </div>
                </div>

                {/* Segurança */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Restrições de Segurança</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Endpoints críticos requerem permissões especiais</p>
                    <p>• Logs de auditoria são mantidos por 90 dias</p>
                    <p>• IPs suspeitos são bloqueados automaticamente</p>
                    <p>• Todas as operações SQL são monitoradas</p>
                  </div>
                </div>

                {/* Documentação do Oracle Proxy */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Documentação do Oracle Proxy</h4>
                  <Textarea
                    placeholder="Cole aqui o código do index.js do Oracle Proxy para documentar os endpoints disponíveis..."
                    value={oracleProxyCode}
                    onChange={(e) => setOracleProxyCode(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                  <Button variant="outline" onClick={handleTest}>
                    Testar Conexão
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testes" className="space-y-4" forceMount>
            <div className={`space-y-4 ${activeTab !== 'testes' ? 'hidden' : ''}`}>
              <ProtheusConnectionTests config={config} />
            </div>
          </TabsContent>

          <TabsContent value="historico" className="space-y-4">
            <ProtheusUsageHistory />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}