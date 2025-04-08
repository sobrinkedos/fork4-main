/**
 * Script para criar a tabela profiles diretamente no ambiente de desenvolvimento
 * usando a API REST do Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase de desenvolvimento
const supabaseUrl = 'https://dwsnwsxdkekkaeabiqrw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3c253c3hka2Vra2FlYWJpcXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzgxNDYxMiwiZXhwIjoyMDU5MzkwNjEyfQ.7TE_sKGfsDjrz4VL1TfG7ACYJqZpwC822IBT8REJaYM';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para criar a tabela profiles diretamente
async function criarTabelaProfiles() {
  try {
    console.log('Criando tabela profiles diretamente...');
    
    // Verificar se a tabela já existe
    console.log('Verificando se a tabela já existe...');
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles');
    
    if (checkError) {
      console.error('Erro ao verificar tabelas existentes:', checkError.message);
      return;
    }
    
    if (existingTables && existingTables.length > 0) {
      console.log('A tabela profiles já existe. Excluindo para recriar...');
      // Não podemos usar DROP TABLE diretamente, então vamos usar a API REST
      // para excluir a tabela existente
      await supabase.schema.dropTable('profiles');
      console.log('Tabela profiles excluída com sucesso.');
    }
    
    // Criar a tabela profiles
    console.log('Criando a tabela profiles...');
    const { error: createError } = await supabase.schema
      .createTable('profiles', [
        {
          name: 'id',
          type: 'uuid',
          primaryKey: true,
          references: 'auth.users(id)',
          onDelete: 'cascade'
        },
        {
          name: 'name',
          type: 'text',
          notNull: true
        },
        {
          name: 'email',
          type: 'text',
          notNull: true
        },
        {
          name: 'created_at',
          type: 'timestamptz',
          notNull: true,
          default: "timezone('utc'::text, now())"
        },
        {
          name: 'updated_at',
          type: 'timestamptz',
          notNull: true,
          default: "timezone('utc'::text, now())"
        }
      ]);
    
    if (createError) {
      console.error('Erro ao criar tabela profiles:', createError.message);
      return;
    }
    
    console.log('Tabela profiles criada com sucesso!');
    
    // Habilitar RLS
    console.log('Habilitando Row Level Security...');
    const { error: rlsError } = await supabase.schema
      .alterTable('profiles')
      .enableRLS();
    
    if (rlsError) {
      console.error('Erro ao habilitar RLS:', rlsError.message);
      return;
    }
    
    console.log('RLS habilitado com sucesso!');
    
    // Criar políticas de segurança
    console.log('Criando políticas de segurança...');
    
    // Política de seleção
    const { error: selectPolicyError } = await supabase.schema
      .createPolicy('profiles', 'profiles_select_policy', {
        action: 'SELECT',
        using: 'true'
      });
    
    if (selectPolicyError) {
      console.error('Erro ao criar política de seleção:', selectPolicyError.message);
    } else {
      console.log('Política de seleção criada com sucesso!');
    }
    
    // Política de inserção
    const { error: insertPolicyError } = await supabase.schema
      .createPolicy('profiles', 'profiles_insert_policy', {
        action: 'INSERT',
        check: 'true'
      });
    
    if (insertPolicyError) {
      console.error('Erro ao criar política de inserção:', insertPolicyError.message);
    } else {
      console.log('Política de inserção criada com sucesso!');
    }
    
    // Política de atualização
    const { error: updatePolicyError } = await supabase.schema
      .createPolicy('profiles', 'profiles_update_policy', {
        action: 'UPDATE',
        using: 'auth.uid() = id'
      });
    
    if (updatePolicyError) {
      console.error('Erro ao criar política de atualização:', updatePolicyError.message);
    } else {
      console.log('Política de atualização criada com sucesso!');
    }
    
    console.log('Configuração da tabela profiles concluída com sucesso!');
  } catch (erro) {
    console.error('Erro ao criar tabela profiles:', erro.message);
    console.error('Stack trace:', erro.stack);
  }
}

// Executar a função principal
criarTabelaProfiles().then(() => {
  console.log('Processo concluído.');
}).catch(erro => {
  console.error('Erro no processo:', erro.message);
});