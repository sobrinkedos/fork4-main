/**
 * Script para verificar quais tabelas não foram migradas entre os projetos Supabase
 * 
 * Este script usa a biblioteca supabaseMCP que já está configurada no projeto
 * para listar as tabelas em ambos os ambientes e comparar
 * 
 * Uso: node verificar-tabelas-nao-migradas.js
 */

// Importar a biblioteca supabaseMCP que já está configurada no projeto
const { supabaseMCP } = require('./src/lib/supabaseMCP');

// Configurações dos projetos Supabase
const PROJETOS = {
  producao: {
    nome: 'domino',
    url: 'https://evakdtqrtpqiuqhetkqr.supabase.co'
  },
  desenvolvimento: {
    nome: 'domino_dev',
    url: 'https://dwsnwsxdkekkaeabiqrw.supabase.co'
  }
};

/**
 * Lista todas as tabelas do projeto usando a biblioteca supabaseMCP
 */
async function listarTabelas() {
  try {
    console.log('Conectando ao Supabase e buscando tabelas...');
    
    // Consulta para obter todas as tabelas do esquema público
    const { data, error } = await supabaseMCP
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .not('tablename', 'like', 'pg_%')
      .not('tablename', 'like', 'auth_%')
      .not('tablename', 'like', 'storage_%')
      .order('tablename');
    
    if (error) {
      throw error;
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
async function verificarTabelasBackup() {
  const fs = require('fs');
  const path = require('path');
  
  // Diretório para armazenar os arquivos temporários
  const TEMP_DIR = path.resolve(__dirname, 'temp');
  
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
    console.log('Verificando tabelas entre projetos Supabase...');
    console.log(`Produção: ${PROJETOS.producao.nome} (${PROJETOS.producao.url})`);
    console.log(`Desenvolvimento: ${PROJETOS.desenvolvimento.nome} (${PROJETOS.desenvolvimento.url})`);
    
    // Listar tabelas do banco de dados atual (usando supabaseMCP)
    console.log('\nListando tabelas do banco de dados atual...');
    const tabelasAtuais = await listarTabelas();
    
    if (tabelasAtuais.length === 0) {
      console.error('Nenhuma tabela encontrada no banco de dados atual.');
      return;
    }
    
    console.log(`\nTabelas encontradas no banco atual (${tabelasAtuais.length}):`);
    tabelasAtuais.forEach((tabela, index) => {
      console.log(`${index + 1}. ${tabela}`);
    });
    
    // Verificar tabelas que foram exportadas para backup
    console.log('\nVerificando tabelas que foram exportadas para backup...');
    const tabelasBackup = await verificarTabelasBackup();
    
    console.log(`\nTabelas encontradas no backup (${tabelasBackup.length}):`);
    tabelasBackup.forEach((tabela, index) => {
      console.log(`${index + 1}. ${tabela}`);
    });
    
    // Verificar quais tabelas não foram migradas
    const tabelasNaoMigradas = tabelasBackup.filter(tabela => !tabelasAtuais.includes(tabela));
    
    console.log('\n=== RESULTADO DA VERIFICAÇÃO ===');
    
    if (tabelasNaoMigradas.length === 0) {
      console.log('\nTodas as tabelas do backup existem no banco de dados atual!');
    } else {
      console.log(`\nTabelas que NÃO foram migradas (${tabelasNaoMigradas.length}):`);
      tabelasNaoMigradas.forEach((tabela, index) => {
        console.log(`${index + 1}. ${tabela}`);
      });
      
      console.log('\nPara migrar estas tabelas, execute o script:');
      console.log('node scripts/migrar-tabelas-supabase-melhorado.js');
    }
    
    // Verificar tabelas extras no ambiente atual
    const tabelasExtras = tabelasAtuais.filter(tabela => !tabelasBackup.includes(tabela));
    
    if (tabelasExtras.length > 0) {
      console.log(`\nTabelas que existem APENAS no banco atual (${tabelasExtras.length}):`);
      tabelasExtras.forEach((tabela, index) => {
        console.log(`${index + 1}. ${tabela}`);
      });
    }
    
  } catch (erro) {
    console.error(`Erro durante a verificação: ${erro.message}`);
    console.error(erro.stack);
  }
}

// Executar a função principal
verificarTabelas();