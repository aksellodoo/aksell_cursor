import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { getErrorMessage } from "../_shared/errorUtils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface for table field with mapping
interface TableField {
  name: string;
  type: string;
  nullable: boolean;
  original_name?: string;
  original_type?: string;
}

// Interface for field mapping (simplified)
interface FieldMapping {
  originalName: string;
  sanitizedName: string;
  originalType: string;
  postgresType: string;
}

// Interface for request body
interface ProtheusTableConfig {
  id: string;
  table_name: string;
  description: string;
  created_by: string;
  enable_sha256_hash: boolean;
  key_fields?: string;
  extra_fields?: any[];
  selected_fields?: string[]; // NOVO: campos selecionados via CSV
}

// Main serve functionality
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const tableConfigWrapper = await req.json();
    // Permite ambos formatos anteriores { ...tableConfig } e { tableConfig: {...} }
    const tableConfig: ProtheusTableConfig = (tableConfigWrapper?.tableConfig ?? tableConfigWrapper) as ProtheusTableConfig;
    console.log('📋 Creating table for config:', tableConfig);

    // Get user's Protheus configuration
    const { data: userConfig, error: configError } = await supabase
      .from('protheus_config')
      .select('*')
      .eq('user_id', tableConfig.created_by)
      .eq('is_active', true)
      .single();

    if (configError || !userConfig) {
      console.error('❌ Protheus config not found:', configError);
      throw new Error('Configuração do Protheus não encontrada');
    }

    console.log('🔧 Using Protheus config:', userConfig.connection_type);

    // Generate table name
    const tableName = `protheus_${tableConfig.table_name.toLowerCase()}_${tableConfig.id.split('-')[0]}`;
    
    // Check if table already exists in protheus_dynamic_tables
    const { data: existingTable, error: existingTableError } = await supabase
      .from('protheus_dynamic_tables')
      .select('*')
      .eq('protheus_table_id', tableConfig.id)
      .single();
    
    if (existingTable && !existingTableError) {
      console.log('✅ Table already exists and is registered:', existingTable.supabase_table_name);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Tabela já existe e está configurada',
          table_name: existingTable.supabase_table_name,
          field_count: existingTable.table_structure?.fields?.length || 0,
          mapping_type: 'existing',
          transformations_applied: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Test connection first
    try {
      const pingResponse = await callProtheusAPI(userConfig, '/ping', 'GET');
      console.log('✅ Protheus connection test successful');
    } catch (error) {
      console.error('❌ Protheus connection failed:', error);
      throw new Error('Falha na conexão com o Protheus');
    }

    // Validate oracle_schema configuration
    if (!userConfig.oracle_schema) {
      throw new Error('Schema Oracle não configurado. Configure o schema nas configurações do Protheus.');
    }

    // Discover field structure using Oracle metadata (AGORA considerando selected_fields)
    console.log('🔍 Discovering field structure using Oracle metadata...');
    let fieldMappings: FieldMapping[] = [];

    // Preparar filtro por CSV, se existir
    const selectedFieldsUpper = Array.from(
      new Set(
        (tableConfig.selected_fields || [])
          .map((f) => (f || '').toString().trim().toUpperCase())
          .filter((f) => /^[A-Z0-9_]+$/.test(f))
      )
    );

    try {
      let discoveryQuery: string;
      if (selectedFieldsUpper.length > 0) {
        const list = selectedFieldsUpper.map((c) => `'${c}'`).join(', ');
        discoveryQuery = `SELECT COLUMN_NAME, DATA_TYPE 
          FROM ALL_TAB_COLUMNS 
          WHERE TABLE_NAME = '${tableConfig.table_name}' 
            AND OWNER = '${(await supabase
              .from('protheus_config')
              .select('oracle_schema')
              .eq('user_id', tableConfig.created_by)
              .eq('is_active', true)
              .maybeSingle()).data?.oracle_schema || ''}'
            AND COLUMN_NAME IN (${list})
          ORDER BY COLUMN_ID`;
      } else {
        discoveryQuery = `SELECT COLUMN_NAME, DATA_TYPE 
          FROM ALL_TAB_COLUMNS 
          WHERE TABLE_NAME = '${tableConfig.table_name}' 
            AND OWNER = '${(await supabase
              .from('protheus_config')
              .select('oracle_schema')
              .eq('user_id', tableConfig.created_by)
              .eq('is_active', true)
              .maybeSingle()).data?.oracle_schema || ''}'
          ORDER BY COLUMN_ID`;
      }
      
      console.log(`🔍 Discovery query: ${discoveryQuery}`);
      // Reutiliza a config já carregada antes no arquivo
      // Para manter consistência, usamos userConfig existente (não repetir select)
      const { data: userConfigCheck } = await supabase
        .from('protheus_config')
        .select('*')
        .eq('user_id', tableConfig.created_by)
        .eq('is_active', true)
        .maybeSingle();
      const discoveryResponse = await callProtheusAPI(userConfigCheck || {}, '/sql', 'POST', { query: discoveryQuery });
      
      console.log(`📋 Raw discovery response:`, JSON.stringify(discoveryResponse, null, 2));
      
      if (!Array.isArray(discoveryResponse) || discoveryResponse.length === 0) {
        console.error('❌ No fields discovered for table:', tableConfig.table_name);
        throw new Error(`Nenhum campo encontrado na tabela ${tableConfig.table_name}. Verifique se a tabela existe no schema configurado ou se há permissões adequadas.`);
      }
      
      const seenSanitizedNames = new Set<string>();
      for (const row of discoveryResponse) {
        let columnName: string;
        let dataType: string;
        
        if (Array.isArray(row)) {
          columnName = row[0];
          dataType = row[1];
        } else if (typeof row === 'object' && row !== null) {
          columnName = row.COLUMN_NAME || row.column_name;
          dataType = row.DATA_TYPE || row.data_type;
        } else {
          console.error('❌ Invalid row format:', row);
          continue;
        }
        
        if (!columnName || !dataType) {
          console.error('❌ Missing column name or data type:', row);
          continue;
        }
        
        const sanitizedName = sanitizeColumnName(columnName);
        if (seenSanitizedNames.has(sanitizedName)) {
          console.warn(`⚠️ Nome de campo duplicado após sanitização: ${sanitizedName} (original: ${columnName}). Pulando...`);
          continue;
        }
        seenSanitizedNames.add(sanitizedName);
        
        const postgresType = mapOracleToPostgresType(dataType);
        fieldMappings.push({
          originalName: columnName,
          sanitizedName,
          originalType: dataType,
          postgresType
        });
      }

      // Se CSV foi informado, garantir que apenas os campos do CSV permaneçam
      if (selectedFieldsUpper.length > 0) {
        const beforeCount = fieldMappings.length;
        fieldMappings = fieldMappings.filter((m) => selectedFieldsUpper.includes(m.originalName.toUpperCase()));
        const afterCount = fieldMappings.length;
        console.log(`🔧 Filtrados por CSV: ${afterCount}/${beforeCount} campo(s) serão utilizados`);

        // Validar se todos os campos do CSV existem na tabela Oracle
        const missing = selectedFieldsUpper.filter(
          (n) => !fieldMappings.some((m) => m.originalName.toUpperCase() === n)
        );
        if (missing.length > 0) {
          throw new Error(`Campos do CSV não encontrados na tabela Oracle: ${missing.join(', ')}`);
        }
      }

      console.log(`✅ Successfully discovered ${fieldMappings.length} fields from Oracle metadata`);
      console.log(`📋 Sample fields:`, fieldMappings.slice(0, 5).map(f => `${f.originalName} (${f.originalType}) -> ${f.sanitizedName} (${f.postgresType})`));
      
    } catch (sampleError) {
      console.error('❌ Failed to get field names from sample data:', (sampleError as any).message);
      throw new Error(`Falha ao obter campos da tabela ${tableConfig.table_name}: ${(sampleError as any).message}`);
    }

    // Validation
    console.log('🔍 Validating discovered structure...');
    if (fieldMappings.length === 0) {
      throw new Error('Nenhum campo foi descoberto na tabela');
    }

    // Se CSV foi informado, os campos chave precisam estar no CSV
    if ((tableConfig.selected_fields && tableConfig.selected_fields.length > 0) && tableConfig.key_fields) {
      const keysUpper = tableConfig.key_fields
        .split('+')
        .map((k) => k.trim().toUpperCase())
        .filter((k) => k.length > 0);
      const selectedSet = new Set((tableConfig.selected_fields || []).map((f) => f.trim().toUpperCase()));
      const missingKeys = keysUpper.filter((k) => !selectedSet.has(k));
      if (missingKeys.length > 0) {
        throw new Error(`Campos chave não estão incluídos no CSV: ${missingKeys.join(', ')}`);
      }
    }
    
    console.log('✅ Structure validation completed successfully');

    // Map to PostgreSQL table fields with proper types
    const mappedFields = fieldMappings.map(mapping => ({
      name: mapping.sanitizedName,
      type: mapping.postgresType,
      nullable: true, // Oracle NULLABLE field could be parsed, but keeping simple for now
      original_name: mapping.originalName,
      original_type: mapping.originalType
    }));

    console.log(`✅ Mapped ${mappedFields.length} fields to PostgreSQL types`);

    // Build complete field list including control fields
const allFields: TableField[] = [
      // Protheus data fields (mapped with proper types)
      ...mappedFields,
      
      // Standard control fields
      { name: 'id', type: 'UUID', nullable: false },
      { name: 'protheus_id', type: 'TEXT', nullable: true },
      { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE', nullable: false },
      { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE', nullable: false },
      { name: 'is_new_record', type: 'BOOLEAN', nullable: false },

      // Sync control fields
      { name: 'previous_record_hash', type: 'TEXT', nullable: true },
      { name: 'was_updated_last_sync', type: 'BOOLEAN', nullable: false },
      { name: 'last_sync_id', type: 'UUID', nullable: true },
      { name: 'last_synced_at', type: 'TIMESTAMP WITH TIME ZONE', nullable: true }
    ];

    // Add hash field if enabled
    if (tableConfig.enable_sha256_hash) {
      allFields.push({ name: 'record_hash', type: 'TEXT', nullable: true });
    }

    // Add soft delete fields
    allFields.push(
      { name: 'pending_deletion', type: 'BOOLEAN', nullable: false },
      { name: 'pending_deletion_at', type: 'TIMESTAMP WITH TIME ZONE', nullable: true }
    );

    // NOW fetch and add extra fields from protheus_table_extra_fields (Supabase-only fields)
    console.log('🔍 Fetching extra fields for Supabase table...');
    const { data: extraFields, error: extraFieldsError } = await supabase
      .from('protheus_table_extra_fields')
      .select('*')
      .eq('protheus_table_id', tableConfig.id);
    
    if (extraFieldsError) {
      console.log('⚠️ Warning: Could not fetch extra fields:', extraFieldsError.message);
    }
    
    const tableExtraFields = extraFields || [];
    console.log(`📋 Found ${tableExtraFields.length} extra fields:`, tableExtraFields.map(f => f.field_name));

    // Add extra fields from protheus_table_extra_fields (placed at the end, outside hash calculations)
    if (tableExtraFields && tableExtraFields.length > 0) {
      console.log(`📋 Adding ${tableExtraFields.length} extra fields to table structure...`);
      for (const extraField of tableExtraFields) {
        allFields.push({
          name: sanitizeColumnName(extraField.field_name),
          type: extraField.field_type || 'TEXT',
          nullable: extraField.is_required !== true,
          original_name: extraField.field_name,
          original_type: extraField.field_type
        });
      }
      console.log(`✅ Added extra fields:`, tableExtraFields.map(f => f.field_name));
    }

    console.log(`📋 Total fields to create: ${allFields.length}`);

    // Generate CREATE TABLE SQL
    const createTableSQL = generateCreateTableSQL(tableConfig, allFields);
    console.log('📝 Generated CREATE TABLE SQL');

    // Execute CREATE TABLE using Supabase RPC with detailed debugging
    console.log('🔧 Creating table in Supabase...');
    console.log('📝 SQL Statement to Execute:', createTableSQL);
    
    try {
      // Step 1: Create basic table first
      console.log('📋 Step 1: Creating basic table structure...');
      const { data: createResult, error: createError } = await supabase
        .rpc('create_dynamic_table', { table_definition: createTableSQL });

      if (createError) {
        console.error('❌ Error in create_dynamic_table RPC:', createError);
        console.error('❌ Failed SQL:', createTableSQL);
        // Check if error is about table already existing
        if (createError.message?.includes('already exists')) {
          console.log('⚠️ Table already exists in database, proceeding with registration...');
        } else {
          throw new Error(`Erro ao criar tabela: ${getErrorMessage(createError)}`);
        }
      }

      if (!createResult?.success && !createError?.message?.includes('already exists')) {
        console.error('❌ Table creation failed:', createResult);
        console.error('❌ Failed SQL:', createTableSQL);
        throw new Error(`Erro ao criar tabela: ${createResult?.error}`);
      }

      console.log('✅ Basic table created successfully');
      
      // Step 2: Add unique constraint if key_fields are specified
      if (tableConfig.key_fields && tableConfig.key_fields.trim()) {
        console.log('📋 Step 2: Creating unique constraint for key fields...');
        await createUniqueConstraint(supabase, tableName, tableConfig.key_fields, mappedFields);
      } else {
        console.log('⚠️ No key_fields specified, skipping unique constraint creation');
      }
      
    } catch (error) {
      console.error('❌ Error in table creation process:', error);
      console.error('❌ Failed SQL:', createTableSQL);
      throw new Error(`Erro ao criar tabela: ${getErrorMessage(error)}`);
    }
    
    // Enable RLS on the table
    console.log('🔒 Enabling RLS on table...');
    const { error: rlsError } = await supabase
      .rpc('enable_table_rls', { table_name: tableName });

    if (rlsError) {
      console.log('⚠️ Warning: Could not enable RLS:', rlsError.message);
    }

    // Step 3: Add soft delete index for performance
    console.log('📋 Step 3: Adding soft delete index...');
    try {
      // Add index on pending_deletion for performance
      const addIndexSQL = `
        CREATE INDEX IF NOT EXISTS idx_${tableName}_pending_deletion 
        ON public.${tableName} (pending_deletion) 
        WHERE pending_deletion = true
      `;
      
      const { error: indexError } = await supabase
        .rpc('create_dynamic_table', { table_definition: addIndexSQL });
        
      if (indexError) {
        console.warn('⚠️ Warning: Could not add soft delete index:', indexError.message);
      } else {
        console.log('✅ Added soft delete index');
      }
      
    } catch (error) {
      console.warn('⚠️ Warning: Error in index setup:', getErrorMessage(error));
    }

    // Register the dynamic table mapping with detailed field mappings (or update if exists)
    const { error: insertError } = await supabase
      .from('protheus_dynamic_tables')
      .upsert({
        protheus_table_id: tableConfig.id,
        supabase_table_name: tableName,
        table_structure: {
          fields: allFields,
          field_mappings: fieldMappings,
          extra_fields: (tableExtraFields || []).map((f: any) => ({
            field_name: f.field_name,
            field_type: f.field_type,
            is_required: f.is_required,
            default_value: f.default_value,
            compute_mode: f.compute_mode || 'none',
            compute_expression: f.compute_expression || null,
            compute_separator: f.compute_separator || null,
            compute_options: f.compute_options || {}
          })),
          discovery_metadata: {
            discovered_at: new Date().toISOString(),
            total_fields: fieldMappings.length,
            transformations_applied: 0,
            protheus_table_name: tableConfig.table_name
          }
        }
      })
      .eq('protheus_table_id', tableConfig.id);

    if (insertError) {
      throw new Error(`Erro ao registrar tabela dinâmica: ${insertError.message}`);
    }

    console.log('📝 Dynamic table registered successfully');

    // Create initial sync log entry
    const { error: logError } = await supabase
      .from('protheus_sync_logs')
      .insert({
        protheus_table_id: tableConfig.id,
        status: 'table_created',
        total_records: 0,
        records_processed: 0,
        records_created: 0,
        records_updated: 0,
        records_deleted: 0,
        sync_details: {
          table_name: tableName,
          field_count: allFields.length,
          discovery_method: 'oracle_metadata_query',
          field_mappings_count: fieldMappings.length
        }
      });

    if (logError) {
      console.log('⚠️ Warning: Could not create sync log:', logError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Tabela criada com sucesso',
        table_name: tableName,
        field_count: allFields.length,
        mapping_type: 'oracle_metadata',
        transformations_applied: 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error creating table:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as any).message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Call Protheus API
async function callProtheusAPI(config: any, endpoint: string, method: string, data?: any) {
  const connectionConfig = config.connection_type === 'aksell' 
    ? config.aksell_config 
    : config.totvs_config;

  const url = `${connectionConfig.url.replace(/\/$/, '')}${endpoint}`;
  console.log(`🔗 Calling URL: ${url}`);
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': connectionConfig.apiKey,
    },
    signal: AbortSignal.timeout(10000), // 10 seconds timeout
  };

  if (data) {
    options.body = JSON.stringify(data);
    console.log(`📤 Request payload:`, data);
  }

  const response = await fetch(url, options);
  console.log(`📥 Response status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);
  
  if (!response.ok) {
    throw new Error(`Protheus API error: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type');
  const responseText = await response.text();
  console.log(`📋 Raw response: ${responseText.substring(0, 200)}...`);

  // Check if response is JSON based on content-type or response content
  if (contentType?.includes('application/json') || responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error(`❌ JSON parse error: ${getErrorMessage(parseError)}`);
      throw new Error(`Invalid JSON response from Protheus API: ${responseText.substring(0, 100)}`);
    }
  } else {
    // Return text response wrapped in an object for non-JSON responses
    return { message: responseText };
  }
}

// Helper function to sanitize PostgreSQL column names with minimal changes
function sanitizeColumnName(name: string): string {
  // PostgreSQL reserved words that need prefixing
  const reservedWords = new Set([
    'user', 'table', 'column', 'index', 'primary', 'foreign', 'key', 'constraint',
    'select', 'insert', 'update', 'delete', 'from', 'where', 'order', 'group',
    'having', 'join', 'inner', 'outer', 'left', 'right', 'union', 'case', 'when'
  ]);

  let sanitized = name.toLowerCase();
  
  // Replace special characters with underscores (minimal transformation)
  sanitized = sanitized.replace(/[^a-z0-9_]/g, '_');
  
  // Handle leading numbers
  if (/^\d/.test(sanitized)) {
    sanitized = `col_${sanitized}`;
  }
  
  // Handle reserved words
  if (reservedWords.has(sanitized)) {
    sanitized = `${sanitized}_col`;
  }
  
  // Remove consecutive underscores
  sanitized = sanitized.replace(/_+/g, '_');
  
  // Remove leading/trailing underscores
  sanitized = sanitized.replace(/^_+|_+$/g, '');
  
  // Ensure minimum length
  if (sanitized.length === 0) {
    sanitized = 'col_unnamed';
  }
  
  // PostgreSQL identifier limit
  return sanitized.substring(0, 63);
}

// Map Oracle data types to PostgreSQL
function mapOracleToPostgresType(oracleType: string): string {
  if (!oracleType) return 'TEXT';
  
  const upperType = oracleType.toUpperCase();
  
  // Numeric types
  if (upperType.includes('NUMBER')) {
    // Check for specific number patterns
    if (upperType.includes('NUMBER(1)') || upperType.includes('NUMBER(1,0)')) {
      return 'BOOLEAN'; // Often used for flags
    }
    // For NUMBER types without explicit scale specification or with explicit integer scale (,0)
    // Use NUMERIC by default to handle both integer and decimal values safely
    if (upperType.includes(',0)')) {
      return 'NUMERIC'; // Use NUMERIC instead of BIGINT to handle conversion errors
    }
    return 'NUMERIC'; // Default to NUMERIC for all NUMBER types
  }
  
  // String types
  if (upperType.includes('VARCHAR2') || upperType.includes('VARCHAR')) {
    return 'TEXT';
  }
  if (upperType.includes('CHAR')) {
    return 'TEXT';
  }
  if (upperType.includes('CLOB')) {
    return 'TEXT';
  }
  
  // Date/Time types
  if (upperType.includes('DATE')) {
    return 'TIMESTAMP WITH TIME ZONE';
  }
  if (upperType.includes('TIMESTAMP')) {
    return 'TIMESTAMP WITH TIME ZONE';
  }
  
  // Binary types
  if (upperType.includes('BLOB') || upperType.includes('RAW')) {
    return 'BYTEA';
  }
  
  // Default fallback
  console.log(`⚠️ Unknown Oracle type '${oracleType}', using TEXT as fallback`);
  return 'TEXT';
}

// Generate CREATE TABLE SQL with comprehensive documentation
function generateCreateTableSQL(tableConfig: ProtheusTableConfig, allFields: TableField[]): string {
  const tableName = `protheus_${tableConfig.table_name.toLowerCase()}_${tableConfig.id.split('-')[0]}`;
  
  const fieldDefinitions = allFields.map(field => {
    let definition = `${field.name} ${field.type}`;
    
    if (!field.nullable) {
      definition += ' NOT NULL';
    }
    
    // Add defaults for specific fields (without inline comments that cause SQL syntax errors)
    if (field.name === 'id') {
      definition += ' DEFAULT gen_random_uuid() PRIMARY KEY';
    } else if (field.name === 'created_at' || field.name === 'updated_at') {
      definition += ' DEFAULT now()';
    } else if (field.name === 'is_new_record') {
      definition += ' DEFAULT false';
    } else if (field.name === 'was_updated_last_sync') {
      definition += ' DEFAULT false';
    } else if (field.name === 'pending_deletion') {
      definition += ' DEFAULT false';
    }
    
    return definition;
  });

  const sql = `CREATE TABLE IF NOT EXISTS public.${tableName} (
  ${fieldDefinitions.join(',\n  ')}
);`;

  console.log('🔧 Generated SQL:', sql);
  return sql;
}

// Function to create unique constraint with detailed validation and retry logic
async function createUniqueConstraint(supabase: any, tableName: string, keyFields: string, mappedFields: TableField[]) {
  console.log('🔑 Creating unique constraint based on key fields...');
  console.log('📋 Raw key_fields value:', keyFields);
  
  try {
    // Parse and validate key fields
    const keyFieldsArray = keyFields.split('+').map(field => field.trim());
    console.log('📋 Parsed key fields:', keyFieldsArray);
    
    // Validate that all key fields exist in the discovered fields
    const availableFieldNames = mappedFields.map(f => f.original_name?.toUpperCase() || '');
    const missingFields: string[] = [];
    const validatedFields: string[] = [];
    
    for (const keyField of keyFieldsArray) {
      const upperKeyField = keyField.toUpperCase();
      console.log(`🔍 Validating key field: ${keyField} (${upperKeyField})`);
      
      // Find matching field (case insensitive)
      const matchingField = mappedFields.find(f => 
        f.original_name?.toUpperCase() === upperKeyField
      );
      
      if (matchingField) {
        const sanitizedName = sanitizeColumnName(keyField);
        validatedFields.push(sanitizedName);
        console.log(`✅ Key field validated: ${keyField} -> ${sanitizedName}`);
      } else {
        missingFields.push(keyField);
        console.log(`❌ Key field not found: ${keyField}`);
        console.log(`📋 Available fields:`, availableFieldNames.slice(0, 10));
      }
    }
    
    if (missingFields.length > 0) {
      console.error(`❌ Missing key fields: ${missingFields.join(', ')}`);
      console.error(`📋 Available fields: ${availableFieldNames.join(', ')}`);
      throw new Error(`Campos chave não encontrados na tabela: ${missingFields.join(', ')}`);
    }
    
    if (validatedFields.length === 0) {
      throw new Error('Nenhum campo chave válido encontrado');
    }
    
    console.log(`✅ All key fields validated: ${validatedFields.join(', ')}`);
    
    // Generate constraint SQL
    const constraintName = `${tableName}_unique_key`;
    const constraintSQL = `ALTER TABLE public.${tableName} 
      ADD CONSTRAINT ${constraintName} 
      UNIQUE (${validatedFields.join(', ')});`;
    
    console.log('📝 Constraint SQL:', constraintSQL);
    
    // Execute constraint creation with retry logic
    let constraintCreated = false;
    let attemptCount = 0;
    const maxAttempts = 3;
    
    while (!constraintCreated && attemptCount < maxAttempts) {
      attemptCount++;
      console.log(`🔄 Constraint creation attempt ${attemptCount}/${maxAttempts}`);
      
      try {
        const { data: constraintResult, error: constraintError } = await supabase.rpc('create_dynamic_table', {
          table_definition: constraintSQL
        });
        
        if (constraintError) {
          console.error(`❌ Attempt ${attemptCount} failed:`, constraintError);
          
          if (constraintError.message?.includes('already exists')) {
            console.log('✅ Constraint already exists, considering this a success');
            constraintCreated = true;
            break;
          }
          
          if (attemptCount >= maxAttempts) {
            console.error('❌ All constraint creation attempts failed');
            console.error('❌ Final error:', constraintError);
            throw new Error(`Falha ao criar constraint única após ${maxAttempts} tentativas: ${constraintError.message}`);
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attemptCount));
          
        } else if (constraintResult?.success) {
          console.log(`✅ Unique constraint created successfully on attempt ${attemptCount}`);
          constraintCreated = true;
        } else {
          console.error(`❌ Attempt ${attemptCount} failed with result:`, constraintResult);
          if (attemptCount >= maxAttempts) {
            throw new Error(`Constraint creation failed: ${constraintResult?.error || 'Unknown error'}`);
          }
        }
        
      } catch (rpcError: any) {
        console.error(`❌ RPC error on attempt ${attemptCount}:`, rpcError);
        if (attemptCount >= maxAttempts) {
          throw rpcError;
        }
      }
    }
    
    // Final validation - check if constraint actually exists
    if (constraintCreated) {
      console.log('🔍 Verifying constraint was created...');
      
      try {
        const { data: constraintCheck, error: checkError } = await supabase
          .from('information_schema.table_constraints')
          .select('constraint_name')
          .eq('table_name', tableName)
          .eq('constraint_type', 'UNIQUE')
          .eq('constraint_name', constraintName);
          
        if (checkError) {
          console.log('⚠️ Could not verify constraint creation:', checkError);
        } else if (constraintCheck && constraintCheck.length > 0) {
          console.log('✅ Constraint verified in database');
        } else {
          console.log('⚠️ Constraint not found in information_schema, but creation reported success');
        }
      } catch (verifyError) {
        console.log('⚠️ Error during constraint verification:', verifyError);
      }
    }
    
    return constraintCreated;
    
  } catch (error) {
    console.error('❌ Critical error in createUniqueConstraint:', error);
    throw error; // Re-throw to fail table creation if constraint is essential
  }
}
