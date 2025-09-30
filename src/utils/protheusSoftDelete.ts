
import { supabase } from "@/integrations/supabase/client";

export async function fixProtheusFlags(tableId: string) {
  try {
    console.log(`🔧 Iniciando correção de flags para tabela: ${tableId}`);
    
    // First, ensure the table has soft delete columns
    try {
      console.log('📝 Verificando e adicionando colunas de pending_deletion...');
      const { data: addColumnsResult, error: addColumnsError } = await supabase.functions.invoke('add-pending-deletion-columns', {
        body: { tableId }
      });
      
      if (addColumnsError) {
        console.warn('⚠️ Add columns function error (non-fatal):', addColumnsError);
      } else {
        console.log('✅ Columns verification/addition completed:', addColumnsResult);
      }
    } catch (addColumnsErr) {
      console.warn('⚠️ Add columns function failed (non-fatal):', addColumnsErr);
    }

    // Then fix the synchronization flags
    console.log('🔧 Executando correção de flags de sincronização...');
    const { data, error } = await supabase.functions.invoke('fix-protheus-flags', {
      body: { tableId }
    });

    if (error) {
      console.error('❌ Error fixing protheus flags:', error);
      throw error;
    }

    console.log('✅ Successfully fixed protheus flags:', data);
    
    // Log success details
    if (data?.stats) {
      console.log(`📊 Stats: ${data.stats.flagsFixed || 0} flags corrigidas, ${data.stats.anomaliesResolved || 0} anomalias resolvidas`);
    }
    
    return data;
  } catch (error) {
    console.error('💥 Failed to fix protheus flags:', error);
    throw error;
  }
}

// Validation function to check cleanup results
export async function validateCleanup() {
  try {
    console.log('🔍 Validating cleanup after migration...');
    
    // Check for remaining auto_setup_protheus_table functions
    const { data: remainingFunctions, error: funcError } = await supabase.rpc('query_dynamic_table', {
      table_name_param: 'pg_proc',
      search_term: 'auto_setup_protheus_table'
    });
    
    if (funcError) {
      console.warn('⚠️ Could not validate functions cleanup:', funcError);
    } else if (remainingFunctions && remainingFunctions.length > 0) {
      console.warn('⚠️ Found remaining functions:', remainingFunctions);
    } else {
      console.log('✅ No remaining auto_setup_protheus_table functions found');
    }
    
    // Log validation complete
    console.log('✅ Cleanup validation completed successfully');
    
  } catch (error) {
    console.warn('⚠️ Validation failed (non-critical):', error);
  }
}

// Check if a table has the required soft delete columns
export async function checkSoftDeleteColumns(tableId: string): Promise<boolean> {
  try {
    const { data: tableInfo } = await supabase
      .from('protheus_dynamic_tables')
      .select('supabase_table_name, table_structure')
      .eq('protheus_table_id', tableId)
      .single();

    if (!tableInfo) return false;

    const supabaseTableName = tableInfo.supabase_table_name;
    const tableStructure = tableInfo.table_structure as any;

    // Method 1: Check table_structure for field definitions
    if (tableStructure && typeof tableStructure === 'object') {
      // Check field_mappings first (newer format)
      if (Array.isArray(tableStructure.field_mappings)) {
        const hasPendingDeletion = tableStructure.field_mappings.some((field: any) => field?.sanitizedName === 'pending_deletion');
        const hasPendingDeletionAt = tableStructure.field_mappings.some((field: any) => field?.sanitizedName === 'pending_deletion_at');
        
        if (hasPendingDeletion && hasPendingDeletionAt) {
          return true;
        }
      }
      
      // Check columns as fallback (older format)
      if (Array.isArray(tableStructure.columns)) {
        const hasPendingDeletion = tableStructure.columns.some((col: any) => col?.name === 'pending_deletion');
        const hasPendingDeletionAt = tableStructure.columns.some((col: any) => col?.name === 'pending_deletion_at');
        
        if (hasPendingDeletion && hasPendingDeletionAt) {
          return true;
        }
      }
    }

    // Method 2: Direct database probe as fallback
    if (!supabaseTableName) return false;

    try {
      // Try to select the pending_deletion column to verify it exists
      const { error: probeError } = await (supabase as any)
        .from(supabaseTableName)
        .select('pending_deletion, pending_deletion_at')
        .limit(1)
        .maybeSingle();

      // If no error, columns exist
      if (!probeError) {
        return true;
      }

      // If error mentions missing column, they don't exist
      if (probeError.message && probeError.message.includes('pending_deletion')) {
        return false;
      }

      // Other errors might be permissions/table issues, assume columns don't exist
      return false;
    } catch (probeErr) {
      console.warn('⚠️ Failed to probe soft delete columns:', probeErr);
      return false;
    }
  } catch (error) {
    console.warn('⚠️ Failed to check soft delete columns:', error);
    return false;
  }
}
