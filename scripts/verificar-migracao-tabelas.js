/**
 * Script para verificar quais tabelas não foram migradas entre os projetos Supabase
 * 
 * Este script lista as tabelas do projeto de produção (domino) e do projeto de desenvolvimento (domino_dev)
 * e mostra quais tabelas não foram migradas corretamente
 * 
 * Uso: node scripts/verificar-migracao-tabelas.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações dos projetos Supabase
const PROJETOS = {
  producao: {
    nome: 'domino',
    url: 'https://evakdtqrtpqiuqhetkqr.supabase.co',
    serviceRoleKey: process.env.SUPABASE_PROD_SERVICE_ROLE_KEY
  },
  desenvolvimento: {
    nome: 'domino_dev',
    url: 'https://dwsnwsxdkekkaeabiqrw.supabase.co',
    serviceRoleKey: process.env.SUPABASE_DEV_SERVICE_ROLE_KEY
  }
};

// Criar clientes Supabase
const supabaseProducao = createClient(
  PROJETOS.producao.url,
  PROJETOS.producao.serviceRoleKey
);

const supabaseDesenvolvimento = createClient(
  PROJETOS.desenvolvimento.url,
  PROJETOS.desenvolvimento.serviceRoleKey
);

/**
 * Lista todas as tabelas do projeto usando SQL direto
 */
async function listarTabelas(supabase) {
  try {
    // Consultar diretamente usando SQL para obter a lista de tabelas
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .not('tablename', 'like', 'pg\_%')
      .not('tablename', 'like', '\_prisma\_%')
      .not('tablename', 'like', '\_migrations%');
    
    if (error) {
      // Tentar método alternativo se o primeiro falhar
      const { data: tablesData, error: tablesError } = await supabase.rpc('list_tables');
      
      if (tablesError) {
        // Criar função RPC para listar tabelas
        await criarFuncaoListarTabelas(supabase);
        
        // Tentar novamente após criar a função
        const { data: newData, error: newError } = await supabase.rpc('list_tables');
        
        if (newError) {
          console.error('Erro ao listar tabelas após criar função:', newError.message);
          
          // Último recurso: consulta SQL direta
          const { data: sqlData, error: sqlError } = await supabase.rpc('execute_sql', {
            sql_query: "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE 'pg\_%' AND tablename NOT LIKE '\_prisma\_%' AND tablename NOT LIKE '\_migrations%'"
          });
          
          if (sqlError) {
            console.error('Erro ao executar SQL direto:', sqlError.message);
            return [];
          }
          
          return sqlData.map(row => row.tablename);
        }
        
        return newData;
      }
      
      return tablesData;
    }
    
    return data.map(row => row.tablename);
  } catch (erro) {
    console.error(`Erro ao listar tabelas: ${erro.message}`);
    return [];
  }
}

/**
 * Cria a função RPC para listar tabelas
 */
async function criarFuncaoListarTabelas(supabase) {
  try {
    console.log('Criando função para listar tabelas...');
    
    // Criar função SQL para listar tabelas
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE OR REPLACE FUNCTION list_tables()
        RETURNS SETOF text AS $$
        BEGIN
          RETURN QUERY
          SELECT tablename::text FROM pg_tables 
          WHERE schemaname = 'public' AND 
                tablename NOT LIKE 'pg\_%' AND 
                tablename NOT LIKE '\_prisma\_%' AND
                tablename NOT LIKE '\_migrations%';
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    
    if (error) {
      // Tentar método alternativo se o primeiro falhar
      const { error: altError } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
          RETURNS SETOF record AS $$
          BEGIN
            RETURN QUERY EXECUTE sql_query;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      });
      
      if (altError) {
        console.error('Erro ao criar função execute_sql:', altError.message);
        return false;
      }
      
      // Agora criar a função list_tables
      const { error: listError } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE OR REPLACE FUNCTION list_tables()
          RETURNS SETOF text AS $$
          BEGIN
            RETURN QUERY
            SELECT tablename::text FROM pg_tables 
            WHERE schemaname = 'public' AND 
                  tablename NOT LIKE 'pg\_%' AND 
                  tablename NOT LIKE '\_prisma\_%' AND
                  tablename NOT LIKE '\_migrations%';
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      });
      
      if (listError) {
        console.error('Erro ao criar função list_tables:', listError.message);
        return false;
      }
    }
    
    console.log('Função para listar tabelas criada com sucesso!');
    return true;
  } catch (erro) {
    console.error(`Erro ao criar função para listar tabelas: ${erro.message}`);
    return false;
  }
}

/**
 * Função principal para verificar tabelas entre projetos
 */
async function verificarTabelas() {
  try {
    console.log('Verificando tabelas entre projetos Supabase...');
    console.log(`Produção: ${PROJETOS.producao.nome} (${PROJETOS.producao.url})`);
    console.log(`Desenvolvimento: ${PROJETOS.desenvolvimento.nome} (${PROJETOS.desenvolvimento.url})`);
    
    // Verificar se as variáveis de ambiente estão definidas
    if (!process.env.SUPABASE_PROD_SERVICE_ROLE_KEY) {
      console.error('Erro: Variável de ambiente SUPABASE_PROD_SERVICE_ROLE_KEY não definida');
      console.log('Execute: export SUPABASE_PROD_SERVICE_ROLE_KEY=sua_chave_aqui');
      process.exit(1);
    }
    
    if (!process.env.SUPABASE_DEV_SERVICE_ROLE_KEY) {
      console.error('Erro: Variável de ambiente SUPABASE_DEV_SERVICE_ROLE_KEY não definida');
      console.log('Execute: export SUPABASE_DEV_SERVICE_ROLE_KEY=sua_chave_aqui');
      process.exit(1);
    }
    
    // Listar tabelas do projeto de produção
    console.log('\nListando tabelas do projeto de produção...');
    const tabelasProducao = await listarTabelas(supabaseProducao);
    
    if (!tabelasProducao || tabelasProducao.length === 0) {
      console.error('Nenhuma tabela encontrada no projeto de produção.');
      process.exit(1);
    }
    
    console.log(`\nTabelas encontradas em produção (${tabelasProducao.length}):`);
    tabelasProducao.forEach((tabela, index) => {
      console.log(`${index + 1}. ${tabela}`);
    });
    
    // Listar tabelas do projeto de desenvolvimento
    console.log('\nListando tabelas do projeto de desenvolvimento...');
    const tabelasDesenvolvimento = await listarTabelas(supabaseDesenvolvimento);
    
    if (!tabelasDesenvolvimento) {
      console.error('Erro ao listar tabelas do projeto de desenvolvimento.');
      process.exit(1);
    }
    
    console.log(`\nTabelas encontradas em desenvolvimento (${tabelasDesenvolvimento.length}):`);
    tabelasDesenvolvimento.forEach((tabela, index) => {
      console.log(`${index + 1}. ${tabela}`);
    });
    
    // Verificar quais tabelas não foram migradas
    const tabelasNaoMigradas = tabelasProducao.filter(tabela => !tabelasDesenvolvimento.includes(tabela));
    
    console.log('\n=== RESULTADO DA VERIFICAÇÃO ===');
    
    if (tabelasNaoMigradas.length === 0) {
      console.log('\nTodas as tabelas foram migradas com sucesso!');
    } else {
      console.log(`\nTabelas que NÃO foram migradas (${tabelasNaoMigradas.length}):`);
      tabelasNaoMigradas.forEach((tabela, index) => {
        console.log(`${index + 1}. ${tabela}`);
      });
      
      console.log('\nPara migrar estas tabelas, execute o script:');
      console.log('node scripts/migrar-tabelas-supabase-melhorado.js');
    }
    
    // Verificar tabelas extras no ambiente de desenvolvimento
    const tabelasExtras = tabelasDesenvolvimento.filter(tabela => !tabelasProducao.includes(tabela));
    
    if (tabelasExtras.length > 0) {
      console.log(`\nTabelas que existem APENAS no ambiente de desenvolvimento (${tabelasExtras.length}):`);
      tabelasExtras.forEach((tabela, index) => {
        console.log(`${index + 1}. ${tabela}`);
      });
    }
    
  } catch (erro) {
    console.error(`Erro durante a verificação: ${erro.message}`);
    console.error(erro.stack);
  } finally {
    // Encerrar conexões com Supabase
    supabaseProducao.auth.signOut();
    supabaseDesenvolvimento.auth.signOut();
  }
}

// Executar a função principal
verificarTabelas();