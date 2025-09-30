import { PostgrestError } from '@supabase/supabase-js';

export function getSupabaseErrorMessage(error: unknown): string {
  // Handle PostgrestError (Supabase database errors)
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const pgError = error as PostgrestError;
    
    // Common error patterns with user-friendly messages
    if (pgError.code === 'PGRST301') {
      return 'Você não tem permissão para realizar esta ação. Contate um administrador.';
    }
    
    if (pgError.message.includes('row-level security policy')) {
      return 'Acesso negado: você não tem permissão para editar este registro.';
    }
    
    if (pgError.message.includes('violates foreign key constraint')) {
      return 'Erro de integridade: dados relacionados não encontrados.';
    }
    
    if (pgError.message.includes('duplicate key value')) {
      return 'Erro: já existe um registro com estes dados.';
    }
    
    if (pgError.message.includes('not null violation')) {
      return 'Erro: alguns campos obrigatórios não foram preenchidos.';
    }
    
    // Return the original error message for other cases
    return pgError.message || 'Erro no banco de dados';
  }
  
  // Handle standard JavaScript errors
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Fallback for unknown error types
  return 'Erro desconhecido. Tente novamente.';
}