import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://nahyrexnxhzutfeqxjte.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2Mzk0ODYsImV4cCI6MjA0MTIxNTQ4Nn0.6dCTNi1rU_9Tp-dN9cz3pOTCMg9KUqH-iyIZqkKBLd8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runMigration() {
  console.log('🔄 Aplicando migration via SQL direto...\n');

  const queries = [
    `ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS allow_delete BOOLEAN NOT NULL DEFAULT true;`,
    `CREATE INDEX IF NOT EXISTS idx_folders_allow_delete ON public.folders(allow_delete);`,
    `COMMENT ON COLUMN public.folders.allow_delete IS 'Determines if this folder can be deleted. If false, folder is protected from deletion across the entire system.';`
  ];

  for (let i = 0; i < queries.length; i++) {
    console.log(`Executando query ${i + 1}/${queries.length}...`);
    console.log(queries[i]);

    try {
      const { error } = await supabase.rpc('exec_sql', {
        query: queries[i]
      });

      if (error) {
        console.log('⚠️  Erro (pode ser esperado se já existir):', error.message);
      } else {
        console.log('✅ Query executada com sucesso!\n');
      }
    } catch (err) {
      console.log('⚠️  Erro ao executar:', err.message);
    }
  }

  console.log('\n✅ Migration concluída!');
  console.log('\n📋 Verificando se a coluna foi criada...');

  // Verificar se a coluna existe
  const { data, error } = await supabase
    .from('folders')
    .select('id, name, allow_delete')
    .limit(1);

  if (error) {
    console.error('❌ Erro ao verificar:', error.message);
    console.log('\n⚠️  A migration precisa ser aplicada manualmente no SQL Editor do Supabase.');
    console.log('📖 Veja instruções em: MIGRATION_MANUAL.md');
  } else {
    console.log('✅ Coluna allow_delete existe e está funcionando!');
    console.log('Dados:', data);
  }
}

runMigration().catch(console.error);
