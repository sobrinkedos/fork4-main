/**
 * Script para gerar migrações do Supabase
 * 
 * Uso: node scripts/supabase-migration-generator.js [nome-da-migracao]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Obter os argumentos da linha de comando
const args = process.argv.slice(2);
const migrationName = args[0];

// Validar os argumentos
if (!migrationName) {
  console.error('Erro: É necessário fornecer um nome para a migração');
  console.log('Uso: node scripts/supabase-migration-generator.js [nome-da-migracao]');
  process.exit(1);
}

// Função para executar comandos do Supabase CLI
function runSupabaseCommand(command) {
  try {
    console.log(`Executando: npx supabase ${command}`);
    const output = execSync(`npx supabase ${command}`, { encoding: 'utf8' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Erro ao executar comando: ${error.message}`);
    console.error(error.stdout);
    console.error(error.stderr);
    process.exit(1);
  }
}

// Função para gerar uma migração
function generateMigration(name) {
  console.log(`Gerando migração: ${name}...`);
  
  // Verificar se estamos no ambiente de desenvolvimento
  const envFile = fs.readFileSync(path.resolve(__dirname, '..', '.env'), 'utf8');
  if (!envFile.includes('EXPO_PUBLIC_SUPABASE_BRANCH=development')) {
    console.error('Erro: Você deve estar no ambiente de desenvolvimento para gerar migrações.');
    console.log('Execute "npm run env:dev" antes de gerar migrações.');
    process.exit(1);
  }
  
  // Gerar a migração
  runSupabaseCommand(`db diff -f ${name}`);
  
  // Verificar se a migração foi gerada
  const migrationsDir = path.resolve(__dirname, '..', 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir);
  const migrationFile = files.find(file => file.includes(name));
  
  if (migrationFile) {
    console.log(`Migração gerada com sucesso: ${migrationFile}`);
    console.log('\nPróximos passos:');
    console.log('1. Revise o arquivo de migração gerado');
    console.log('2. Teste as alterações no ambiente de desenvolvimento');
    console.log('3. Quando estiver pronto para aplicar em produção, execute:');
    console.log('   npm run env:prod');
    console.log('   npx supabase db push');
  } else {
    console.error('Não foi possível encontrar o arquivo de migração gerado.');
    console.log('Verifique se houve alterações no esquema do banco de dados.');
  }
}

// Executar a geração de migração
generateMigration(migrationName);