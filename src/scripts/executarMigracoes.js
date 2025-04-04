// Script para executar migrações SQL no Supabase
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Credenciais do Supabase (as mesmas usadas no supabaseMCP.ts)
const supabaseUrl = 'https://evakdtqrtpqiuqhetkqr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YWtkdHFydHBxaXVxaGV0a3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNjk1MjQsImV4cCI6MjA1NDk0NTUyNH0.Ms4VB9QGBBcWMZPJ5j5Oanl3RD1SeECp7twFb_riPAI';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Diretório onde estão os arquivos de migração
const MIGRATIONS_DIR = path.resolve(__dirname, '../../supabase/migrations');

/**
 * Função para executar um arquivo SQL no Supabase
 * @param {string} filePath Caminho completo para o arquivo SQL
 */
async function executarArquivoSQL(filePath) {
  try {
    console.log(`Executando arquivo: ${path.basename(filePath)}`);
    
    // Lê o conteúdo do arquivo SQL
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Executa o SQL usando o cliente Supabase
    const { error } = await supabase.rpc('exec_sql', {
      query: sqlContent
    });
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Arquivo ${path.basename(filePath)} executado com sucesso!`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao executar ${path.basename(filePath)}:`, error);
    return false;
  }
}

/**
 * Função para executar todos os arquivos SQL de migração
 * @param {boolean} apenasUltimos Se true, executa apenas os arquivos mais recentes (últimos 5)
 */
async function executarMigracoes(apenasUltimos = true) {
  try {
    // Verifica se o diretório de migrações existe
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      throw new Error(`Diretório de migrações não encontrado: ${MIGRATIONS_DIR}`);
    }
    
    // Lista todos os arquivos SQL no diretório de migrações
    let arquivosSQL = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ordena alfabeticamente (geralmente por data se os arquivos seguem o padrão YYYYMMDD_)
    
    // Se apenasUltimos for true, pega apenas os 5 arquivos mais recentes
    if (apenasUltimos && arquivosSQL.length > 5) {
      arquivosSQL = arquivosSQL.slice(-5);
      console.log('Executando apenas os 5 arquivos mais recentes...');
    }
    
    if (arquivosSQL.length === 0) {
      console.log('Nenhum arquivo SQL encontrado para migração.');
      return;
    }
    
    console.log(`Encontrados ${arquivosSQL.length} arquivos SQL para execução.`);
    
    // Executa cada arquivo SQL em sequência
    let sucessos = 0;
    let falhas = 0;
    
    for (const arquivo of arquivosSQL) {
      const caminhoArquivo = path.join(MIGRATIONS_DIR, arquivo);
      const resultado = await executarArquivoSQL(caminhoArquivo);
      
      if (resultado) {
        sucessos++;
      } else {
        falhas++;
      }
    }
    
    console.log('\n===== RESUMO DA EXECUÇÃO =====');
    console.log(`Total de arquivos: ${arquivosSQL.length}`);
    console.log(`Executados com sucesso: ${sucessos}`);
    console.log(`Falhas: ${falhas}`);
    
    if (falhas === 0) {
      console.log('\n✅ Todas as migrações foram executadas com sucesso!');
    } else {
      console.log('\n⚠️ Algumas migrações falharam. Verifique os erros acima.');
    }
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
    process.exit(1);
  }
}

// Verifica os argumentos da linha de comando
const apenasUltimos = !process.argv.includes('--todos');

// Executa as migrações
console.log('Iniciando execução das migrações SQL no Supabase...');
console.log(`Modo: ${apenasUltimos ? 'Apenas últimos 5 arquivos' : 'Todos os arquivos'}`);
console.log('-------------------------------------------\n');

executarMigracoes(apenasUltimos);
