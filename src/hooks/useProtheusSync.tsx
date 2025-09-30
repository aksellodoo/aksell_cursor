import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export const useProtheusSync = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createSyncTable = async (tableId: string): Promise<SyncResult> => {
    console.log('🚀 [DEBUG] Starting createSyncTable for tableId:', tableId);
    setLoading(true);
    
    try {
      // Pre-condition validation
      if (!tableId || typeof tableId !== 'string') {
        throw new Error('Table ID inválido ou não fornecido');
      }
      
      console.log('📋 [DEBUG] Fetching table configuration...');
      // Fetch table configuration
      const { data: tableConfig, error: tableError } = await supabase
        .from('protheus_tables')
        .select('*')
        .eq('id', tableId)
        .single();
      
      console.log('📋 [DEBUG] Table config result:', { tableConfig, tableError });

      if (tableError || !tableConfig) {
        throw new Error(`Tabela não encontrada: ${tableError?.message}`);
      }

      console.log('⚙️ [DEBUG] Fetching Protheus configuration for user:', tableConfig.created_by);
      // Fetch user's Protheus configuration
      const { data: protheusConfig, error: configError } = await supabase
        .from('protheus_config')
        .select('*')
        .eq('user_id', tableConfig.created_by)
        .single();
      
      console.log('⚙️ [DEBUG] Protheus config result:', { protheusConfig, configError });

      if (configError || !protheusConfig) {
        throw new Error(`Configuração do Protheus não encontrada: ${configError?.message}`);
      }

      // Validate Protheus configuration
      if (!protheusConfig.is_active) {
        throw new Error('Configuração do Protheus está inativa. Ative-a primeiro.');
      }

      const connectionConfig = protheusConfig.connection_type === 'aksell' 
        ? protheusConfig.aksell_config as any
        : protheusConfig.totvs_config as any;

      if (!connectionConfig?.url || !connectionConfig?.apiKey) {
        throw new Error(`Configuração ${protheusConfig.connection_type} incompleta: URL ou API Key não definidos`);
      }

      console.log('🔍 [DEBUG] Validating connection config:', { 
        connectionType: protheusConfig.connection_type,
        hasUrl: !!connectionConfig?.url,
        hasApiKey: !!connectionConfig?.apiKey 
      });

      // Test connection first
      console.log('🔌 [DEBUG] Testing Protheus connection...');
      const testQuery = `SELECT * FROM ${tableConfig.table_name} WHERE ROWNUM <= 3`;
      console.log('🔌 [DEBUG] Test query:', testQuery);
      
      const { data: testResult, error: testError } = await supabase.functions.invoke('test-protheus-connection', {
        body: {
          endpoint: '/sql',
          config: protheusConfig,
          requestData: { 
            query: testQuery 
          }
        }
      });
      
      console.log('🔌 [DEBUG] Test connection response:', { testResult, testError });

      if (testError) {
        console.error('Test connection error:', testError);
        throw new Error(`Erro na função de teste: ${testError.message}`);
      }

      if (!testResult?.success) {
        console.error('Test result failed:', testResult);
        throw new Error(`Teste de conexão falhou: ${testResult?.error || 'Erro desconhecido'}`);
      }

      const sampleData = testResult.data;
      if (!sampleData || !Array.isArray(sampleData) || sampleData.length === 0) {
        throw new Error('Nenhum dado encontrado na tabela para análise da estrutura');
      }

      console.log('✅ [DEBUG] Sample data retrieved:', sampleData.length, 'records');

      // Create the sync table
      console.log('🔨 [DEBUG] Calling create-protheus-sync-table with payload:', tableConfig);
      const { data: createResult, error: createError } = await supabase.functions.invoke('create-protheus-sync-table', {
        body: tableConfig
      });
      
      console.log('🔨 [DEBUG] Create table function response:', { createResult, createError });

      if (createError) {
        console.error('❌ [ERROR] Create table error:', createError);
        throw new Error(`Erro na função de criação: ${createError.message}`);
      }

      if (!createResult?.success) {
        console.error('❌ [ERROR] Create result failed:', createResult);
        throw new Error(`Falha ao criar tabela de sincronização: ${createResult?.error || 'Erro desconhecido'}`);
      }

      console.log('✅ [SUCCESS] Table created successfully:', createResult);

      return {
        success: true,
        message: `Tabela ${createResult.tableName} criada com sucesso com ${createResult.fieldsCount} campos`,
        data: createResult
      };

    } catch (error: any) {
      console.error('Error creating sync table:', error);
      return {
        success: false,
        message: error.message
      };
    } finally {
      setLoading(false);
    }
  };

  const syncTable = async (tableId: string, forceFullSync = false): Promise<SyncResult> => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('sync-protheus-table', {
        body: {
          tableId: tableId,
          forceFullSync: forceFullSync,
          skipBinary: true // Skip binary fields for manual syncs
        }
      });

      if (error) {
        throw new Error(`Erro na função de sincronização: ${error.message}`);
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Erro na sincronização');
      }

      return {
        success: true,
        message: `Sincronização concluída: ${result.stats.processed} registros processados`,
        data: result
      };

    } catch (error: any) {
      console.error('Error syncing table:', error);
      return {
        success: false,
        message: error.message
      };
    } finally {
      setLoading(false);
    }
  };

  const testTableConnection = async (tableId: string): Promise<SyncResult> => {
    setLoading(true);
    try {
      // Fetch table configuration
      const { data: tableConfig, error: tableError } = await supabase
        .from('protheus_tables')
        .select('*')
        .eq('id', tableId)
        .single();

      if (tableError || !tableConfig) {
        throw new Error(`Tabela não encontrada: ${tableError?.message}`);
      }

      // Fetch user's Protheus configuration
      const { data: protheusConfig, error: configError } = await supabase
        .from('protheus_config')
        .select('*')
        .eq('user_id', tableConfig.created_by)
        .single();

      if (configError || !protheusConfig) {
        throw new Error(`Configuração do Protheus não encontrada: ${configError?.message}`);
      }

      // Validate configuration
      if (!protheusConfig.is_active) {
        throw new Error('Configuração do Protheus está inativa');
      }

      const connectionConfig = protheusConfig.connection_type === 'aksell' 
        ? protheusConfig.aksell_config as any
        : protheusConfig.totvs_config as any;

      if (!connectionConfig?.url || !connectionConfig?.apiKey) {
        throw new Error(`Configuração ${protheusConfig.connection_type} incompleta`);
      }

      // Test multiple queries to validate table access
      const testQueries = [
        { 
          name: 'Ping', 
          endpoint: '/ping' 
        },
        { 
          name: 'Count Records', 
          endpoint: '/sql',
          data: { query: `SELECT COUNT(*) as total FROM ${tableConfig.table_name} WHERE D_E_L_E_T_ = ''` }
        },
        { 
          name: 'Sample Data', 
          endpoint: '/sql',
          data: { query: `SELECT * FROM ${tableConfig.table_name} WHERE D_E_L_E_T_ = '' AND ROWNUM <= 5` }
        }
      ];

      const results = [];
      
      for (const test of testQueries) {
        try {
          const { data: testResult, error: testError } = await supabase.functions.invoke('test-protheus-connection', {
            body: {
              endpoint: test.endpoint,
              config: protheusConfig,
              requestData: test.data
            }
          });

          if (testError) {
            throw new Error(`${test.name}: ${testError.message}`);
          }

          if (!testResult?.success) {
            throw new Error(`${test.name}: ${testResult?.error || 'Falha no teste'}`);
          }

          results.push({
            test: test.name,
            success: true,
            data: test.name === 'Sample Data' ? testResult.data?.slice(0, 2) : testResult.data,
            responseTime: testResult.responseTime
          });

        } catch (error: any) {
          results.push({
            test: test.name,
            success: false,
            error: error.message
          });
        }
      }

      const successfulTests = results.filter(r => r.success).length;
      const totalTests = results.length;

      return {
        success: successfulTests === totalTests,
        message: `Conexão testada: ${successfulTests}/${totalTests} testes bem-sucedidos`,
        data: {
          table_name: tableConfig.table_name,
          tests: results,
          summary: {
            successful: successfulTests,
            total: totalTests,
            success_rate: Math.round((successfulTests / totalTests) * 100)
          }
        }
      };

    } catch (error: any) {
      console.error('Error testing table connection:', error);
      return {
        success: false,
        message: error.message
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createSyncTable,
    syncTable,
    testTableConnection
  };
};