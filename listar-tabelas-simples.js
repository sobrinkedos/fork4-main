/**
 * Script simples para listar tabelas no Supabase e verificar arquivos de backup
 * 
 * Este script usa uma abordagem mais direta para listar tabelas no Supabase
 * e verificar quais arquivos de backup existem na pasta temp
 * 
 * Uso: node listar-tabelas-simples.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurações do Supabase (usando as mesmas credenciais do supabaseMCP.ts)
const supabaseUrl = 'https://evakdtqrtpqiuqhetkqr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YWtkdHFydHBxaXVxaGV0a3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNjk1MjQsImV4cCI6MjA1NDk0NTUyNH0.Ms4VB9QGBBcWMZPJ5j5Oanl3RD1SeECp7twFb_riPAI';

// URL do projeto de desenvolvimento
const supabaseDevUrl = 'https://dwsnwsxdkekkaeabiqrw.supabase.co';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Diretório para os arquivos temporários
const TEMP_DIR = path.resolve(__dirname, 'temp');

/**
 * Lista todas as tabelas do banco de dados atual usando uma abordagem mais simples
 */
async function listarTabelasAtuais() {
  try {
    console.log('Conectando ao Supabase e buscando tabelas...');
    
    // Consulta para obter todas as tabelas do esquema público
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .not('tablename', 'like', 'pg_%')
      .not('tablename', 'like', '_prisma_%')
      .not('tablename', 'like', '_migrations%');
    
    if (error) {
      console.error('Erro ao consultar tabelas:', error.message);
      return [];
    }
    
    if (data && data.length > 0) {
      return data.map(table => table.tablename);
    } else {
      console.log('Nenhuma tabela encontrada no esquema público.');
      return [];
    }
    
  } catch (error) {
    console.error('Erro ao listar tabelas:', error.message);
    return [];
  }
}

/**
 * Verifica quais tabelas existem no arquivo de backup (temp directory)
 */
function verificarTabelasBackup() {
  try {
    // Verificar se o diretório existe
    if (!fs.existsSync(TEMP_DIR)) {
      console.log('Diretório de backup não encontrado:', TEMP_DIR);
      return [];
    }
    
    // Listar arquivos no diretório
    const arquivos = fs.readdirSync(TEMP_DIR);
    
    // Filtrar apenas arquivos JSON
    const arquivosJson = arquivos.filter(arquivo => arquivo.endsWith('.json'));
    
    // Extrair nomes das tabelas (removendo a extensão .json)
    const tabelasBackup = arquivosJson.map(arquivo => arquivo.replace('.json', ''));
    
    return tabelasBackup;
  } catch (erro) {
    console.error('Erro ao verificar tabelas de backup:', erro.message);
    return [];
  }
}

/**
 * Função principal para verificar tabelas
 */
async function verificarTabelas() {
  try {
    console.log('Verificando tabelas no banco de dados e arquivos de backup...');
    console.log(`URL do Supabase (Produção): ${supabaseUrl}`);
    console.log(`URL do Supabase (Desenvolvimento): ${supabaseDevUrl}`);
    
    // Listar tabelas do banco de dados atual
    console.log('\nListando tabelas do banco de dados atual...');
    const tabelasAtuais = await listarTabelasAtuais();
    
    // Verificar tabelas que foram exportadas para backup
    console.log('\nVerificando tabelas que foram exportadas para backup...');
    const tabelasBackup = verificarTabelasBackup();
    
    console.log('\n=== TABELAS NO BANCO DE DADOS ATUAL (PRODUÇÃO) ===');
    if (tabelasAtuais.length > 0) {
      console.log(`Encontradas ${tabelasAtuais.length} tabelas:`);
      tabelasAtuais.forEach((tabela, index) => {
        console.log(`${index + 1}. ${tabela}`);
      });
    } else {
      console.log('Nenhuma tabela encontrada ou erro ao consultar.');
    }
    
    console.log('\n=== TABELAS EXPORTADAS PARA BACKUP ===');
    if (tabelasBackup.length > 0) {
      console.log(`Encontradas ${tabelasBackup.length} tabelas no backup:`);
      tabelasBackup.forEach((tabela, index) => {
        console.log(`${index + 1}. ${tabela}`);
      });
    } else {
      console.log('Nenhum arquivo de backup encontrado.');
    }
    
    // Verificar quais tabelas do backup não existem no banco atual
    if (tabelasAtuais.length > 0 && tabelasBackup.length > 0) {
      const tabelasNaoMigradas = tabelasBackup.filter(tabela => !tabelasAtuais.includes(tabela));
      
      console.log('\n=== RESULTADO DA VERIFICAÇÃO ===');
      
      if (tabelasNaoMigradas.length === 0) {
        console.log('\nTodas as tabelas do backup existem no banco de dados atual!');
      } else {
        console.log(`\nTabelas que existem no backup mas NÃO no banco atual (${tabelasNaoMigradas.length}):`);
        tabelasNaoMigradas.forEach((tabela, index) => {
          console.log(`${index + 1}. ${tabela}`);
        });
      }
    }
    
    console.log('\n=== INFORMAÇÕES IMPORTANTES ===');
    console.log('1. Este script está verificando o banco de dados de produção (domino).');
    console.log('2. Para verificar o banco de desenvolvimento (domino_dev), é necessário');
    console.log('   modificar o script para usar as credenciais corretas do ambiente de desenvolvimento.');
    console.log('3. O problema de migração pode estar relacionado a:');
    console.log('   - Falta das variáveis de ambiente SUPABASE_PROD_SERVICE_ROLE_KEY e SUPABASE_DEV_SERVICE_ROLE_KEY');
    console.log('   - Problemas de permissão no banco de dados de desenvolvimento');
    console.log('   - Erros durante o processo de migração');
    console.log('\n4. Para executar a migração corretamente, você precisa:');
    console.log('   - Definir as variáveis de ambiente necessárias:');
    console.log('     export SUPABASE_PROD_SERVICE_ROLE_KEY=sua_chave_aqui');
    console.log('     export SUPABASE_DEV_SERVICE_ROLE_KEY=sua_chave_aqui');
    console.log('   - Executar o script de migração:');
    console.log('     node scripts/migrar-tabelas-supabase-melhorado.js');
    
  } catch (erro) {
    console.error(`Erro durante a verificação: ${erro.message}`);
    console.error(erro.stack);
  } finally {
    // Encerrar conexão com Supabase
    supabase.auth.signOut();
  }
}

// Executar a função principal
verificarTabelas();