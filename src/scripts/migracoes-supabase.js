// Script simplificado para executar migrações SQL no Supabase
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
        const { data, error } = await supabase.rpc('exec_sql', { query: sqlContent });
        
        if (error) {
          console.error(`ERRO: ${error.message}`);
        } else {
          console.log(`SUCESSO: Arquivo ${file} executado`);
        }
      } catch (err) {
        console.error(`ERRO ao processar ${file}: ${err.message}`);
      }
    }
    
    console.log('\nProcessamento concluído.');
  } catch (err) {
    console.error(`Erro geral: ${err.message}`);
  }
}

// Executar script
main();
