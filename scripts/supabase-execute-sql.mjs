#!/usr/bin/env node
/**
 * Script para executar SQL diretamente no Supabase via Management API
 *
 * Uso: node scripts/supabase-execute-sql.mjs "SELECT * FROM tasks LIMIT 1;"
 * Ou: node scripts/supabase-execute-sql.mjs < migration-file.sql
 */

import { readFileSync } from 'fs';

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_5cf553b4fa254419f4738c57b476d9a70a7c0189';
const PROJECT_ID = 'nahyrexnxhzutfeqxjte';

async function executeSQL(query) {
  try {
    console.log('🔧 Executando SQL no Supabase...\n');

    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro ao executar SQL:');
      console.error(JSON.stringify(result, null, 2));
      process.exit(1);
    }

    console.log('✅ SQL executado com sucesso!');
    console.log('\n📊 Resultado:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
  // Tentar ler do stdin
  if (process.stdin.isTTY) {
    console.error('❌ Erro: Nenhuma query fornecida');
    console.error('\nUso:');
    console.error('  node scripts/supabase-execute-sql.mjs "SELECT * FROM tasks;"');
    console.error('  cat migration.sql | node scripts/supabase-execute-sql.mjs');
    process.exit(1);
  } else {
    // Ler do stdin
    const stdin = readFileSync(0, 'utf-8');
    executeSQL(stdin);
  }
} else {
  // Usar argumento da linha de comando
  const query = args.join(' ');
  executeSQL(query);
}
