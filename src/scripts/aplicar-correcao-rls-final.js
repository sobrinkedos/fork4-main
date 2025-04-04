/**
 * Script para aplicar a correção definitiva do problema de recursão infinita nas políticas RLS
 * Este script executa o arquivo SQL que corrige as políticas problemáticas
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Porta para conexão direta com o PostgreSQL
const pgPort = 54323;

// Inicializar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Caminho para o arquivo SQL de correção
const sqlFilePath = path.join(__dirname, '..', '..', 'supabase', 'migrations', '20250407_fix_recursion_final_solution.sql');

async function aplicarCorrecao() {
  try {
    console.log('Iniciando aplicação da correção definitiva para o problema de recursão infinita nas políticas RLS...');
    
    // Ler o arquivo SQL
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('Arquivo SQL carregado com sucesso.');
    
    // Executar o SQL usando psql diretamente
    console.log('Executando SQL no banco de dados PostgreSQL local...');
    
    try {
      // Criar um arquivo temporário com o conteúdo SQL
      const tempSqlFile = path.join(__dirname, 'temp_correction.sql');
      fs.writeFileSync(tempSqlFile, sqlContent, 'utf8');
      
      // Executar o SQL usando psql
      const connectionString = `postgresql://postgres:postgres@localhost:${pgPort}/postgres`;
      const command = `psql "${connectionString}" -f "${tempSqlFile}"`;
      
      console.log(`Executando comando: ${command}`);
      const output = execSync(command, { encoding: 'utf8' });
      console.log('Saída do comando SQL:');
      console.log(output);
      
      // Remover o arquivo temporário
      fs.unlinkSync(tempSqlFile);
      
      console.log('Correção aplicada com sucesso!');
    } catch (execError) {
      console.error('Erro ao executar SQL via psql:', execError.message);
      console.log('Tentando método alternativo...');
      
      // Método alternativo usando o CLI do Supabase
      try {
        // Salvar o SQL em um arquivo temporário
        const tempSqlFile = path.join(__dirname, 'temp_correction.sql');
        fs.writeFileSync(tempSqlFile, sqlContent, 'utf8');
        
        // Executar o comando supabase db reset
        console.log('Executando supabase db reset...');
        execSync(`npx supabase db reset --db-url postgresql://postgres:postgres@localhost:${pgPort}/postgres`);
        
        // Executar o SQL usando o comando psql
        console.log('Executando SQL via psql...');
        execSync(`psql "postgresql://postgres:postgres@localhost:${pgPort}/postgres" -f "${tempSqlFile}"`);
        
        // Remover o arquivo temporário
        fs.unlinkSync(tempSqlFile);
        
        console.log('Correção aplicada com sucesso via método alternativo!');
      } catch (altError) {
        console.error('Erro ao aplicar correção via método alternativo:', altError.message);
        throw altError;
      }
    }
    
    console.log('\nVerificando políticas atualizadas...');
    
    // Verificar políticas atualizadas usando psql
    try {
      const checkPoliciesCommand = `psql "postgresql://postgres:postgres@localhost:${pgPort}/postgres" -c "SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('communities', 'community_organizers', 'community_members');"`;
      const policiesOutput = execSync(checkPoliciesCommand, { encoding: 'utf8' });
      
      console.log('Políticas atualizadas:');
      console.log(policiesOutput);
    } catch (verifyError) {
      console.warn('Aviso: Erro ao verificar políticas:', verifyError.message);
    }
    
    // Registrar a migração no log (se a tabela existir)
    try {
      const migrationName = '20250407_fix_recursion_final_solution';
      console.log(`Tentando registrar a migração '${migrationName}' no log...`);
      
      // Verificar se a tabela _migrations_log existe usando psql
      const checkTableCommand = `psql "postgresql://postgres:postgres@localhost:${pgPort}/postgres" -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '_migrations_log')" -t`;
      const tableExists = execSync(checkTableCommand, { encoding: 'utf8' }).trim() === 't';
      
      if (!tableExists) {
        console.log('A tabela _migrations_log não existe. Criando tabela...');
        
        // Criar a tabela _migrations_log
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS _migrations_log (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TIMESTAMP WITH TIME ZONE NOT NULL,
            success BOOLEAN NOT NULL DEFAULT TRUE
          );
        `;
        
        const createTableCommand = `psql "postgresql://postgres:postgres@localhost:${pgPort}/postgres" -c "${createTableSQL}"`;
        execSync(createTableCommand);
        console.log('Tabela _migrations_log criada com sucesso.');
      }
      
      // Inserir o registro da migração
      const insertLogCommand = `psql "postgresql://postgres:postgres@localhost:${pgPort}/postgres" -c "INSERT INTO _migrations_log (name, applied_at, success) VALUES ('${migrationName}', NOW(), TRUE);"`;
      execSync(insertLogCommand);
      console.log(`Migração '${migrationName}' registrada no log com sucesso.`);
    } catch (logError) {
      console.warn('Aviso: Erro ao tentar registrar a migração no log:', logError.message);
      console.log('Continuando sem registrar a migração no log...');
    }
    
  } catch (error) {
    console.error('Erro ao aplicar correção:', error);
    process.exit(1);
  }
}

// Executar a função principal
aplicarCorrecao();