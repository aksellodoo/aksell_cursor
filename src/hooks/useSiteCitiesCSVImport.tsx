
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImportProgress {
  total: number;
  processed: number;
  created: number;
  updated: number;
  ignored: number;
  errors: number;
  csvDuplicates: number;
}

interface ImportResult {
  rowIndex: number;
  status: 'created' | 'updated' | 'ignored' | 'error' | 'duplicate';
  cityName: string;
  message: string;
  action?: 'created' | 'updated' | 'ignored';
}

interface ImportSummary {
  total: number;
  created: number;
  updated: number;
  ignored: number;
  errors: number;
  csvDuplicates: number;
  results: ImportResult[];
}

export const useSiteCitiesCSVImport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    created: 0,
    updated: 0,
    ignored: 0,
    errors: 0,
    csvDuplicates: 0
  });
  const { toast } = useToast();

  const importCitiesFromCSV = async (
    csvRows: any[],
    updateExisting: boolean = true,
    dryRun: boolean = false,
    onComplete?: (summary: ImportSummary) => void
  ) => {
    setIsImporting(true);
    setProgress({
      total: csvRows.length,
      processed: 0,
      created: 0,
      updated: 0,
      ignored: 0,
      errors: 0,
      csvDuplicates: 0
    });

    console.log(`🚀 Iniciando importação de ${csvRows.length} cidades - ${dryRun ? 'Simulação' : 'Real'}`);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const results: ImportResult[] = [];
      let summary = {
        total: csvRows.length,
        created: 0,
        updated: 0,
        ignored: 0,
        errors: 0,
        csvDuplicates: 0,
        results: []
      };

      // Detectar duplicatas no CSV por combinação única (cod_munic + cod_uf)
      const csvKeyMap = new Map<string, number>();
      const csvDuplicateIndexes = new Set<number>();

      csvRows.forEach((row, index) => {
        if (row.cod_munic && row.cod_uf) {
          const key = `${row.cod_munic}-${row.cod_uf}`;
          if (csvKeyMap.has(key)) {
            csvDuplicateIndexes.add(index);
            summary.csvDuplicates++;
          } else {
            csvKeyMap.set(key, index);
          }
        }
      });

      if (summary.csvDuplicates > 0) {
        console.log(`📋 Detectadas ${summary.csvDuplicates} linhas duplicadas no arquivo CSV`);
      }

      // Função para normalizar coordenadas
      const normalizeCoordinate = (value: any, type: 'latitude' | 'longitude'): number | null => {
        if (!value || value === '') return null;
        
        let strValue = value.toString().trim().replace(',', '.');
        const numValue = parseFloat(strValue);
        if (isNaN(numValue)) return null;
        
        let finalValue = numValue;
        
        // Detectar se é um valor escalonado (sem ponto decimal e com 3+ dígitos)
        const hasDecimalPoint = strValue.includes('.');
        const absValue = Math.abs(numValue);
        
        if (!hasDecimalPoint && absValue >= 100) {
          // Provavelmente formato escalonado 1:10.000, dividir por 10.000
          finalValue = numValue / 10000;
        } else if (hasDecimalPoint && (absValue > 180)) {
          // Tentar dividir por 10.000 como fallback para valores decimais fora do range
          finalValue = numValue / 10000;
        }
        
        // Arredondar para 6 casas decimais
        finalValue = Math.round(finalValue * 1000000) / 1000000;
        
        // Validar limites geográficos após normalização
        if (type === 'latitude' && (finalValue < -90 || finalValue > 90)) {
          return null;
        }
        if (type === 'longitude' && (finalValue < -180 || finalValue > 180)) {
          return null;
        }
        
        return finalValue;
      };

      // Normalizar e validar dados
      const validRows = [];
      for (let i = 0; i < csvRows.length; i++) {
        const row = csvRows[i];
        const cityName = row.name?.trim() || '';

        if (csvDuplicateIndexes.has(i)) {
          results.push({
            rowIndex: i + 1,
            status: 'duplicate',
            cityName,
            message: 'Linha duplicada no CSV (mesma combinação código município + UF já encontrada anteriormente no arquivo)'
          });
          continue;
        }

        if (!cityName) {
          results.push({
            rowIndex: i + 1,
            status: 'error',
            cityName: 'Nome não informado',
            message: 'Nome da cidade é obrigatório'
          });
          summary.errors++;
          continue;
        }

        if (!row.cod_munic || !row.cod_uf || !row.uf) {
          results.push({
            rowIndex: i + 1,
            status: 'error',
            cityName,
            message: 'Código do município, código da UF e UF são obrigatórios'
          });
          summary.errors++;
          continue;
        }

        // Normalizar coordenadas e coletar avisos
        const latitude = normalizeCoordinate(row.latitude, 'latitude');
        const longitude = normalizeCoordinate(row.longitude, 'longitude');
        
        // Array para coletar avisos desta linha
        const warnings: string[] = [];
        
        // Para coordenadas inválidas, apenas adicionar avisos (não bloquear importação)
        if (row.latitude && row.latitude !== '' && latitude === null) {
          warnings.push("Latitude inválida ignorada");
        }
        
        if (row.longitude && row.longitude !== '' && longitude === null) {
          warnings.push("Longitude inválida ignorada");
        }

        validRows.push({
          rowIndex: i + 1,
          name: cityName,
          cod_munic: row.cod_munic,
          cod_uf: row.cod_uf,
          uf: row.uf.toUpperCase(),
          country: row.country || 'Brasil',
          population_est: row.population_est ? parseInt(row.population_est.toString()) : null,
          codigo_ibge: row.codigo_ibge || row.cod_munic, // Usa cod_munic como fallback
          latitude: latitude, // será null se inválida
          longitude: longitude, // será null se inválida
          capital: row.capital ? (row.capital === '1' || row.capital === 1 ? 1 : 0) : 0,
          siafi_id: row.siafi_id || null,
          ddd: row.ddd || null,
          fuso_horario: row.fuso_horario || null,
          created_by: user.id,
          warnings // preservar avisos para usar nos relatórios
        });
      }

      console.log(`✅ ${validRows.length} linhas válidas para processamento`);

      if (dryRun && validRows.length > 0) {
        // Para dry run, buscar cidades existentes uma vez
        const { data: existingCities } = await supabase
          .from('site_cities')
          .select('cod_munic, cod_uf');

        const existingKeys = new Set(
          (existingCities || []).map(city => `${city.cod_munic}-${city.cod_uf}`)
        );

        validRows.forEach(rowData => {
          const key = `${rowData.cod_munic}-${rowData.cod_uf}`;
          const exists = existingKeys.has(key);
          
          // Construir mensagem com avisos se houver
          let baseMessage = '';
          let warningText = rowData.warnings?.length > 0 ? ` (${rowData.warnings.join('; ')})` : '';

          if (exists) {
            if (updateExisting) {
              baseMessage = 'Seria atualizada';
              results.push({
                rowIndex: rowData.rowIndex,
                status: 'updated',
                cityName: rowData.name,
                message: baseMessage + warningText,
                action: 'updated'
              });
              summary.updated++;
            } else {
              baseMessage = 'Cidade já existe (atualização desabilitada)';
              results.push({
                rowIndex: rowData.rowIndex,
                status: 'ignored',
                cityName: rowData.name,
                message: baseMessage + warningText,
                action: 'ignored'
              });
              summary.ignored++;
            }
          } else {
            baseMessage = 'Seria criada';
            results.push({
              rowIndex: rowData.rowIndex,
              status: 'created',
              cityName: rowData.name,
              message: baseMessage + warningText,
              action: 'created'
            });
            summary.created++;
          }
        });
      } else if (validRows.length > 0) {
        // Processamento real com batching
        const BATCH_SIZE = 400;
        const totalBatches = Math.ceil(validRows.length / BATCH_SIZE);
        
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
          const batchStart = batchIndex * BATCH_SIZE;
          const batchEnd = Math.min(batchStart + BATCH_SIZE, validRows.length);
          const batch = validRows.slice(batchStart, batchEnd);
          
          console.log(`📦 Processando lote ${batchIndex + 1}/${totalBatches} (${batch.length} itens)`);
          
          try {
            if (updateExisting) {
              // Clean batch data - remove rowIndex and warnings before sending to DB
              const cleanBatch = batch.map(({ rowIndex, warnings, ...cleanData }) => cleanData);
              
              // Upsert: inserir ou atualizar (baseado na combinação cod_munic + cod_uf)
              const { data: upsertedData, error } = await supabase
                .from('site_cities')
                .upsert(cleanBatch, { 
                  onConflict: 'cod_munic,cod_uf',
                  ignoreDuplicates: false
                })
                .select('cod_munic, cod_uf');

              if (error) {
                console.error(`❌ Erro no lote ${batchIndex + 1}:`, error);
                batch.forEach(rowData => {
                  results.push({
                    rowIndex: rowData.rowIndex,
                    status: 'error',
                    cityName: rowData.name,
                    message: `Erro no lote: ${error.message}`
                  });
                  summary.errors++;
                });
              } else {
                // Verificar quais já existiam
                const { data: existingInBatch } = await supabase
                  .from('site_cities')
                  .select('cod_munic, cod_uf, created_at')
                  .in('cod_munic', batch.map(r => r.cod_munic))
                  .in('cod_uf', batch.map(r => r.cod_uf));

                const existingMap = new Map(
                  (existingInBatch || []).map(city => [
                    `${city.cod_munic}-${city.cod_uf}`,
                    city.created_at
                  ])
                );

                batch.forEach(rowData => {
                  const key = `${rowData.cod_munic}-${rowData.cod_uf}`;
                  const existingCreatedAt = existingMap.get(key);
                  
                  // Construir mensagem com avisos se houver
                  let baseMessage = '';
                  let warningText = rowData.warnings?.length > 0 ? ` (${rowData.warnings.join('; ')})` : '';
                  
                  if (existingCreatedAt) {
                    // Comparar timestamps para determinar se foi criado agora
                    const wasJustCreated = new Date(existingCreatedAt).getTime() > Date.now() - 5000;
                    if (wasJustCreated) {
                      baseMessage = 'Cidade criada com sucesso';
                      results.push({
                        rowIndex: rowData.rowIndex,
                        status: 'created',
                        cityName: rowData.name,
                        message: baseMessage + warningText
                      });
                      summary.created++;
                    } else {
                      baseMessage = 'Cidade atualizada com sucesso';
                      results.push({
                        rowIndex: rowData.rowIndex,
                        status: 'updated',
                        cityName: rowData.name,
                        message: baseMessage + warningText
                      });
                      summary.updated++;
                    }
                  }
                });
              }
            } else {
              // Clean batch data - remove rowIndex and warnings before sending to DB
              const cleanBatch = batch.map(({ rowIndex, warnings, ...cleanData }) => cleanData);
              
              // Inserir apenas novos, ignorar existentes (baseado na combinação cod_munic + cod_uf)
              const { data: insertedData, error } = await supabase
                .from('site_cities')
                .upsert(cleanBatch, { 
                  onConflict: 'cod_munic,cod_uf',
                  ignoreDuplicates: true
                })
                .select('cod_munic, cod_uf');

              if (error) {
                console.error(`❌ Erro no lote ${batchIndex + 1}:`, error);
                batch.forEach(rowData => {
                  results.push({
                    rowIndex: rowData.rowIndex,
                    status: 'error',
                    cityName: rowData.name,
                    message: `Erro no lote: ${error.message}`
                  });
                  summary.errors++;
                });
              } else {
                // Verificar quais foram realmente inseridos
                const insertedKeys = new Set(
                  (insertedData || []).map(city => `${city.cod_munic}-${city.cod_uf}`)
                );

                batch.forEach(rowData => {
                  const key = `${rowData.cod_munic}-${rowData.cod_uf}`;
                  
                  // Construir mensagem com avisos se houver
                  let baseMessage = '';
                  let warningText = rowData.warnings?.length > 0 ? ` (${rowData.warnings.join('; ')})` : '';
                  
                  if (insertedKeys.has(key)) {
                    baseMessage = 'Cidade criada com sucesso';
                    results.push({
                      rowIndex: rowData.rowIndex,
                      status: 'created',
                      cityName: rowData.name,
                      message: baseMessage + warningText
                    });
                    summary.created++;
                  } else {
                    baseMessage = 'Cidade já existe (atualização desabilitada)';
                    results.push({
                      rowIndex: rowData.rowIndex,
                      status: 'ignored',
                      cityName: rowData.name,
                      message: baseMessage + warningText
                    });
                    summary.ignored++;
                  }
                });
              }
            }
          } catch (batchError: any) {
            console.error(`❌ Erro crítico no lote ${batchIndex + 1}:`, batchError);
            batch.forEach(rowData => {
              results.push({
                rowIndex: rowData.rowIndex,
                status: 'error',
                cityName: rowData.name,
                message: `Erro crítico: ${batchError.message}`
              });
              summary.errors++;
            });
          }

          // Atualizar progresso
          setProgress(prev => ({
            ...prev,
            processed: batchEnd,
            created: summary.created,
            updated: summary.updated,
            ignored: summary.ignored,
            errors: summary.errors
          }));

          // Pequena pausa entre lotes
          if (batchIndex < totalBatches - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }

      summary.results = results;

      const actionText = dryRun ? 'Simulação concluída' : 'Importação concluída';
      console.log(`🎉 ${actionText}: ${summary.created} criadas, ${summary.updated} atualizadas, ${summary.ignored} ignoradas, ${summary.errors} erros, ${summary.csvDuplicates} linhas duplicadas no CSV`);
      
      toast({
        title: actionText,
        description: `${summary.created} criadas, ${summary.updated} atualizadas, ${summary.ignored} ignoradas, ${summary.errors} erros`
      });

      onComplete?.(summary);

    } catch (error: any) {
      console.error('❌ Erro crítico na importação:', error);
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return {
    importCitiesFromCSV,
    isImporting,
    progress
  };
};
