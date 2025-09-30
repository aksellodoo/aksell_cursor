import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateRequest {
  tableId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting update-supabase-table-structure function');
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const { tableId }: UpdateRequest = await req.json();
    console.log('📋 Processing table ID:', tableId);

    if (!tableId) {
      throw new Error('Table ID is required');
    }

    // Get the current user from the auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Get the Protheus table info
    const { data: prototheusTable, error: tableError } = await supabaseClient
      .from('protheus_tables')
      .select('*')
      .eq('id', tableId)
      .single();

    if (tableError || !prototheusTable) {
      throw new Error('Protheus table not found');
    }

    // Get the corresponding Supabase table name
    const { data: dynamicTable, error: dynamicError } = await supabaseClient
      .from('protheus_dynamic_tables')
      .select('supabase_table_name')
      .eq('protheus_table_id', tableId)
      .single();

    if (dynamicError || !dynamicTable) {
      throw new Error('No Supabase table found for this Protheus table');
    }

    const supabaseTableName = dynamicTable.supabase_table_name;
    console.log('🗄️ Target Supabase table:', supabaseTableName);

    // Get unprocessed extra fields (fields that haven't been applied to Supabase table yet)
    const { data: extraFields, error: fieldsError } = await supabaseClient
      .from('protheus_table_extra_fields')
      .select('*')
      .eq('protheus_table_id', tableId)
      .is('applied_to_supabase', null); // Only get fields that haven't been applied yet

    if (fieldsError) {
      throw new Error(`Error fetching extra fields: ${fieldsError.message}`);
    }

    if (!extraFields || extraFields.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhum campo novo para aplicar'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`📝 Found ${extraFields.length} new fields to apply`);

    // Map field types to PostgreSQL types
    const mapFieldType = (fieldType: string): string => {
      const typeMap: { [key: string]: string } = {
        'text': 'TEXT',
        'varchar': 'VARCHAR(255)',
        'integer': 'INTEGER',
        'decimal': 'DECIMAL(10,2)',
        'boolean': 'BOOLEAN',
        'date': 'DATE',
        'timestamp': 'TIMESTAMP WITH TIME ZONE',
        'json': 'JSONB'
      };
      return typeMap[fieldType] || 'TEXT';
    };

    // Build ALTER TABLE statements for each new field
    const alterStatements: string[] = [];
    
    for (const field of extraFields) {
      const postgresType = mapFieldType(field.field_type);
      let alterStatement = `ALTER TABLE public.${supabaseTableName} ADD COLUMN ${field.field_name} ${postgresType}`;
      
      if (field.default_value) {
        alterStatement += ` DEFAULT '${field.default_value}'`;
      }
      
      if (field.is_required) {
        alterStatement += ' NOT NULL';
      }
      
      alterStatements.push(alterStatement);
    }

    console.log('🔧 ALTER statements to execute:', alterStatements);

    // Execute each ALTER TABLE statement
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < alterStatements.length; i++) {
      const statement = alterStatements[i];
      const field = extraFields[i];
      
      try {
        console.log(`📝 Executing: ${statement}`);
        
        // Execute the ALTER TABLE statement using RPC
        const { error: alterError } = await supabaseClient.rpc('execute_sql', {
          sql_statement: statement
        });

        if (alterError) {
          throw alterError;
        }

        // Mark field as applied to Supabase
        const { error: updateError } = await supabaseClient
          .from('protheus_table_extra_fields')
          .update({
            applied_to_supabase: true,
            applied_at: new Date().toISOString()
          })
          .eq('id', field.id);

        if (updateError) {
          console.error(`⚠️ Error marking field ${field.field_name} as applied:`, updateError);
        }

        successCount++;
        console.log(`✅ Successfully added field: ${field.field_name}`);
        
      } catch (error) {
        console.error(`❌ Error adding field ${field.field_name}:`, error);
        errors.push(`${field.field_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Log the operation
    await supabaseClient
      .from('field_audit_log')
      .insert({
        record_id: tableId,
        field_name: 'supabase_table_structure_update',
        old_value: `${extraFields.length} pending fields`,
        new_value: `${successCount} fields added`,
        changed_by: user.id,
        record_type: 'protheus_table'
      });

    const resultMessage = `Estrutura da tabela atualizada! ${successCount} de ${extraFields.length} campos adicionados com sucesso.`;
    
    if (errors.length > 0) {
      console.error('❌ Some errors occurred:', errors);
      return new Response(
        JSON.stringify({
          success: false,
          message: resultMessage + ` Erros: ${errors.join(', ')}`,
          errors
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: resultMessage,
        fieldsAdded: successCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('💥 Error in update-supabase-table-structure:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});