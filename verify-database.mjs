import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nahyrexnxhzutfeqxjte.supabase.co';
const supabaseServiceKey = 'sbp_5cf553b4fa254419f4738c57b476d9a70a7c0189';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyDatabase() {
  console.log('🔍 Verificando estrutura do banco de dados...\n');

  try {
    // Verificar tabela form_external_contacts
    console.log('📋 Tabela: form_external_contacts');
    const { data: contacts, error: contactsError } = await supabase
      .from('form_external_contacts')
      .select('*')
      .limit(1);

    if (contactsError) {
      console.log('  ❌ Erro:', contactsError.message);
    } else {
      console.log('  ✅ Tabela acessível');
      console.log('  📊 Estrutura esperada: id, form_id, contact_id, created_at, created_by');
    }

    // Verificar tabela form_external_invitations
    console.log('\n📋 Tabela: form_external_invitations');
    const { data: invitations, error: invitationsError } = await supabase
      .from('form_external_invitations')
      .select('*')
      .limit(1);

    if (invitationsError) {
      console.log('  ❌ Erro:', invitationsError.message);
    } else {
      console.log('  ✅ Tabela acessível');
      console.log('  📊 Estrutura esperada:');
      console.log('     - id, form_id, contact_id');
      console.log('     - send_via_email, send_via_whatsapp, send_via_telegram');
      console.log('     - email_sent_at, whatsapp_sent_at, telegram_sent_at');
      console.log('     - form_access_token (UNIQUE)');
      console.log('     - responded_at, response_id');
      console.log('     - created_at, created_by, updated_at');
    }

    // Verificar se consegue inserir um registro de teste (e depois deletar)
    console.log('\n🧪 Testando inserção (será revertida)...');

    // Primeiro precisa de um form_id e contact_id válidos
    const { data: forms } = await supabase
      .from('forms')
      .select('id')
      .limit(1);

    const { data: contactsList } = await supabase
      .from('contacts')
      .select('id')
      .limit(1);

    if (forms && forms.length > 0 && contactsList && contactsList.length > 0) {
      const testInvitation = {
        form_id: forms[0].id,
        contact_id: contactsList[0].id,
        send_via_email: true,
        form_access_token: crypto.randomUUID(),
      };

      const { data: inserted, error: insertError } = await supabase
        .from('form_external_invitations')
        .insert(testInvitation)
        .select();

      if (insertError) {
        if (insertError.code === '23505') {
          console.log('  ⚠️  Convite já existe (esperado se já testado antes)');
        } else {
          console.log('  ❌ Erro ao inserir:', insertError.message);
        }
      } else {
        console.log('  ✅ Inserção bem-sucedida!');

        // Deletar o registro de teste
        const { error: deleteError } = await supabase
          .from('form_external_invitations')
          .delete()
          .eq('id', inserted[0].id);

        if (deleteError) {
          console.log('  ⚠️  Erro ao deletar teste:', deleteError.message);
        } else {
          console.log('  ✅ Registro de teste removido');
        }
      }
    } else {
      console.log('  ⚠️  Não há forms ou contacts para teste');
    }

    console.log('\n✅ Verificação concluída!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Deploy da edge function send-form-invitation');
    console.log('   2. Testar o fluxo completo de envio de convites');

  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

verifyDatabase();
