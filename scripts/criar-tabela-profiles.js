/**
 * Script para criar a tabela profiles no ambiente de desenvolvimento
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase de desenvolvimento
const supabaseUrl = 'https://dwsnwsxdkekkaeabiqrw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3c253c3hka2Vra2FlYWJpcXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzgxNDYxMiwiZXhwIjoyMDU5MzkwNjEyfQ.7TE_sKGfsDjrz4VL1TfG7ACYJqZpwC822IBT8REJaYM';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Caminho para o arquivo SQL
const sqlPath = path.join(__dirname, '..', 'supabase', 'create-profiles-table.sql');

// Função para executar o SQL
async function criarTabelaProfiles() {
  try {
    console.log('Lendo arquivo SQL...');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('Arquivo SQL lido com sucesso.');
    
    console.log('Executando SQL para criar a tabela profiles...');
    
    // Executar o SQL diretamente usando o método query do PostgreSQL
    const { data, error } = await supabase.rpc('exec_sql', { query: sqlContent });
    
    if (error) {
      console.error('Erro ao executar SQL:', error.message);
      console.error('Detalhes:', error.details || 'Sem detalhes adicionais');
      
      // Tentar abordagem alternativa - criar a tabela manualmente
      console.log('Tentando abordagem alternativa - criar tabela manualmente...');
      await criarTabelaManualmente();
    } else {
      console.log('Tabela profiles criada com sucesso!');
    }
  } catch (erro) {
    console.error('Erro ao criar tabela profiles:', erro.message);
    console.error('Tentando abordagem alternativa...');
    await criarTabelaManualmente();
  }
}

// Função para criar a tabela manualmente
async function criarTabelaManualmente() {
  try {
    console.log('Criando tabela profiles manualmente...');
    
    // SQL para criar a tabela profiles
    const createTableSQL = `
      -- Remover tabela se existir
      DROP TABLE IF EXISTS profiles;

      -- Criar tabela de perfis
      CREATE TABLE profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );

      -- Habilitar RLS
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

      -- Criar políticas de segurança
      CREATE POLICY "profiles_select_policy"
      ON profiles FOR SELECT
      USING (true);

      CREATE POLICY "profiles_insert_policy"
      ON profiles FOR INSERT
      WITH CHECK (true);

      CREATE POLICY "profiles_update_policy"
      ON profiles FOR UPDATE
      USING (auth.uid() = id);
    `;
    
    // Executar o SQL
    const { error } = await supabase.rpc('exec_sql', { query: createTableSQL });
    
    if (error) {
      console.error('Erro ao criar tabela manualmente:', error.message);
      console.error('Detalhes:', error.details || 'Sem detalhes adicionais');
    } else {
      console.log('Tabela profiles criada manualmente com sucesso!');
    }
  } catch (erro) {
    console.error('Erro ao criar tabela manualmente:', erro.message);
  }
}

// Executar a função principal
criarTabelaProfiles().then(() => {
  console.log('Processo concluído.');
}).catch(erro => {
  console.error('Erro no processo:', erro.message);
});