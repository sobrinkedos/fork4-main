/**
 * Script para comparar tabelas entre o banco de dados de desenvolvimento (domino_dev) e os arquivos de backup
 * 
 * Este script verifica quais tabelas existem no banco de dados de desenvolvimento (domino_dev)
 * e compara com os arquivos de backup exportados do banco de dados de produção (domino)
 * 
 * Uso: node scripts/comparar-tabelas-domino-dev.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurações do Supabase para o ambiente de desenvolvimento
const supabaseDevUrl = 'https://dwsnwsxdkekkaeabiqrw.supabase.co';
const supabaseDevAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3c253c3hka2Vra2FlYWJpcXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNjk1MjQsImV4cCI6MjA1NDk0NTUyNH0.Ms4VB9QGBBcWMZPJ5j5Oanl3RD1SeECp7twFb_riPAI';

// Criar cliente Supabase para o ambiente de desenvolvimento
const supabaseDev = createClient(supabaseDevUrl, supabaseDevAnonKey);

// Diretório para os arquivos temporários (backup)
const TEMP_DIR = path.resolve(__dirname, '../temp');

// Lista de tabelas que foram exportadas do banco de produção (baseado nos arquivos de backup)
const TABELAS_EXPORTADAS = [
  'activities',
  'communities',
  'community_members',
  'community_organizers',
  'competition_members',
  'competitions',
  'games',
  'players',
  'profiles'
];

/**
 * Lista todas as tabelas do banco de dados de desenvolvimento
 */
async function listarTabelasDesenvolvimento() {
  try {
    console.log('Conectando ao Supabase (domino_dev) e buscando tabelas...');
    
    // Consulta para obter todas as tabelas do esquema público
    const { data, error } = await supabaseDev
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
 * Verifica se uma tabela existe no banco de dados de desenvolvimento
 */
async function verificarTabelaExiste(tabela) {
  try {
    // Tentar fazer uma consulta simples na tabela
    const { count, error } = await supabaseDev
      .from(tabela)
      .select('*', { count: 'exact', head: true });
    
    // Se não houver erro, a tabela existe
    return !error;
  } catch (error) {
    return false;
  }
}

/**
 * Função principal para comparar tabelas
 */
async function compararTabelas() {
  try {
    console.log('Comparando tabelas entre o banco de dados de desenvolvimento e os arquivos de backup...');
    console.log(`URL do Supabase (Desenvolvimento): ${supabaseDevUrl}`);
    
    // Listar tabelas do banco de dados de desenvolvimento
    console.log('\nListando tabelas do banco de dados de desenvolvimento...');
    const tabelasDesenvolvimento = await listarTabelasDesenvolvimento();
    
    console.log('\n=== TABELAS NO BANCO DE DADOS DE DESENVOLVIMENTO ===');
    if (tabelasDesenvolvimento.length > 0) {
      console.log(`Encontradas ${tabelasDesenvolvimento.length} tabelas:`);
      tabelasDesenvolvimento.forEach((tabela, index) => {
        console.log(`${index + 1}. ${tabela}`);
      });
    } else {
      console.log('Nenhuma tabela encontrada ou erro ao consultar.');
    }
    
    console.log('\n=== TABELAS EXPORTADAS DO BANCO DE PRODUÇÃO ===');
    console.log(`Encontradas ${TABELAS_EXPORTADAS.length} tabelas exportadas:`);
    TABELAS_EXPORTADAS.forEach((tabela, index) => {
      console.log(`${index + 1}. ${tabela}`);
    });
    
    // Verificar quais tabelas exportadas não existem no banco de desenvolvimento
    console.log('\n=== VERIFICANDO TABELAS NÃO MIGRADAS ===');
    const tabelasNaoMigradas = [];
    
    for (const tabela of TABELAS_EXPORTADAS) {
      const existe = tabelasDesenvolvimento.includes(tabela) || await verificarTabelaExiste(tabela);
      console.log(`Tabela ${tabela}: ${existe ? 'EXISTE' : 'NÃO EXISTE'}`);
      
      if (!existe) {
        tabelasNaoMigradas.push(tabela);
      }
    }
    
    console.log('\n=== RESULTADO DA VERIFICAÇÃO ===');
    
    if (tabelasNaoMigradas.length === 0) {
      console.log('\nTodas as tabelas exportadas foram migradas com sucesso para o banco de desenvolvimento!');
    } else {
      console.log(`\nTabelas que NÃO foram migradas para o banco de desenvolvimento (${tabelasNaoMigradas.length}):`);
      tabelasNaoMigradas.forEach((tabela, index) => {
        console.log(`${index + 1}. ${tabela}`);
      });
      
      console.log('\nPara migrar estas tabelas, execute o script:');
      console.log('node scripts/migrar-tabelas-supabase-melhorado.js');
      console.log('\nCertifique-se de definir as variáveis de ambiente necessárias:');
      console.log('export SUPABASE_PROD_SERVICE_ROLE_KEY=sua_chave_aqui');
      console.log('export SUPABASE_DEV_SERVICE_ROLE_KEY=sua_chave_aqui');
    }
    
  } catch (erro) {
    console.error(`Erro durante a verificação: ${erro.message}`);
    console.error(erro.stack);
  } finally {
    // Encerrar conexão com Supabase
    supabaseDev.auth.signOut();
  }
}

// Executar a função principal
compararTabelas();