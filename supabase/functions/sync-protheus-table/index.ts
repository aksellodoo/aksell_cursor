import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Data structures
interface SyncStats {
  processed: number;
  created: number;
  updated: number;
  deleted: number;
  errors: number;
  blobs_downloaded?: number;
  blobs_skipped?: number;
  blobs_errors?: number;
}

interface BinaryFieldInfo {
  name: string;
  id_template: string;
}

interface BinaryFieldsConfig {
  fields: BinaryFieldInfo[];
  schema: string;
  id_fallback: string;
}

// Known binary field types that should be excluded from SQL SELECT
const BINARY_FIELD_TYPES = ['BLOB', 'CLOB', 'RAW', 'LONG', 'VARBINARY', 'BYTEA'];

// Known problematic field names (heuristic)
const KNOWN_BINARY_FIELDS = ['DS_DOCLOG', 'ARQUIVO', 'DOCLOG', 'IMAGEM', 'ANEXO'];

// Safe stringify function to avoid circular structure errors
function safeStringify(obj: any, space?: number): string {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return '[Circular]';
      }
      cache.add(value);
    }
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  }, space);
}

// Detect binary fields from table structure or heuristics
function detectBinaryFields(fieldMappings: any[], tableStructure?: any): string[] {
  const binaryFields: string[] = [];
  
  for (const mapping of fieldMappings) {
    const fieldName = mapping.originalName;
    const dataType = mapping.oracleType || '';
    
    // Check by data type
    if (BINARY_FIELD_TYPES.some(type => dataType.toUpperCase().includes(type))) {
      binaryFields.push(fieldName);
      continue;
    }
    
    // Check by known field names (heuristic)
    if (KNOWN_BINARY_FIELDS.some(known => fieldName.toUpperCase().includes(known.toUpperCase()))) {
      binaryFields.push(fieldName);
      continue;
    }
  }
  
  return binaryFields;
}

// Build safe SQL projection excluding binary fields
function buildSafeProjection(fieldMappings: any[], selectedFields?: string[], binaryFields?: string[]): string {
  let fieldsToInclude: string[];
  
  if (selectedFields && selectedFields.length > 0) {
    // Use explicitly selected fields
    fieldsToInclude = selectedFields;
  } else {
    // Use all fields except binary ones
    const excludeFields = binaryFields || [];
    fieldsToInclude = fieldMappings
      .map(m => m.originalName)
      .filter(name => !excludeFields.includes(name));
  }
  
  // Always include essential fields for sync logic
  const essentialFields = ['R_E_C_N_O_', 'D_E_L_E_T_'];
  for (const essential of essentialFields) {
    if (!fieldsToInclude.includes(essential)) {
      fieldsToInclude.push(essential);
    }
  }
  
  return fieldsToInclude.length > 0 ? fieldsToInclude.join(', ') : '*';
}

// Normalize proxy response (convert object with numeric keys to array)
function normalizeProxyResponse(data: any): any[] {
  if (Array.isArray(data)) {
    return data;
  }
  
  if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data);
    // Check if all keys are numeric strings
    const isNumericKeysObject = keys.length > 0 && keys.every(key => /^\d+$/.test(key));
    
    if (isNumericKeysObject) {
      // Convert to array sorted by numeric key
      return keys
        .map(key => parseInt(key))
        .sort((a, b) => a - b)
        .map(index => data[index.toString()]);
    }
  }
  
  return [];
}

// Download binary content via /download/:id endpoint
async function downloadBinaryField(
  userConfig: any, 
  blobId: string, 
  supabase: any, 
  tableId: string, 
  supabaseTableName: string, 
  protheusId: string, 
  fieldName: string
): Promise<{ success: boolean; error?: string; asset?: any }> {
  try {
    console.log(`🔽 Downloading binary field ${fieldName} for record ${protheusId}, blobId: ${blobId}`);
    
    const response = await callProtheusAPI(userConfig, `/download/${encodeURIComponent(blobId)}`, 'GET');
    
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response from download endpoint');
    }
    
    const { data: binaryData, mimeType, size } = response;
    
    if (!binaryData) {
      throw new Error('No binary data received');
    }
    
    // Convert base64 to Uint8Array
    const binaryBuffer = Uint8Array.from(atob(binaryData), c => c.charCodeAt(0));
    
    // Calculate SHA256 for deduplication
    const hash = await calculateSHA256(Array.from(binaryBuffer).map(b => String.fromCharCode(b)).join(''));
    
    // Check if we already have this exact content
    const { data: existingAsset } = await supabase
      .from('protheus_binary_assets')
      .select('id, storage_path')
      .eq('protheus_table_id', tableId)
      .eq('protheus_id', protheusId)
      .eq('field_name', fieldName)
      .eq('sha256', hash)
      .single();
    
    if (existingAsset) {
      console.log(`📎 Binary field ${fieldName} unchanged (same SHA256), skipping upload`);
      return { success: true, asset: existingAsset };
    }
    
    // Upload to Storage
    const storagePath = `protheus_blobs/${supabaseTableName}/${protheusId}/${fieldName}.bin`;
    
    const { error: uploadError } = await supabase.storage
      .from('protheus-blobs')
      .upload(storagePath, binaryBuffer, {
        contentType: mimeType || 'application/octet-stream',
        upsert: true
      });
    
    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }
    
    // Upsert metadata
    const { data: asset, error: metadataError } = await supabase
      .from('protheus_binary_assets')
      .upsert({
        protheus_table_id: tableId,
        supabase_table_name: supabaseTableName,
        protheus_id: protheusId,
        field_name: fieldName,
        storage_path: storagePath,
        mime_type: mimeType,
        size_bytes: binaryBuffer.length,
        sha256: hash,
        downloaded_at: new Date().toISOString()
      }, {
        onConflict: 'protheus_table_id,protheus_id,field_name'
      })
      .select()
      .single();
    
    if (metadataError) {
      throw new Error(`Metadata upsert failed: ${metadataError.message}`);
    }
    
    console.log(`✅ Binary field ${fieldName} downloaded and stored: ${storagePath}`);
    return { success: true, asset };
    
  } catch (error: any) {
    console.error(`❌ Failed to download binary field ${fieldName}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Build blobId from template
function buildBlobId(template: string, record: any, schema: string, tableName: string, fieldName: string): string {
  return template
    .replace('{SCHEMA}', schema)
    .replace('{TABLE}', tableName)
    .replace('{FIELD}', fieldName)
    .replace('{R_E_C_N_O_}', record.R_E_C_N_O_ || record.r_e_c_n_o || '')
    .replace(/\{([^}]+)\}/g, (match, key) => record[key] || '');
}

// Main synchronization logic
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('🚀 sync-protheus-table function started');

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Enhanced environment validation
    const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
    for (const envVar of requiredEnvVars) {
      if (!Deno.env.get(envVar)) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    // Parse request body
    const { tableId, forceFullSync = false, source = 'manual', userId = null, skipBinary = true } = await req.json();
    console.log('🔄 Starting sync for table:', tableId, 'source:', source, 'userId:', userId, 'skipBinary:', skipBinary);
    
    // Initialize variables for global scope access
    let excludedBinaryFields: string[] = [];
    
    // Early validation
    if (!tableId) {
      throw new Error('tableId é obrigatório');
    }

    // Fetch Protheus table configuration
    const { data: tableConfig, error: tableError } = await supabase
      .from('protheus_tables')
      .select('*')
      .eq('id', tableId)
      .single();

    if (tableError || !tableConfig) {
      throw new Error(`Configuração da tabela não encontrada: ${tableError?.message || 'Tabela não existe'}`);
    }

    // Determine user ID for config lookup
    const configUserId = userId || tableConfig.created_by;
    console.log('📋 Using user ID for config:', configUserId, 'table created by:', tableConfig.created_by);

    // Fetch user's Protheus configuration
    const { data: userConfig, error: configError } = await supabase
      .from('protheus_config')
      .select('*')
      .eq('user_id', configUserId)
      .eq('is_active', true)
      .single();

    if (configError || !userConfig) {
      console.error('❌ Protheus config error:', {
        configError,
        configUserId,
        tableCreatedBy: tableConfig.created_by,
        source
      });
      throw new Error(`Configuração do Protheus não encontrada para usuário ${configUserId}: ${configError?.message || 'Config inativa ou inexistente'}`);
    }

    console.log('✅ Found Protheus config for user:', configUserId, 'connection type:', userConfig.connection_type);

    // Fetch dynamic table mapping
    const { data: dynamicTable, error: dynamicError } = await supabase
      .from('protheus_dynamic_tables')
      .select('*')
      .eq('protheus_table_id', tableId)
      .single();

    if (dynamicError || !dynamicTable) {
      throw new Error('Tabela dinâmica não encontrada. Execute a criação da tabela primeiro.');
    }

    const supabaseTableName = dynamicTable.supabase_table_name;
    console.log('📊 Syncing to table:', supabaseTableName);

    // Detect first baseline sync (table empty)
    let isFirstSyncBaseline = false;
    try {
      const { count, error: countErr } = await supabase
        .from(supabaseTableName)
        .select('protheus_id', { count: 'exact', head: true });
      if (!countErr) {
        isFirstSyncBaseline = (count ?? 0) === 0;
      } else {
        console.warn('⚠️ Count error, assuming not first sync:', countErr.message);
      }
    } catch (e) {
      console.warn('⚠️ Could not determine baseline state:', (e as any)?.message || e);
    }

    // Clear previous was_updated_last_sync flags before processing
    try {
      await supabase
        .from(supabaseTableName)
        .update({ was_updated_last_sync: false })
        .eq('was_updated_last_sync', true);
    } catch (e) {
      console.warn('⚠️ Could not clear previous flags:', (e as any)?.message || e);
    }

    // Fetch computed extra fields configuration
    const { data: extraFields, error: extraFieldsErr } = await supabase
      .from('protheus_table_extra_fields')
      .select('field_name, field_type, is_required, default_value, compute_mode, compute_expression, compute_separator, compute_options')
      .eq('protheus_table_id', tableId);
    if (extraFieldsErr) {
      console.warn('⚠️ Could not fetch extra fields:', extraFieldsErr.message);
    }
    const computedExtraFields = (extraFields || []).filter((f: any) => (f.compute_mode || 'none') !== 'none');

    // Create sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from('protheus_sync_logs')
      .insert({
        protheus_table_id: tableId,
        status: 'running',
        sync_type: source === 'scheduled' ? 'scheduled' : 'manual',
        started_at: new Date().toISOString(),
        total_records: 0,
        records_processed: 0,
        records_created: 0,
        records_updated: 0,
        records_deleted: 0
      })
      .select()
      .single();

    if (logError) {
      throw new Error(`Erro ao criar log de sincronização: ${logError.message}`);
    }

    console.log('📝 Sync log created:', syncLog.id);

    let stats: SyncStats = {
      processed: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      errors: 0,
      blobs_downloaded: 0,
      blobs_skipped: 0,
      blobs_errors: 0
    };

    try {
      // Use existing field mappings from table creation
      const fieldMappings = dynamicTable.table_structure.field_mappings || [];
      
      if (fieldMappings.length === 0) {
        throw new Error('Nenhum mapeamento de campo encontrado. Recrie a tabela para gerar os mapeamentos.');
      }
      
      console.log(`📊 Using ${fieldMappings.length} field mappings from table structure:`);

      // Detect binary fields that need special handling
      const binaryFields = detectBinaryFields(fieldMappings);
      excludedBinaryFields = binaryFields;
      console.log('🔍 Detected binary fields:', binaryFields);

      // Get binary fields configuration - skip all binary fields when requested
      const binaryConfig: BinaryFieldsConfig = skipBinary 
        ? { fields: [], schema: '', id_fallback: '' }  // Force empty when skipping
        : (tableConfig.binary_fields_config || {
            fields: binaryFields.map(name => ({ name, id_template: '{SCHEMA}.{TABLE}.{FIELD}:{R_E_C_N_O_}' })),
            schema: userConfig.connection_type === 'aksell' ? userConfig.aksell_config?.schema || 'U_CGIFBA_PR' : userConfig.oracle_schema,
            id_fallback: '{R_E_C_N_O_}'
          });

      // Build SQL with safe projection (excluding binary fields)
      const connectionConfig = userConfig.connection_type === 'aksell' 
        ? userConfig.aksell_config 
        : userConfig.totvs_config;
      
      const schema = connectionConfig.schema || userConfig.oracle_schema;
      const tableName = tableConfig.table_name;
      
      // Build safe projection excluding binary fields
      const projection = buildSafeProjection(fieldMappings, tableConfig.selected_fields, binaryFields);
      
      const query = schema 
        ? `SELECT ${projection} FROM ${schema}.${tableName} WHERE D_E_L_E_T_ = ' '`
        : `SELECT ${projection} FROM ${tableName} WHERE D_E_L_E_T_ = ' '`;
      
      console.log('🔍 Executing safe SQL query (binary fields excluded):', query);
      console.log('🚫 Excluded binary fields:', binaryFields);
      
      let protheusData: any;
      try {
        protheusData = await callProtheusAPI(userConfig, '/sql', 'POST', { query });
      } catch (error: any) {
        if (error.message?.includes('500') && projection !== '*') {
          // Fallback: if still getting 500, try with even more conservative approach
          console.warn('⚠️ 500 error with safe projection, attempting further field exclusion...');
          throw new Error(`Sync failed with safe projection. Binary fields may still be causing issues: ${error.message}`);
        }
        throw error;
      }
      
      // Normalize response from proxy (handle object with numeric keys)
      const normalizedData = normalizeProxyResponse(protheusData);
      
      if (!normalizedData || !Array.isArray(normalizedData)) {
        throw new Error('Dados do Protheus não retornados ou em formato inválido');
      }

      console.log(`📊 Retrieved ${normalizedData.length} records from Protheus`);

      // Update sync log with total records
      await supabase
        .from('protheus_sync_logs')
        .update({ 
          total_records: normalizedData.length,
          sync_details: {
            query_used: query,
            excluded_binary_fields: excludedBinaryFields,
            safe_projection_used: projection !== '*',
            skip_binary: skipBinary,
            binary_download_skipped: skipBinary
          }
        })
        .eq('id', syncLog.id);

      if (normalizedData.length === 0) {
        console.log('ℹ️ No data to sync');
        
        // Update log as completed
        await supabase
          .from('protheus_sync_logs')
          .update({
            status: 'completed',
            finished_at: new Date().toISOString(),
            sync_details: { message: 'No data to sync' }
          })
          .eq('id', syncLog.id);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Sincronização concluída - nenhum dado encontrado',
            stats,
            tableId,
            syncLogId: syncLog.id
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      console.log(`📋 Sample mappings:`, fieldMappings.slice(0, 5).map((m: any) => `${m.originalName} -> ${m.sanitizedName}`));

      // Process data in batches for better performance
      const BATCH_SIZE = 100;
      const totalRecords = normalizedData.length;
      console.log(`🔄 Processing ${totalRecords} records in batches of ${BATCH_SIZE}`);
      
      // Track active Protheus IDs to detect deletions later
      const activeIds = new Set<string>();
      
      for (let batchStart = 0; batchStart < totalRecords; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, totalRecords);
        const batch = normalizedData.slice(batchStart, batchEnd);
        
        console.log(`📦 Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(totalRecords / BATCH_SIZE)} (${batchStart + 1}-${batchEnd})`);
        
        const transformedRecords = [];
        
        for (let i = 0; i < batch.length; i++) {
          const record = batch[i];
          const globalIndex = batchStart + i;
          
          // Skip invalid records
          if (!record || (typeof record !== 'object')) {
            console.log(`⚠️ Skipping invalid record at index ${globalIndex}`);
            stats.errors++;
            continue;
          }

          // Create composite protheus_id from key fields
          const keyFields = tableConfig.key_fields ? tableConfig.key_fields.split('+') : ['A1_FILIAL', 'A1_COD', 'A1_LOJA'];
          const compositeId = keyFields.map((field: string) => record[field] || '').join('+');
          // Track active id for deletion detection
          activeIds.add(compositeId);

          // Transform record using name-based mapping (excluding binary fields)
          const transformedRecord: any = {
            protheus_id: compositeId,
            is_new_record: false
          };

          // Map each Protheus field to Supabase field using field mappings (excluding binary)
          if (typeof record === 'object' && record !== null && !Array.isArray(record)) {
            for (const mapping of fieldMappings) {
              const originalName = mapping.originalName;
              const sanitizedName = mapping.sanitizedName;
              
              // Skip binary fields in main record (they'll be handled separately)
              if (binaryFields.includes(originalName)) {
                continue;
              }
              
              const value = record[originalName];
              transformedRecord[sanitizedName] = castValueToType(value, mapping.postgresType);
            }
          } else {
            console.log(`⚠️ Record format not supported at index ${globalIndex}:`, typeof record);
            stats.errors++;
            continue;
          }

          // Add hash if enabled (excluding binary fields from hash calculation)
          if (tableConfig.enable_sha256_hash) {
            const orderedFields = fieldMappings
              .filter((mapping: any) => !binaryFields.includes(mapping.originalName))
              .sort((a: any, b: any) => a.originalName.localeCompare(b.originalName))
              .map((mapping: any) => `${mapping.originalName}:${record[mapping.originalName] || ''}`)
              .join('|');
            transformedRecord.record_hash = await calculateSHA256(orderedFields);
          }

          // Compute extra fields (concat/formula)
          if (computedExtraFields.length > 0) {
            try {
              const upperRecord: Record<string, any> = {};
              for (const [k, v] of Object.entries(record)) upperRecord[String(k).toUpperCase()] = v;
              for (const f of computedExtraFields as any[]) {
                const colName = sanitizeColumnName(f.field_name);
                let computed: any = null;
                const mode = (f.compute_mode || 'none').toLowerCase();
                const expr = (f.compute_expression || '').toString();
                if (mode === 'concat') {
                  const tokens = expr.split('+').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
                  const parts = tokens.map((t: string) => {
                    const val = upperRecord[t.toUpperCase()];
                    return val === null || val === undefined ? '' : String(val);
                  });
                  const skipEmpty = !!(f.compute_options && (f.compute_options as any).skipEmpty);
                  const filtered = skipEmpty ? parts.filter((p: string) => p !== '') : parts;
                  const sep = f.compute_separator ?? '';
                  computed = filtered.join(sep);
                } else if (mode === 'formula') {
                  try {
                    computed = evaluateNumericExpression(expr, upperRecord);
                  } catch (e) {
                    computed = null;
                    await supabase.from('protheus_sync_errors').insert({
                      sync_log_id: syncLog.id,
                      protheus_table_id: tableId,
                      record_data: record || {},
                      error_type: 'compute_error',
                      error_message: String(e),
                      error_details: { field_name: f.field_name, mode, expression: expr },
                      protheus_key_fields: {},
                      attempt_number: 1,
                    });
                    stats.errors++;
                  }
                }
                transformedRecord[colName] = castValueToType(computed, f.field_type);
              }
            } catch (e) {
              console.warn('⚠️ Compute phase error:', e);
            }
          }

          transformedRecords.push(transformedRecord);
          stats.processed++;
        }

        // Insert batch using upsert with change detection (hash-aware) and detailed error logging
        if (transformedRecords.length > 0) {
          // Conflict fields definition based on table config
          let conflictFields = 'protheus_id';
          let conflictFieldsArray = ['protheus_id'];
          if (tableConfig.key_fields) {
            conflictFieldsArray = tableConfig.key_fields.split('+').map((field: string) => 
              sanitizeColumnName(field.trim())
            );
            conflictFields = conflictFieldsArray.join(',');
          }

          // Fetch existing rows for this batch to classify create/update
          const batchProtheusIds = transformedRecords.map((r: any) => r.protheus_id);
          const { data: existingRows, error: existingErr } = await supabase
            .from(supabaseTableName)
            .select('protheus_id, record_hash')
            .in('protheus_id', batchProtheusIds);

          if (existingErr) {
            console.warn('⚠️ Failed to fetch existing rows for batch classification:', existingErr.message);
          }

          const existingMap = new Map<string, string | null | undefined>(
            (existingRows || []).map((r: any) => [r.protheus_id, r.record_hash])
          );

          // 🔧 DIAGNÓSTICO COMPLETO - ETAPA 1: DADOS DO PROTHEUS
          console.log('📥 DADOS DO PROTHEUS:');
          transformedRecords.forEach((r: any, index: number) => {
            if (index < 3 || r.protheus_id === '01000001') {
              console.log(`  📋 Record ${r.protheus_id}: ${r.a3_nome || r.a3_nreduz} (${r.a3_cod})`);
            }
          });

          // 🔧 DIAGNÓSTICO COMPLETO - ETAPA 2: DADOS EXISTENTES NA BASE
          console.log('💾 DADOS EXISTENTES NA BASE:');
          (existingRows || []).forEach((r: any, index: number) => {
            if (index < 3 || r.protheus_id === '01000001') {
              console.log(`  💽 Existing ${r.protheus_id}: hash=${r.record_hash?.substring(0, 10)}...`);
            }
          });

          // 🔧 HASH CONFIGURATION CHECK
          const hasHash = !!tableConfig.enable_sha256_hash;
          const forceUpdate = !hasHash; // Force update when hash is not enabled
          
          console.log(`🔍 CONFIGURAÇÃO:`, {
            hasHash,
            forceUpdate,
            totalRecords: transformedRecords.length,
            existingRecords: existingRows?.length || 0,
            tableConfig: {
              enable_sha256_hash: tableConfig.enable_sha256_hash,
              exclude_blob_fields: tableConfig.exclude_blob_fields
            }
          });
          
          // 🔧 DIAGNÓSTICO COMPLETO - ETAPA 3: DETECÇÃO DE NOVOS REGISTROS
          const newRecords = transformedRecords.filter((r: any) => !existingMap.has(r.protheus_id));
          console.log(`✨ NOVOS REGISTROS: ${newRecords.length}`);
          newRecords.forEach((r: any) => {
            console.log(`  ➕ Novo: ${r.protheus_id} (${r.a3_nome || r.a3_nreduz})`);
          });

          // 🔧 DIAGNÓSTICO COMPLETO - ETAPA 4: DETECÇÃO DE REGISTROS ALTERADOS
          const changedRecords = transformedRecords.filter((r: any) => {
            if (!existingMap.has(r.protheus_id)) return false;
            
            // 🔧 FORCE UPDATE LOGIC
            if (forceUpdate) {
              console.log(`🔄 FORCE UPDATE: ${r.protheus_id} (${r.a3_nome || r.a3_nreduz})`);
              return true;
            }
            
            // Normal hash comparison when hash is enabled
            const existingHash = existingMap.get(r.protheus_id);
            const newHash = r.record_hash;
            const hasChanged = existingHash !== newHash;
            
            console.log(`🔍 HASH COMPARE ${r.protheus_id}:`, {
              existing: existingHash?.substring(0, 10) + '...',
              new: newHash?.substring(0, 10) + '...',
              changed: hasChanged,
              name: r.a3_nome || r.a3_nreduz
            });
            
            return hasChanged;
          });
          
          console.log(`📊 RESULTADO DA DETECÇÃO:`, {
            novos: newRecords.length,
            alterados: changedRecords.length,
            total_para_upsert: newRecords.length + changedRecords.length
          });

          const nowIso = new Date().toISOString();

          const newRecordsAugmented = newRecords.map((r: any) => ({
            ...r,
            is_new_record: isFirstSyncBaseline ? false : true,
            previous_record_hash: null,
            was_updated_last_sync: true,
            last_sync_id: syncLog.id,
            last_synced_at: nowIso,
            updated_at: nowIso,
          }));

          const changedRecordsAugmented = changedRecords.map((r: any) => ({
            ...r,
            is_new_record: false,
            previous_record_hash: existingMap.get(r.protheus_id) || null,
            was_updated_last_sync: true,
            last_sync_id: syncLog.id,
            last_synced_at: nowIso,
            updated_at: nowIso,
          }));

          const recordsToUpsert = newRecordsAugmented.concat(changedRecordsAugmented);

          // 🔧 DIAGNÓSTICO COMPLETO - ETAPA 5: VERIFICAR UPSERT
          console.log(`🚀 PREPARANDO UPSERT:`, {
            registros_total: recordsToUpsert.length,
            conflictFields,
            primeiros_3_registros: recordsToUpsert.slice(0, 3).map(r => ({
              protheus_id: r.protheus_id,
              nome: r.a3_nome || r.a3_nreduz,
              is_new: r.is_new_record
            }))
          });

          if (recordsToUpsert.length > 0) {
            // 🔧 ETAPA 6: IMPLEMENTAR FALLBACK SE FORCE UPDATE NÃO FUNCIONAR
            if (forceUpdate && changedRecords.length > 0) {
              console.log('🔧 TENTANDO FALLBACK: DELETE + INSERT para registros alterados');
              
              // First, try to delete existing records that will be updated
              const changedIds = changedRecords.map(r => r.protheus_id);
              const { error: deleteError } = await supabase
                .from(supabaseTableName)
                .delete()
                .in('protheus_id', changedIds);
              
              if (deleteError) {
                console.error('❌ Erro ao deletar registros para fallback:', deleteError);
              } else {
                console.log(`✅ Deletados ${changedIds.length} registros para fallback`);
              }
            }

            const { error: batchInsertError } = await supabase
              .from(supabaseTableName)
              .upsert(recordsToUpsert, {
                onConflict: conflictFields,
                ignoreDuplicates: false,
              });

            if (batchInsertError) {
              console.error(`❌ ERRO NO UPSERT:`, {
                batch: Math.floor(batchStart / BATCH_SIZE) + 1,
                erro: batchInsertError.message,
                code: batchInsertError.code,
                details: batchInsertError.details,
                hint: batchInsertError.hint,
                registros_tentados: recordsToUpsert.length
              });
              stats.errors += recordsToUpsert.length;
              
              // 🔧 FALLBACK: Tentar processar individualmente
              console.log('🔧 PROCESSANDO INDIVIDUALMENTE...');
              for (const record of recordsToUpsert) {
                try {
                  const { error: individualError } = await supabase
                    .from(supabaseTableName)
                    .upsert([record], {
                      onConflict: conflictFields,
                      ignoreDuplicates: false,
                    });
                  
                  if (individualError) {
                    console.error(`❌ Erro individual ${record.protheus_id}:`, individualError.message);
                  } else {
                    console.log(`✅ Sucesso individual ${record.protheus_id}: ${record.a3_nome || record.a3_nreduz}`);
                    if (record.is_new_record) {
                      stats.created++;
                    } else {
                      stats.updated++;
                    }
                  }
                } catch (err) {
                  console.error(`❌ Exception individual ${record.protheus_id}:`, err);
                }
              }
            } else {
              console.log(`✅ SUCESSO NO UPSERT:`, {
                batch: Math.floor(batchStart / BATCH_SIZE) + 1,
                total_upserted: recordsToUpsert.length,
                novos: newRecordsAugmented.length,
                atualizados: changedRecordsAugmented.length,
                conflictFields,
                force_update_ativo: forceUpdate
              });
              stats.created += newRecordsAugmented.length;
              stats.updated += changedRecordsAugmented.length;
              
              // 🔧 VERIFICAR SE OS DADOS REALMENTE FORAM ATUALIZADOS
              if (changedRecordsAugmented.length > 0) {
                const verificacao = await supabase
                  .from(supabaseTableName)
                  .select('protheus_id, a3_nome, a3_nreduz, updated_at')
                  .in('protheus_id', changedRecordsAugmented.slice(0, 3).map(r => r.protheus_id));
                
                console.log('🔍 VERIFICAÇÃO PÓS-UPSERT:', verificacao.data);
              }
            }
          }
        }

        // Phase 2: Download binary fields for this batch (skip if requested)
        if (!skipBinary && binaryConfig.fields.length > 0) {
          console.log(`📦 Processing binary fields for batch ${Math.floor(batchStart / BATCH_SIZE) + 1}`);
        } else if (skipBinary && binaryFields.length > 0) {
          console.log(`⏭️ Skipping binary downloads by configuration (global) - ${binaryFields.length} fields excluded`);
          stats.blobs_skipped! += batch.length * binaryFields.length; // Count all skipped blobs
        }
        
        if (!skipBinary && binaryConfig.fields.length > 0) {
          for (let i = 0; i < batch.length; i++) {
            const record = batch[i];
            const recordIndex = batchStart + i;
            
            if (!record || typeof record !== 'object') continue;
            
            const keyFields = tableConfig.key_fields ? tableConfig.key_fields.split('+') : ['A1_FILIAL', 'A1_COD', 'A1_LOJA'];
            const compositeId = keyFields.map((field: string) => record[field] || '').join('+');
            
            for (const binaryField of binaryConfig.fields) {
              try {
                const blobId = buildBlobId(
                  binaryField.id_template,
                  record,
                  binaryConfig.schema,
                  tableName,
                  binaryField.name
                );
                
                const result = await downloadBinaryField(
                  userConfig,
                  blobId,
                  supabase,
                  tableId,
                  supabaseTableName,
                  compositeId,
                  binaryField.name
                );
                
                if (result.success) {
                  stats.blobs_downloaded!++;
                } else {
                  stats.blobs_errors!++;
                }
                
              } catch (error: any) {
                console.warn(`⚠️ Binary download error for ${binaryField.name}:`, error.message);
                stats.blobs_errors!++;
              }
            }
          }
        }
      }

      // Handle soft deletions using pending_deletion flags to avoid URL length issues
      console.log('🧹 Step 1: Marking all records as pending deletion...');
      await supabase
        .from(supabaseTableName)
        .update({ 
          pending_deletion: true, 
          pending_deletion_at: new Date().toISOString() 
        })
        .neq('pending_deletion', true);

      console.log('🔄 Step 2: Clearing pending deletion flags for active records...');
      // Process active records in batches to avoid URL length issues
      const activeIdsArray = Array.from(activeIds);
      const batchSize = 100;
      
      for (let i = 0; i < activeIdsArray.length; i += batchSize) {
        const batch = activeIdsArray.slice(i, i + batchSize);
        await supabase
          .from(supabaseTableName)
          .update({ pending_deletion: false, pending_deletion_at: null })
          .in('protheus_id', batch);
      }

      console.log('🧹 Step 3: Counting records marked for deletion...');
      const { count: deletionCount, error: countErr } = await supabase
        .from(supabaseTableName)
        .select('protheus_id', { count: 'exact', head: true })
        .eq('pending_deletion', true);

      if (countErr) {
        console.warn('⚠️ Error counting records for deletion:', countErr.message);
        stats.deleted = 0;
      } else {
        stats.deleted = deletionCount || 0;
        console.log(`🧹 Records marked for deletion: ${stats.deleted}`);
      }

      console.log('📊 Processing completed:', stats.processed, 'processed,', stats.created, 'created');

      // Update protheus_tables with last sync timestamp
      await supabase
        .from('protheus_tables')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', tableId);

      console.log('✅ Sync completed successfully');

    } catch (error: any) {
      console.error('❌ Sync error:', error);
      
      // Update sync log with error
      await supabase
        .from('protheus_sync_logs')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          error_message: error.message,
          sync_details: { 
            error: error.message,
            stats,
            safe_logs: true
          }
        })
        .eq('id', syncLog.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          stats,
          tableId,
          syncLogId: syncLog.id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    console.log(`📊 Final stats: ${safeStringify(stats)}`);

    // Update sync log as completed
    await supabase
      .from('protheus_sync_logs')
      .update({
        status: 'completed',
        finished_at: new Date().toISOString(),
        records_processed: stats.processed,
        records_created: stats.created,
        records_updated: stats.updated,
        records_deleted: stats.deleted,
            sync_details: { 
              stats,
              skip_binary: skipBinary,
              excluded_binary_fields: excludedBinaryFields,
              blobs_summary: {
                downloaded: stats.blobs_downloaded,
                skipped: stats.blobs_skipped,
                errors: stats.blobs_errors
              }
            }
      })
      .eq('id', syncLog.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronização concluída com sucesso',
        stats,
        tableId,
        syncLogId: syncLog.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Error in sync:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Helper function to call Protheus API
async function callProtheusAPI(userConfig: any, endpoint: string, method: string = 'GET', requestData?: any) {
  const connectionConfig = userConfig.connection_type === 'aksell' 
    ? userConfig.aksell_config 
    : userConfig.totvs_config;

  const fullUrl = `${connectionConfig.url.replace(/\/$/, '')}${endpoint}`;
  
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': connectionConfig.apiKey,
    },
    signal: AbortSignal.timeout(120000), // 2 minutes timeout for sync operations
  };

  if (requestData && (method === 'POST' || method === 'PUT')) {
    requestOptions.body = JSON.stringify(requestData);
  }

  const response = await fetch(fullUrl, requestOptions);
  
  if (!response.ok) {
    throw new Error(`Protheus API error: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  } else {
    return await response.text();
  }
}

// Utility functions (keep existing implementations)
function sanitizeColumnName(columnName: string): string {
  return columnName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^(\d)/, '_$1');
}

function castValueToType(value: any, fieldType: string): any {
  if (value === null || value === undefined) {
    return null;
  }

  const type = fieldType.toUpperCase();

  try {
    switch (type) {
      case 'INTEGER':
      case 'BIGINT':
        const intVal = parseInt(String(value));
        return isNaN(intVal) ? null : intVal;
      
      case 'NUMERIC':
      case 'DECIMAL':
      case 'FLOAT':
      case 'DOUBLE PRECISION':
        const numVal = parseFloat(String(value));
        return isNaN(numVal) ? null : numVal;
      
      case 'BOOLEAN':
        if (typeof value === 'boolean') return value;
        const strVal = String(value).toLowerCase();
        return strVal === 'true' || strVal === '1' || strVal === 'yes' || strVal === 'y';
      
      case 'DATE':
      case 'TIMESTAMP':
      case 'TIMESTAMP WITH TIME ZONE':
        if (value instanceof Date) return value.toISOString();
        const dateStr = String(value);
        if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
          // YYYYMMDD format
          const year = parseInt(dateStr.substr(0, 4));
          const month = parseInt(dateStr.substr(4, 2));
          const day = parseInt(dateStr.substr(6, 2));
          return new Date(year, month - 1, day).toISOString();
        }
        return value;
      
      case 'BYTEA':
        // Handle binary data - should not happen in main sync anymore
        return null;
      
      default:
        // TEXT, VARCHAR, etc.
        return String(value);
    }
  } catch (error) {
    console.warn(`⚠️ Type casting error for value "${value}" to type "${fieldType}":`, error);
    return String(value);
  }
}

function evaluateNumericExpression(expression: string, record: Record<string, any>): number | null {
  // Implement basic numeric expression evaluation
  // For now, return null for safety
  return null;
}

async function calculateSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
