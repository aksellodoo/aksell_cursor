import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ApiConfig {
  url: string;
  apiKey: string;
  schema?: string;
}

interface EndpointConfig {
  path: string;
  method: string;
  description: string;
  authentication: string;
  response?: string;
  body?: any;
  restrictions?: string[];
  enabled: boolean;
  critical: boolean;
  security_level: 'low' | 'medium' | 'high';
}

interface EndpointsDocumentation {
  authentication: {
    type: string;
    header: string;
    description: string;
  };
  endpoints: EndpointConfig[];
  security: {
    restrictions: string[];
  };
}

interface ProtheusConfig {
  id?: string;
  user_id: string;
  is_active: boolean;
  connection_type: 'aksell' | 'totvs';
  aksell_config: Record<string, any>;
  totvs_config: Record<string, any>;
  oracle_proxy_code?: string;
  oracle_schema?: string;
  endpoints_documentation?: EndpointsDocumentation;
  created_at?: string;
  updated_at?: string;
}

const defaultConfig: Omit<ProtheusConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  is_active: false,
  connection_type: 'aksell',
  aksell_config: { url: '', apiKey: '', schema: '' },
  totvs_config: { url: '', apiKey: '' },
  oracle_proxy_code: '',
  oracle_schema: '',
  endpoints_documentation: {
    endpoints: [
      {
        method: "GET",
        path: "/ping",
        description: "Verifica status do servidor Oracle Proxy",
        response: "Oracle Proxy Online ✔️",
        authentication: "Requer x-api-key header",
        enabled: true,
        critical: true,
        security_level: "low" as const
      },
      {
        method: "GET",
        path: "/consulta",
        description: "Consulta exemplo de clientes (primeiros 10 registros)",
        response: "Array com A1_COD e A1_NOME da tabela SA1010",
        authentication: "Requer x-api-key header",
        enabled: true,
        critical: false,
        security_level: "medium" as const
      },
      {
        method: "POST",
        path: "/sql",
        description: "Executa queries SQL customizadas",
        body: { query: "SELECT statement" },
        restrictions: ["Apenas SELECT permitido", "Proibido: DELETE, DROP, UPDATE, INSERT", "Não permite múltiplas queries (;)"],
        response: "Array com resultados da query",
        authentication: "Requer x-api-key header",
        enabled: false,
        critical: false,
        security_level: "high" as const
      }
    ],
    authentication: {
      type: "API Key",
      header: "x-api-key",
      description: "Chave de API necessária em todas as requisições"
    },
    security: {
      restrictions: [
        "Apenas operações SELECT são permitidas",
        "Comandos DELETE, DROP, UPDATE, INSERT são bloqueados",
        "Múltiplas queries separadas por ; são proibidas"
      ]
    }
  }
};

export function useProtheusConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['protheus-config'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('protheus_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      return data || { ...defaultConfig, user_id: user.id };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (newConfig: {
      is_active: boolean;
      connection_type: 'aksell' | 'totvs';
      aksell_config: ApiConfig;
      totvs_config: ApiConfig;
      oracle_proxy_code?: string;
      oracle_schema?: string;
      endpoints_documentation?: EndpointsDocumentation;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const configToSave = {
        user_id: user.id,
        is_active: newConfig.is_active,
        connection_type: newConfig.connection_type,
        aksell_config: newConfig.aksell_config as any,
        totvs_config: newConfig.totvs_config as any,
        oracle_proxy_code: newConfig.oracle_proxy_code || '',
        oracle_schema: newConfig.oracle_schema || '',
        endpoints_documentation: (newConfig.endpoints_documentation || config?.endpoints_documentation) as any,
      };

      const { data, error } = await supabase
        .from('protheus_config')
        .upsert(configToSave, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protheus-config'] });
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Error saving Protheus config:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const saveConfig = (configData: {
    is_active: boolean;
    connection_type: 'aksell' | 'totvs';
    aksell_config: ApiConfig;
    totvs_config: ApiConfig;
    oracle_proxy_code?: string;
    oracle_schema?: string;
    endpoints_documentation?: EndpointsDocumentation;
  }) => {
    saveMutation.mutate(configData);
  };

  return {
    config,
    isLoading,
    saveConfig,
    isSaving: saveMutation.isPending,
  };
}

export type { EndpointConfig, EndpointsDocumentation };