/**
 * Script para gerenciar branches do Supabase para ambientes de desenvolvimento e produção
 * 
 * Uso: node scripts/supabase-branch-manager.js [create|sync|merge] [dev|prod]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Obter os argumentos da linha de comando
const args = process.argv.slice(2);
const action = args[0]; // create, sync, merge
const env = args[1] || 'dev'; // dev, prod

// Validar os argumentos
if (!action || (action !== 'create' && action !== 'sync' && action !== 'merge')) {
  console.error('Erro: A ação deve ser "create", "sync" ou "merge"');
  console.log('Uso: node scripts/supabase-branch-manager.js [create|sync|merge] [dev|prod]');
  process.exit(1);
}

if (env !== 'dev' && env !== 'prod') {
  console.error('Erro: O ambiente deve ser "dev" ou "prod"');
  console.log('Uso: node scripts/supabase-branch-manager.js [create|sync|merge] [dev|prod]');
  process.exit(1);
}

// Configurações
const DEV_BRANCH = 'development';
const PROD_BRANCH = 'main';

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

// Função para verificar se o branch existe
function branchExists(branchName) {
  try {
    const output = execSync('npx supabase db branch list', { encoding: 'utf8' });
    return output.includes(branchName);
  } catch (error) {
    console.error(`Erro ao verificar branches: ${error.message}`);
    return false;
  }
}

// Função para criar um branch de desenvolvimento
function createDevBranch() {
  if (branchExists(DEV_BRANCH)) {
    console.log(`O branch ${DEV_BRANCH} já existe.`);
    return;
  }
  
  console.log(`Criando branch de desenvolvimento (${DEV_BRANCH})...`);
  runSupabaseCommand(`db branch create ${DEV_BRANCH}`);
  console.log(`Branch ${DEV_BRANCH} criado com sucesso!`);
  
  // Obter a chave anônima do branch de desenvolvimento
  console.log('Obtendo chave anônima do branch de desenvolvimento...');
  console.log('IMPORTANTE: Anote a chave anônima do branch e atualize o arquivo .env.development');
}

// Função para sincronizar o branch de desenvolvimento com o branch principal
function syncDevBranch() {
  if (!branchExists(DEV_BRANCH)) {
    console.error(`O branch ${DEV_BRANCH} não existe. Crie-o primeiro com a ação 'create'.`);
    process.exit(1);
  }
  
  console.log(`Sincronizando o branch ${DEV_BRANCH} com o branch principal (${PROD_BRANCH})...`);
  runSupabaseCommand(`db branch refresh ${DEV_BRANCH}`);
  console.log(`Branch ${DEV_BRANCH} sincronizado com sucesso!`);
}

// Função para mesclar alterações do branch de desenvolvimento para o branch principal
function mergeDevBranch() {
  if (!branchExists(DEV_BRANCH)) {
    console.error(`O branch ${DEV_BRANCH} não existe. Crie-o primeiro com a ação 'create'.`);
    process.exit(1);
  }
  
  // Verificar conflitos antes de mesclar
  console.log(`Verificando conflitos entre ${DEV_BRANCH} e ${PROD_BRANCH}...`);
  const conflictsOutput = runSupabaseCommand(`db branch conflicts ${DEV_BRANCH}`);
  
  if (conflictsOutput.includes('Conflicts found')) {
    console.error('Foram encontrados conflitos que precisam ser resolvidos antes de mesclar.');
    console.log('Revise os conflitos e resolva-os manualmente.');
    process.exit(1);
  }
  
  console.log(`Mesclando alterações do branch ${DEV_BRANCH} para o branch principal (${PROD_BRANCH})...`);
  runSupabaseCommand(`db branch merge ${DEV_BRANCH}`);
  console.log(`Alterações do branch ${DEV_BRANCH} mescladas com sucesso para o branch principal!`);
}

// Executar a ação solicitada
switch (action) {
  case 'create':
    if (env === 'dev') {
      createDevBranch();
    } else {
      console.error('A ação "create" só é válida para o ambiente de desenvolvimento.');
      process.exit(1);
    }
    break;
  case 'sync':
    if (env === 'dev') {
      syncDevBranch();
    } else {
      console.error('A ação "sync" só é válida para o ambiente de desenvolvimento.');
      process.exit(1);
    }
    break;
  case 'merge':
    if (env === 'dev') {
      mergeDevBranch();
    } else {
      console.error('A ação "merge" só é válida para o ambiente de desenvolvimento.');
      process.exit(1);
    }
    break;
  default:
    console.error(`Ação desconhecida: ${action}`);
    process.exit(1);
}