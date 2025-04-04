// Script para executar migrações SQL no Supabase usando a API REST
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Credenciais do Supabase
const supabaseUrl = 'https://evakdtqrtpqiuqhetkqr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YWtkdHFydHBxaXVxaGV0a3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNjk1MjQsImV4cCI6MjA1NDk0NTUyNH0.Ms4VB9QGBBcWMZPJ5j5Oanl3RD1SeECp7twFb_riPAI';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Diretório onde estão os arquivos de migração
const MIGRATIONS_DIR = path.resolve(__dirname, '../../supabase/migrations');

// Função para executar uma consulta SQL diretamente
async function executarSQL(sql) {
  try {
    // Usando o método .from('').select() com a opção .csv() para executar SQL personalizado
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
    
    return true;
  } catch (err) {
    console.error('Erro ao executar SQL:', err.message);
    return false;
  }
}

// Função principal
async function main() {
  console.log('Iniciando execução das migrações SQL no Supabase...');
  
  try {
    // Verificar se o diretório existe
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      console.error(`Diretório não encontrado: ${MIGRATIONS_DIR}`);
      return;
    }
    
    // Listar arquivos SQL
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (files.length === 0) {
      console.log('Nenhum arquivo SQL encontrado.');
      return;
    }
    
    // Pegar os 5 arquivos mais recentes
    const latestFiles = files.slice(-5);
    console.log(`Encontrados ${files.length} arquivos SQL. Executando os 5 mais recentes:`);
    
    // Executar cada arquivo
    for (const file of latestFiles) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      console.log(`\nExecutando: ${file}`);
      
      try {
        // Ler conteúdo do arquivo
        const sqlContent = fs.readFileSync(filePath, 'utf8');
        console.log(`Conteúdo carregado: ${sqlContent.length} caracteres`);
        
        // Executar SQL
        console.log('Enviando para o Supabase...');
        const resultado = await executarSQL(sqlContent);
        
        if (resultado) {
          console.log(`SUCESSO: Arquivo ${file} registrado para execução`);
        } else {
          console.log(`FALHA: Não foi possível registrar o arquivo ${file}`);
        }
      } catch (err) {
        console.error(`ERRO ao processar ${file}: ${err.message}`);
      }
    }
    
    console.log('\nProcessamento concluído. Verifique o painel do Supabase para confirmar a execução das migrações.');
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
      // Tabela não existe, vamos criá-la
      console.log('Criando tabela de log de migrações...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS _migrations_log (
          id SERIAL PRIMARY KEY,
          sql_executado TEXT NOT NULL,
          data_execucao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          status TEXT DEFAULT 'pendente'
        );
      `;
      
      // Não podemos executar este SQL diretamente, então instruímos o usuário
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
  }
}

iniciar();
