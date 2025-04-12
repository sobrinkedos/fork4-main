/**
 * Script para migrar tabelas com prefixo dev_ do servidor remoto para o servidor local
 * 
 * Este script exporta tabelas com prefixo dev_ do projeto de desenvolvimento remoto (domino_dev)
 * e as importa no servidor Supabase local
 * 
 * Uso: node scripts/migrar-tabelas-dev-para-local.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configurações dos projetos Supabase
const PROJETOS = {
  remoto: {
    nome: 'domino_dev',
    url: 'https://dwsnwsxdkekkaeabiqrw.supabase.co',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3c253c3hka2Vra2FlYWJpcXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzgxNDYxMiwiZXhwIjoyMDU5MzkwNjEyfQ.7TE_sKGfsDjrz4VL1TfG7ACYJqZpwC822IBT8REJaYM'
  },
  local: {
    nome: 'supabase_local',
    url: 'http://localhost:54321',
    // Chave de serviço corrigida para o Supabase local
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
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
const supabaseRemoto = createClient(
  PROJETOS.remoto.url,
  PROJETOS.remoto.serviceRoleKey
);

const supabaseLocal = createClient(
  PROJETOS.local.url,
  PROJETOS.local.serviceRoleKey
);

// Lista de tabelas conhecidas com prefixo dev_
const TABELAS_DEV_CONHECIDAS = [
  'dev_activities',
  'dev_communities',
  'dev_community_members',
  'dev_community_organizers',
  'dev_competition_members',
  'dev_competitions',
  'dev_game_players',
  'dev_games',
  'dev_matches',
  'dev_players',
  'dev_profiles',
  'dev_user_player_relations',
  'dev_user_profiles',
  'dev_user_roles',
  'dev_whatsapp_group_links',
  'dev__migrations_log'
];

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
 * Lista todas as tabelas com prefixo dev_ do projeto remoto
 */
async function listarTabelasDevRemoto(supabase) {
  try {
    console.log('Usando lista de tabelas conhecidas com prefixo dev_...');
    
    // Verificar quais tabelas existem no servidor remoto
    const tabelasExistentes = [];
    
    for (const tabela of TABELAS_DEV_CONHECIDAS) {
      try {
        // Tentar fazer uma consulta simples para verificar se a tabela existe
        const { data, error } = await supabase
          .from(tabela)
          .select('count(*)', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`Tabela ${tabela} encontrada no servidor remoto.`);
          tabelasExistentes.push({
            table_name: tabela,
            count: data?.count || 0
          });
        }
      } catch (tabelaErro) {
        // Ignorar erro, tabela provavelmente não existe
      }
    }
    
    if (tabelasExistentes.length === 0) {
      console.log('Nenhuma tabela com prefixo dev_ encontrada no servidor remoto.');
    } else {
      console.log(`Encontradas ${tabelasExistentes.length} tabelas com prefixo dev_.`);
    }
    
    return tabelasExistentes;
  } catch (erro) {
    console.error(`Erro ao listar tabelas dev_: ${erro.message}`);
    return [];
  }
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
 * Verifica se uma tabela existe no servidor
 */
async function verificarTabelaExiste(supabase, tabela) {
  try {
    // Tentar fazer uma consulta simples para verificar se a tabela existe
    const { data, error } = await supabase
      .from(tabela)
      .select('count(*)', { count: 'exact', head: true });
    
    // Se não houver erro, a tabela existe
    return !error;
  } catch (erro) {
    // Se ocorrer um erro, a tabela provavelmente não existe
    return false;
  }
}

/**
 * Cria uma tabela no servidor local baseada na estrutura da tabela remota
 */
async function criarTabelaLocal(supabaseLocal, tabela, dados) {
  try {
    console.log(`Criando tabela ${tabela} no servidor local...`);
    
    if (!dados || dados.length === 0) {
      console.log(`Sem dados para criar estrutura da tabela ${tabela}. Criando estrutura básica...`);
      
      // Criar tabela com estrutura básica
      const { error } = await supabaseLocal
        .from(tabela)
        .insert({
          id: '00000000-0000-0000-0000-000000000000',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error(`Erro ao criar tabela ${tabela}:`, error.message);
        return false;
      }
      
      // Limpar a tabela após criar
      await supabaseLocal
        .from(tabela)
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000000');
      
      console.log(`Tabela ${tabela} criada com estrutura básica.`);
      return true;
    }
    
    // Se temos dados, usar o primeiro registro para criar a estrutura
    const primeiroRegistro = dados[0];
    
    // Tentar inserir o primeiro registro para criar a tabela
    const { error } = await supabaseLocal
      .from(tabela)
      .insert(primeiroRegistro)
      .select();
    
    if (error) {
      console.error(`Erro ao criar tabela ${tabela}:`, error.message);
      return false;
    }
    
    console.log(`Tabela ${tabela} criada com sucesso.`);
    return true;
  } catch (erro) {
    console.error(`Erro ao criar tabela ${tabela}:`, erro.message);
    return false;
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
      // Continuar mesmo com erro, pois a tabela pode estar vazia
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
 * Função principal para migrar tabelas dev_ do servidor remoto para o local
 */
async function migrarTabelasDevParaLocal() {
  try {
    console.log('Iniciando migração de tabelas dev_ do servidor remoto para o local...');
    console.log(`Origem: ${PROJETOS.remoto.nome} (${PROJETOS.remoto.url})`);
    console.log(`Destino: ${PROJETOS.local.nome} (${PROJETOS.local.url})`);
    
    // Criar função para listar tabelas no servidor remoto
    console.log('\nConfigurando função para listar tabelas no servidor remoto...');
    await criarFuncaoListarTabelas(supabaseRemoto);
    
    // Criar função para listar tabelas no servidor local
    console.log('Configurando função para listar tabelas no servidor local...');
    await criarFuncaoListarTabelas(supabaseLocal);
    
    // Listar tabelas dev_ do projeto remoto
    console.log('\nListando tabelas dev_ do servidor remoto...');
    const tabelasDev = await listarTabelasDevRemoto(supabaseRemoto);
    
    if (!tabelasDev || tabelasDev.length === 0) {
      console.error('Nenhuma tabela com prefixo dev_ encontrada no servidor remoto.');
      process.exit(1);
    }
    
    console.log('\nTabelas dev_ encontradas:');
    tabelasDev.forEach((tabela, index) => {
      console.log(`${index + 1}. ${tabela}`);
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
      tabelasSelecionadas = tabelasDev;
    } else {
      const indices = resposta.split(',').map(num => parseInt(num.trim()) - 1);
      tabelasSelecionadas = indices.map(i => tabelasDev[i]).filter(t => t);
    }
    
    if (tabelasSelecionadas.length === 0) {
      console.error('Nenhuma tabela válida selecionada.');
      process.exit(1);
    }
    
    console.log(`\nVocê selecionou ${tabelasSelecionadas.length} tabelas para migração:`);
    tabelasSelecionadas.forEach(tabela => console.log(`- ${tabela}`));
    
    // Confirmar a operação
    const confirmacao = await new Promise(resolve => {
      rl.question('\nConfirma a migração? Esta operação substituirá os dados no servidor local. (sim/não) > ', resolve);
    });
    
    if (confirmacao.toLowerCase() !== 'sim') {
      console.log('Operação cancelada pelo usuário.');
      process.exit(0);
    }
    
    // Realizar a migração
    console.log('\nIniciando processo de migração...');
    
    for (const tabela of tabelasSelecionadas) {
      console.log(`\nProcessando tabela: ${tabela}`);
      
      // Verificar se a tabela existe no servidor local
      const tabelaExiste = await verificarTabelaExiste(supabaseLocal, tabela);
      
      if (!tabelaExiste) {
        // Obter nome da tabela original (sem prefixo dev_)
        const tabelaOriginal = tabela.replace('dev_', '');
        
        // Criar tabela no servidor local
        const criada = await criarTabelaLocal(supabaseLocal, tabela, tabelaOriginal);
        
        if (!criada) {
          console.error(`Falha ao criar tabela ${tabela} no servidor local. Pulando para a próxima.`);
          continue;
        }
      }
      
      // Exportar dados da tabela remota
      const dados = await exportarDados(supabaseRemoto, tabela);
      
      if (dados === null) {
        console.error(`Falha ao exportar tabela ${tabela}. Pulando para a próxima.`);
        continue;
      }
      
      // Importar dados para a tabela local
      const sucesso = await importarDados(supabaseLocal, tabela, dados);
      
      if (!sucesso) {
        console.error(`Falha ao importar tabela ${tabela}.`);
      }
    }
    
    console.log('\nProcesso de migração concluído!');
    console.log('Verifique os dados no servidor local para confirmar que a migração foi bem-sucedida.');
    console.log('Acesse o Supabase Studio local em: http://localhost:54323');
    
  } catch (erro) {
    console.error(`Erro durante a migração: ${erro.message}`);
    console.error(erro.stack);
  } finally {
    rl.close();
    // Encerrar conexões com Supabase
    supabaseRemoto.auth.signOut();
    supabaseLocal.auth.signOut();
  }
}

// Executar a função principal
migrarTabelasDevParaLocal();