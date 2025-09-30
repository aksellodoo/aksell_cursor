-- Corrigir avisos de segurança
-- 1. Fixar search_path para a função process_unified_approval (já está correto)
-- 2. Verificar se há extensões no schema public que deveriam estar em outros schemas

-- Verificar extensões existentes no schema public
SELECT schemaname, extname 
FROM pg_extension e 
JOIN pg_namespace n ON e.extnamespace = n.oid 
WHERE n.nspname = 'public';

-- As extensões padrão do Supabase no schema public são esperadas e seguras
-- Não faremos mudanças nas extensões existentes pois são gerenciadas pelo Supabase