// Script para aplicar a correção definitiva do problema de recursão infinita nas políticas RLS
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Credenciais do Supabase
const supabaseUrl = 'https://evakdtqrtpqiuqhetkqr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YWtkdHFydHBxaXVxaGV0a3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNjk1MjQsImV4cCI6MjA1NDk0NTUyNH0.Ms4VB9QGBBcWMZPJ5j5Oanl3RD1SeECp7twFb_riPAI';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Caminho para o arquivo SQL de correção
const SQL_FILE_PATH = path.resolve(__dirname, '../../supabase/migrations/20250406_fix_recursion_definitive.sql');

// Função para executar uma consulta SQL diretamente
async function executarSQL(sql) {
  try {
    // Registrar a migração na tabela de log
    const { data, error } = await supabase
      .from('_migrations_log')
      .insert([
        { 
          sql_executado: sql,
          data_execucao: new Date().toISOString(),
          status: 'pendente'
        }
      ])
      .select();
    
    if (error) {
      console.log('Erro ao registrar migração:', error.message);
      return false;
    }
    
    console.log('SQL registrado com sucesso na tabela _migrations_log');
    console.log('O administrador do banco de dados precisa aprovar e executar esta migração no painel do Supabase.');
    return true;
  } catch (err) {
    console.error('Erro ao executar SQL:', err.message);
    return false;
  }
}

// Função principal
async function main() {
  console.log('Iniciando aplicação da correção definitiva para o problema de recursão infinita nas políticas RLS...');
  
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(SQL_FILE_PATH)) {
      console.error(`Arquivo SQL não encontrado: ${SQL_FILE_PATH}`);
      return;
    }
    
    // Ler conteúdo do arquivo
    const sqlContent = fs.readFileSync(SQL_FILE_PATH, 'utf8');
    console.log(`Conteúdo carregado: ${sqlContent.length} caracteres`);
    
    // Executar SQL
    console.log('Enviando para o Supabase...');
    const resultado = await executarSQL(sqlContent);
    
    if (resultado) {
      console.log(`SUCESSO: Correção registrada para execução`);
      console.log('\nPróximos passos:');
      console.log('1. Acesse o painel do Supabase (SQL Editor)');
      console.log('2. Verifique a tabela _migrations_log para encontrar a migração pendente');
      console.log('3. Execute o SQL manualmente ou atualize o status para "executado" após a execução');
      console.log('\nAlternativamente, você pode usar o comando:');
      console.log('npx supabase db push');
      console.log('para aplicar todas as migrações pendentes, incluindo esta correção.');
    } else {
      console.log(`FALHA: Não foi possível registrar a correção`);
    }
  } catch (err) {
    console.error(`Erro geral: ${err.message}`);
  }
}

// Verificar se a tabela de log existe
async function verificarTabelaLog() {
  try {
    // Verificar se a tabela _migrations_log existe
    const { data, error } = await supabase
      .from('_migrations_log')
      .select('id')
      .limit(1);
    
    if (error) {
      // Tabela não existe, vamos instruir o usuário a criá-la
      console.log('A tabela de log de migrações não existe...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS _migrations_log (
          id SERIAL PRIMARY KEY,
          sql_executado TEXT NOT NULL,
          data_execucao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          status TEXT DEFAULT 'pendente'
        );
      `;
      
      console.log('\nATENÇÃO: Você precisa criar a tabela _migrations_log no Supabase antes de continuar.');
      console.log('Execute o seguinte SQL no painel do Supabase (SQL Editor):');
      console.log(createTableSQL);
      
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Erro ao verificar tabela de log:', err.message);
    return false;
  }
}

// Executar verificação e script principal
async function iniciar() {
  const tabelaExiste = await verificarTabelaLog();
  
  if (tabelaExiste) {
    await main();
  } else {
    console.log('\nCrie a tabela de log no Supabase e execute este script novamente.');
    console.log('Alternativamente, você pode usar o comando:');
    console.log('npx supabase db push');
    console.log('para aplicar todas as migrações pendentes, incluindo esta correção.');
  }
}

iniciar();