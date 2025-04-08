/**
 * Script para migrar tabelas entre projetos Supabase usando a API do Supabase
 * 
 * Este script exporta tabelas do projeto de produção (domino) e as importa no projeto de desenvolvimento (domino_dev)
 * Não requer psql, apenas Node.js e acesso à internet
 * 
 * Uso: node scripts/migrar-tabelas-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configurações dos projetos Supabase
const PROJETOS = {
  producao: {
    nome: 'domino',
    url: 'https://evakdtqrtpqiuqhetkqr.supabase.co',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YWtkdHFydHBxaXVxaGV0a3FyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTM2OTUyNCwiZXhwIjoyMDU0OTQ1NTI0fQ.TLgSEhrgsxhQ_png34HGvhCXbxY-xBo0YEpx8M6HCS0'
  },
  desenvolvimento: {
    nome: 'domino_dev',
    url: 'https://dwsnwsxdkekkaeabiqrw.supabase.co',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3c253c3hka2Vra2FlYWJpcXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzgxNDYxMiwiZXhwIjoyMDU5MzkwNjEyfQ.7TE_sKGfsDjrz4VL1TfG7ACYJqZpwC822IBT8REJaYM'
  }
};

// Diretório para armazenar os arquivos temporários
const TEMP_DIR = path.resolve(__dirname, '../temp');

// Criar diretório temporário se não existir
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Interface para leitura de entrada do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
 * Lista todas as tabelas do projeto
 */
async function listarTabelas(supabase) {
  try {
    // Consultar a tabela pg_tables para obter a lista de tabelas
    const { data, error } = await supabase.rpc('get_tables');
    
    if (error) {
      // Se a função RPC não existir, vamos criar
      await supabase.rpc('create_get_tables_function', {});
      
      // Tentar novamente
      const result = await supabase.rpc('get_tables');
      if (result.error) {
        console.error('Erro ao listar tabelas:', result.error.message);
        return [];
      }
      return result.data;
    }
    
    return data;
  } catch (erro) {
    console.error(`Erro ao listar tabelas: ${erro.message}`);
    return [];
  }
}

/**
 * Cria a função RPC para listar tabelas
 */
async function criarFuncaoListarTabelas(supabase) {
  const { error } = await supabase.rpc('create_get_tables_function', {});
  
  if (error) {
    // Se a função para criar a função não existir, vamos criar manualmente
    const { error: createError } = await supabase.from('_functions').insert({
      name: 'create_get_tables_function',
      definition: `
        CREATE OR REPLACE FUNCTION create_get_tables_function()
        RETURNS void AS $$
        BEGIN
          CREATE OR REPLACE FUNCTION get_tables()
          RETURNS TABLE (table_name text) AS $$
          BEGIN
            RETURN QUERY
            SELECT tablename::text FROM pg_tables 
            WHERE schemaname = 'public' AND 
                  tablename NOT LIKE 'pg_%' AND 
                  tablename NOT LIKE '_prisma_%' AND
                  tablename NOT LIKE '_migrations%';
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    
    if (createError) {
      console.error('Erro ao criar função para listar tabelas:', createError.message);
      return false;
    }
    
    // Executar a função que acabamos de criar
    const { error: execError } = await supabase.rpc('create_get_tables_function');
    if (execError) {
      console.error('Erro ao executar função para criar função de listagem:', execError.message);
      return false;
    }
  }
  
  return true;
}

/**
 * Exporta dados de uma tabela
 */
async function exportarDados(supabase, tabela) {
  try {
    console.log(`Exportando dados da tabela ${tabela}...`);
    
    // Obter todos os dados da tabela
    const { data, error } = await supabase
      .from(tabela)
      .select('*');
    
    if (error) {
      console.error(`Erro ao exportar tabela ${tabela}:`, error.message);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log(`Tabela ${tabela} está vazia.`);
      return [];
    }
    
    console.log(`Exportados ${data.length} registros da tabela ${tabela}.`);
    
    // Salvar os dados em um arquivo temporário
    const arquivoSaida = path.join(TEMP_DIR, `${tabela}.json`);
    fs.writeFileSync(arquivoSaida, JSON.stringify(data, null, 2));
    
    return data;
  } catch (erro) {
    console.error(`Erro ao exportar dados da tabela ${tabela}:`, erro.message);
    return null;
  }
}

/**
 * Importa dados para uma tabela
 */
async function importarDados(supabase, tabela, dados) {
  try {
    if (!dados || dados.length === 0) {
      console.log(`Nenhum dado para importar na tabela ${tabela}.`);
      return true;
    }
    
    console.log(`Importando ${dados.length} registros para a tabela ${tabela}...`);
    
    // Primeiro, limpar a tabela de destino
    const { error: deleteError } = await supabase
      .from(tabela)
      .delete()
      .neq('id', 0); // Condição para deletar todos os registros
    
    if (deleteError) {
      console.error(`Erro ao limpar tabela ${tabela}:`, deleteError.message);
      return false;
    }
    
    // Importar os dados em lotes para evitar problemas com limites de tamanho
    const TAMANHO_LOTE = 500;
    for (let i = 0; i < dados.length; i += TAMANHO_LOTE) {
      const lote = dados.slice(i, i + TAMANHO_LOTE);
      
      const { error } = await supabase
        .from(tabela)
        .insert(lote)
        .select();
      
      if (error) {
        console.error(`Erro ao importar lote para tabela ${tabela}:`, error.message);
        return false;
      }
      
      console.log(`Importado lote ${i/TAMANHO_LOTE + 1} de ${Math.ceil(dados.length/TAMANHO_LOTE)} para tabela ${tabela}.`);
    }
    
    console.log(`Importação concluída para tabela ${tabela}.`);
    return true;
  } catch (erro) {
    console.error(`Erro ao importar dados para tabela ${tabela}:`, erro.message);
    return false;
  }
}

/**
 * Função principal para migrar tabelas entre projetos
 */
async function migrarTabelas() {
  try {
    console.log('Iniciando migração de tabelas entre projetos Supabase...');
    console.log(`Origem: ${PROJETOS.producao.nome} (${PROJETOS.producao.url})`);
    console.log(`Destino: ${PROJETOS.desenvolvimento.nome} (${PROJETOS.desenvolvimento.url})`);
    
    // Criar função para listar tabelas se não existir
    await criarFuncaoListarTabelas(supabaseProducao);
    
    // Listar tabelas do projeto de origem
    console.log('\nListando tabelas do projeto de origem...');
    const tabelas = await listarTabelas(supabaseProducao);
    
    if (!tabelas || tabelas.length === 0) {
      console.error('Nenhuma tabela encontrada no projeto de origem.');
      process.exit(1);
    }
    
    console.log('\nTabelas encontradas:');
    tabelas.forEach((tabela, index) => {
      console.log(`${index + 1}. ${tabela.table_name}`);
    });
    
    // Perguntar ao usuário quais tabelas deseja migrar
    console.log('\nQuais tabelas você deseja migrar?');
    console.log('Opções: "todas", lista de números separados por vírgula (ex: 1,3,5), ou "cancelar"');
    
    const resposta = await new Promise(resolve => {
      rl.question('> ', resolve);
    });
    
    if (resposta.toLowerCase() === 'cancelar') {
      console.log('Operação cancelada pelo usuário.');
      process.exit(0);
    }
    
    let tabelasSelecionadas = [];
    
    if (resposta.toLowerCase() === 'todas') {
      tabelasSelecionadas = tabelas.map(t => t.table_name);
    } else {
      const indices = resposta.split(',').map(num => parseInt(num.trim()) - 1);
      tabelasSelecionadas = indices.map(i => tabelas[i]?.table_name).filter(t => t);
    }
    
    if (tabelasSelecionadas.length === 0) {
      console.error('Nenhuma tabela válida selecionada.');
      process.exit(1);
    }
    
    console.log(`\nVocê selecionou ${tabelasSelecionadas.length} tabelas para migração:`);
    tabelasSelecionadas.forEach(tabela => console.log(`- ${tabela}`));
    
    // Confirmar a operação
    const confirmacao = await new Promise(resolve => {
      rl.question('\nConfirma a migração? Esta operação substituirá os dados no ambiente de destino. (sim/não) > ', resolve);
    });
    
    if (confirmacao.toLowerCase() !== 'sim') {
      console.log('Operação cancelada pelo usuário.');
      process.exit(0);
    }
    
    // Realizar a migração
    console.log('\nIniciando processo de migração...');
    
    for (const tabela of tabelasSelecionadas) {
      console.log(`\nProcessando tabela: ${tabela}`);
      
      // Exportar dados da tabela de origem
      const dados = await exportarDados(supabaseProducao, tabela);
      
      if (dados === null) {
        console.error(`Falha ao exportar tabela ${tabela}. Pulando para a próxima.`);
        continue;
      }
      
      // Importar dados para a tabela de destino
      const sucesso = await importarDados(supabaseDesenvolvimento, tabela, dados);
      
      if (!sucesso) {
        console.error(`Falha ao importar tabela ${tabela}.`);
      }
    }
    
    console.log('\nProcesso de migração concluído!');
    console.log('Verifique os dados no projeto de destino para confirmar que a migração foi bem-sucedida.');
    
  } catch (erro) {
    console.error(`Erro durante a migração: ${erro.message}`);
    console.error(erro.stack);
  } finally {
    rl.close();
    // Encerrar conexões com Supabase
    supabaseProducao.auth.signOut();
    supabaseDesenvolvimento.auth.signOut();
  }
}

// Executar a função principal
migrarTabelas();