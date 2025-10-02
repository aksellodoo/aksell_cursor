import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://nahyrexnxhzutfeqxjte.supabase.co';
const supabaseServiceKey = 'sbp_5cf553b4fa254419f4738c57b476d9a70a7c0189';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(filePath, name) {
  console.log(`\n🔄 Executando migration: ${name}...`);

  try {
    const sql = readFileSync(filePath, 'utf8');

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error(`❌ Erro ao executar ${name}:`, error);
      return false;
    }

    console.log(`✅ Migration ${name} executada com sucesso!`);
    return true;
  } catch (err) {
    console.error(`❌ Erro ao ler/executar ${name}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando execução das migrations...\n');

  const migrations = [
    {
      file: join(__dirname, 'supabase/migrations/20251002230000_add_form_external_contacts.sql'),
      name: 'Form External Contacts'
    },
    {
      file: join(__dirname, 'supabase/migrations/20251003000000_create_form_invitations.sql'),
      name: 'Form Invitations'
    }
  ];

  let allSuccess = true;

  for (const migration of migrations) {
    const success = await runMigration(migration.file, migration.name);
    if (!success) {
      allSuccess = false;
      break;
    }
  }

  if (allSuccess) {
    console.log('\n✅ Todas as migrations foram executadas com sucesso!');
  } else {
    console.log('\n❌ Algumas migrations falharam. Verifique os erros acima.');
    process.exit(1);
  }
}

main();
