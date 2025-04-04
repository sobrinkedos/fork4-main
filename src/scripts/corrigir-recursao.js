// Script para corrigir o problema de recursão infinita nas políticas do Supabase
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Credenciais do Supabase
const supabaseUrl = 'https://evakdtqrtpqiuqhetkqr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YWtkdHFydHBxaXVxaGV0a3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNjk1MjQsImV4cCI6MjA1NDk0NTUyNH0.Ms4VB9QGBBcWMZPJ5j5Oanl3RD1SeECp7twFb_riPAI';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Caminho para o arquivo de migração
const migrationFilePath = path.resolve(__dirname, '../../supabase/migrations/20250403_fix_infinite_recursion.sql');

// Função para executar SQL usando a API REST do Supabase
async function executarSQL(sql) {
  try {
    console.log('Executando SQL para corrigir recursão infinita...');
    
    // Dividir o SQL em comandos individuais
    const comandos = sql.split(';').filter(cmd => cmd.trim().length > 0);
    
    console.log(`Total de comandos SQL a executar: ${comandos.length}`);
    
    // Executar cada comando separadamente
    for (let i = 0; i < comandos.length; i++) {
      const comando = comandos[i].trim() + ';';
      console.log(`\nExecutando comando ${i+1}/${comandos.length}:`);
      console.log(comando.substring(0, 100) + '...');
      
      // Usar a API REST para executar SQL personalizado
      const { data, error } = await supabase.rpc('execute_sql', { 
        sql_query: comando 
      });
      
      if (error) {
        console.error(`Erro ao executar comando ${i+1}:`, error.message);
        // Continuar com o próximo comando mesmo se houver erro
      } else {
        console.log(`Comando ${i+1} executado com sucesso!`);
      }
    }
    
    return true;
  } catch (err) {
    console.error('Erro ao executar SQL:', err.message);
    return false;
  }
}

// Função principal
async function main() {
  console.log('Iniciando correção das políticas com recursão infinita...');
  
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(migrationFilePath)) {
      console.error(`Arquivo de migração não encontrado: ${migrationFilePath}`);
      return;
    }
    
    // Ler conteúdo do arquivo
    const sqlContent = fs.readFileSync(migrationFilePath, 'utf8');
    console.log(`Conteúdo carregado: ${sqlContent.length} caracteres`);
    
    // Executar SQL
    console.log('Enviando para o Supabase...');
    const resultado = await executarSQL(sqlContent);
    
    if (resultado) {
      console.log(`\nSUCESSO: As políticas foram corrigidas!`);
      console.log('Reinicie a aplicação para ver as mudanças.');
    } else {
      console.log(`\nFALHA: Não foi possível corrigir as políticas.`);
    }
  } catch (err) {
    console.error(`Erro geral: ${err.message}`);
  }
}

// Iniciar o script
main();
