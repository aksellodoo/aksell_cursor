// Script para testar manualmente as notificações
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://nahyrexnxhzutfeqxjte.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNotifications() {
  console.log('🧪 Testando notificações manualmente...');
  
  try {
    const { data, error } = await supabase.functions.invoke('test-notifications', {
      body: {}
    });

    if (error) {
      console.error('❌ Erro:', error);
      return;
    }

    console.log('✅ Resultado:', data);
  } catch (err) {
    console.error('💥 Erro de execução:', err);
  }
}

testNotifications();