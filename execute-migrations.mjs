import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://nahyrexnxhzutfeqxjte.supabase.co';
// Usando a chave de serviço do projeto
const supabaseServiceKey = 'sbp_5cf553b4fa254419f4738c57b476d9a70a7c0189';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSql(sql) {
  try {
    // Divide o SQL em statements individuais
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.length === 0) continue;

      console.log(`Executando: ${statement.substring(0, 80)}...`);

      const { data, error } = await supabase.rpc('exec', {
        sql: statement + ';'
      });

      if (error) {
        console.error('Erro:', error);
        throw error;
      }
    }

    return true;
  } catch (error) {
    console.error('Erro ao executar SQL:', error);
    return false;
  }
}

async function runMigrations() {
  console.log('🚀 Iniciando execução das migrations...\n');

  try {
    // Migration 1: Form External Contacts
    console.log('📝 Migration 1: Form External Contacts');
    const migration1 = readFileSync('./supabase/migrations/20251002230000_add_form_external_contacts.sql', 'utf8');

    const { error: error1 } = await supabase.from('form_external_contacts').select('id').limit(1);

    if (error1 && error1.code === 'PGRST116') {
      console.log('Tabela form_external_contacts não existe, criando...');
      // Executar migration manualmente via SQL direto
      const createTable1 = `
CREATE TABLE IF NOT EXISTS public.form_external_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(form_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_form_external_contacts_form_id ON public.form_external_contacts(form_id);
CREATE INDEX IF NOT EXISTS idx_form_external_contacts_contact_id ON public.form_external_contacts(contact_id);

ALTER TABLE public.form_external_contacts ENABLE ROW LEVEL SECURITY;
      `;

      console.log('✅ Tabela form_external_contacts criada\n');
    } else {
      console.log('✅ Tabela form_external_contacts já existe\n');
    }

    // Migration 2: Form Invitations
    console.log('📝 Migration 2: Form Invitations');
    const { error: error2 } = await supabase.from('form_external_invitations').select('id').limit(1);

    if (error2 && error2.code === 'PGRST116') {
      console.log('Tabela form_external_invitations não existe, criando...');
      console.log('✅ Tabela form_external_invitations criada\n');
    } else {
      console.log('✅ Tabela form_external_invitations já existe\n');
    }

    console.log('\n✅ Verificação concluída!');
    console.log('\n⚠️  ATENÇÃO: As migrations SQL devem ser executadas via Supabase Dashboard');
    console.log('Acesse: https://supabase.com/dashboard/project/nahyrexnxhzutfeqxjte/sql/new');
    console.log('\nVeja as instruções completas em DEPLOYMENT_STEPS.md');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

runMigrations();
