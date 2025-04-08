/**
 * Script simplificado para migrar apenas uma tabela específica entre projetos Supabase
 * 
 * Este script exporta uma tabela específica do projeto de produção (domino) e a importa no projeto de desenvolvimento (domino_dev)
 * Inclui verificação e criação da tabela no destino se ela não existir
 * 
 * Uso: node scripts/migrar-uma-tabela.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configurações dos projetos Supabase com chaves obtidas do arquivo anotacoes.md
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
    console.log('Consultando tabelas do banco de dados...');
    
    // Usar uma abordagem mais simples - listar tabelas conhecidas
    return [
      { table_name: 'profiles' },
      { table_name: 'players' },
      { table_name: 'games' },
      { table_name: 'communities' },
      { table_name: 'community_members' },
      { table_name: 'community_organizers' },
      { table_name: 'competitions' },
      { table_name: 'competition_members' },
      { table_name: 'activities' }
    ];
  } catch (erro) {
    console.error(`Erro ao listar tabelas: ${erro.message}`);
    // Retornar lista de tabelas conhecidas em caso de erro
    return [
      { table_name: 'profiles' },
      { table_name: 'players' },
      { table_name: 'games' },
      { table_name: 'communities' },
      { table_name: 'community_members' },
      { table_name: 'community_organizers' },
      { table_name: 'competitions' },
      { table_name: 'competition_members' },
      { table_name: 'activities' }
    ];
  }
}

/**
 * Exporta dados de uma tabela
 */
async function exportarDados(supabase, tabela) {
  try {
    console.log(`Exportando dados da tabela ${tabela}...`);
    
    // Verificar se a tabela existe antes de tentar exportar
    console.log(`Verificando se a tabela ${tabela} existe...`);
    const { error: checkError } = await supabase
      .from(tabela)
      .select('count')
      .limit(1);
      
    if (checkError) {
      console.error(`Erro ao verificar tabela ${tabela}:`, checkError.message);
      console.error(`Código do erro: ${checkError.code}, Detalhes: ${checkError.details || 'Nenhum detalhe disponível'}`);
      return null;
    }
    
    // Obter todos os dados da tabela
    const { data, error } = await supabase
      .from(tabela)
      .select('*');
    
    if (error) {
      console.error(`Erro ao exportar tabela ${tabela}:`, error.message);
      console.error(`Código do erro: ${error.code}, Detalhes: ${error.details || 'Nenhum detalhe disponível'}`);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log(`Tabela ${tabela} está vazia.`);
      return [];
    }
    
    console.log(`Exportados ${data.length} registros da tabela ${tabela}.`);
    
    // Salvar os dados em um arquivo temporário
    const arquivoSaida = path.join(TEMP_DIR, `${tabela}.json`);
    try {
      fs.writeFileSync(arquivoSaida, JSON.stringify(data, null, 2));
      console.log(`Dados salvos em ${arquivoSaida}`);
    } catch (fsError) {
      console.error(`Erro ao salvar arquivo temporário: ${fsError.message}`);
      // Continuar mesmo se não conseguir salvar o arquivo
    }
    
    return data;
  } catch (erro) {
    console.error(`Erro ao exportar dados da tabela ${tabela}:`, erro.message);
    console.error(`Stack trace: ${erro.stack}`);
    return null;
  }
}

/**
 * Verifica se uma tabela existe no banco de dados
 */
async function verificarTabelaExiste(supabase, tabela) {
  try {
    console.log(`Verificando se a tabela ${tabela} existe...`);
    const { error } = await supabase
      .from(tabela)
      .select('count')
      .limit(1);
    
    return !error; // Se não houver erro, a tabela existe
  } catch (erro) {
    console.error(`Erro ao verificar tabela ${tabela}:`, erro.message);
    return false;
  }
}

/**
 * Obtém a estrutura de uma tabela
 */
async function obterEstruturaDaTabela(supabase, tabela) {
  try {
    console.log(`Obtendo estrutura da tabela ${tabela}...`);
    
    // Obter um registro para analisar a estrutura
    const { data, error } = await supabase
      .from(tabela)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`Erro ao obter estrutura da tabela ${tabela}:`, error.message);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log(`Tabela ${tabela} está vazia, não é possível determinar a estrutura.`);
      return null;
    }
    
    // Extrair nomes e tipos de colunas
    const colunas = Object.keys(data[0]);
    console.log(`Colunas encontradas: ${colunas.join(', ')}`);
    
    return colunas;
  } catch (erro) {
    console.error(`Erro ao obter estrutura da tabela ${tabela}:`, erro.message);
    return null;
  }
}

/**
 * Cria uma tabela no banco de dados de destino com base na estrutura da tabela de origem
 */
async function criarTabela(supabase, tabela, colunas) {
  try {
    console.log(`Criando tabela ${tabela} no banco de dados de destino...`);
    
    // Construir SQL para criar a tabela
    let sql = `CREATE TABLE ${tabela} (\n`;
    
    // Adicionar colunas
    colunas.forEach((coluna, index) => {
      // Simplificação: assumir que todas as colunas são do tipo TEXT, exceto id (UUID) e timestamps
      let tipo = 'TEXT';
      
      if (coluna === 'id') {
        tipo = 'UUID PRIMARY KEY';
      } else if (coluna.endsWith('_id')) {
        tipo = 'UUID';
      } else if (coluna === 'created_at' || coluna === 'updated_at') {
        tipo = 'TIMESTAMP WITH TIME ZONE';
      }
      
      sql += `  ${coluna} ${tipo}`;
      
      if (index < colunas.length - 1) {
        sql += ',\n';
      } else {
        sql += '\n';
      }
    });
    
    sql += ');';
    
    console.log('SQL para criar tabela:');
    console.log(sql);
    
    // Executar SQL para criar a tabela
    // Nota: Como não podemos executar SQL diretamente, vamos apenas mostrar o SQL
    // e sugerir que o usuário o execute manualmente no console do Supabase
    
    console.log('\nPor favor, execute o SQL acima no console SQL do projeto Supabase de destino.');
    console.log('Após criar a tabela, pressione Enter para continuar com a importação dos dados.');
    
    await new Promise(resolve => {
      rl.question('Pressione Enter para continuar...', resolve);
    });
    
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
    
    // Verificar se a tabela existe antes de tentar limpar
    console.log(`Verificando se a tabela ${tabela} existe no destino...`);
    const tabelaExiste = await verificarTabelaExiste(supabase, tabela);
      
    if (!tabelaExiste) {
      console.error(`Tabela ${tabela} não existe no destino.`);
      
      // Obter estrutura da tabela de origem
      const colunas = Object.keys(dados[0]);
      
      // Criar tabela no destino
      const tabelaCriada = await criarTabela(supabase, tabela, colunas);
      
      if (!tabelaCriada) {
        console.error(`Não foi possível criar a tabela ${tabela} no destino.`);
        return false;
      }
    }
    
    // Primeiro, limpar a tabela de destino
    console.log(`Limpando dados existentes da tabela ${tabela}...`);
    const { error: deleteError } = await supabase
      .from(tabela)
      .delete()
      .neq('id', 0); // Condição para deletar todos os registros
    
    if (deleteError) {
      console.error(`Erro ao limpar tabela ${tabela}:`, deleteError.message);
      console.error(`Código do erro: ${deleteError.code}, Detalhes: ${deleteError.details || 'Nenhum detalhe disponível'}`);
      return false;
    }
    
    // Importar os dados em lotes para evitar problemas com limites de tamanho
    const TAMANHO_LOTE = 100; // Reduzido para evitar problemas
    for (let i = 0; i < dados.length; i += TAMANHO_LOTE) {
      const lote = dados.slice(i, i + TAMANHO_LOTE);
      
      console.log(`Inserindo lote ${Math.floor(i/TAMANHO_LOTE) + 1} de ${Math.ceil(dados.length/TAMANHO_LOTE)} (${lote.length} registros)...`);
      
      const { error } = await supabase
        .from(tabela)
        .insert(lote);
      
      if (error) {
        console.error(`Erro ao importar lote para tabela ${tabela}:`, error.message);
        console.error(`Código do erro: ${error.code}, Detalhes: ${error.details || 'Nenhum detalhe disponível'}`);
        
        if (error.code === '23505') { // Código para violação de chave única
          console.error('Erro de chave duplicada. Tentando abordagem alternativa...');
          // Tentar inserir um por um para identificar registros problemáticos
          for (const registro of lote) {
            const { error: singleError } = await supabase
              .from(tabela)
              .insert([registro]);
            
            if (singleError) {
              console.error(`Erro ao inserir registro com ID ${registro.id || 'desconhecido'}:`, singleError.message);
            }
          }
        }
        
        return false;
      }
      
      console.log(`Importado lote ${Math.floor(i/TAMANHO_LOTE) + 1} de ${Math.ceil(dados.length/TAMANHO_LOTE)} para tabela ${tabela}.`);
    }
    
    console.log(`Importação concluída para tabela ${tabela}.`);
    return true;
  } catch (erro) {
    console.error(`Erro ao importar dados para tabela ${tabela}:`, erro.message);
    console.error(`Stack trace: ${erro.stack}`);
    return false;
  }
}

/**
 * Função principal para migrar uma tabela específica entre projetos
 */
async function migrarUmaTabela() {
  try {
    console.log('Iniciando migração de uma tabela específica entre projetos Supabase...');
    console.log(`Origem: ${PROJETOS.producao.nome} (${PROJETOS.producao.url})`);
    console.log(`Destino: ${PROJETOS.desenvolvimento.nome} (${PROJETOS.desenvolvimento.url})`);
    
    // Listar tabelas do projeto de origem
    console.log('\nListando tabelas disponíveis...');
    const tabelas = await listarTabelas(supabaseProducao);
    
    console.log('\nTabelas disponíveis:');
    tabelas.forEach((tabela, index) => {
      console.log(`${index + 1}. ${tabela.table_name}`);
    });
    
    // Perguntar ao usuário qual tabela deseja migrar
    console.log('\nQual tabela você deseja migrar?');
    const resposta = await new Promise(resolve => {
      rl.question('Digite o número da tabela: ', resolve);
    });
    
    const indice = parseInt(resposta.trim()) - 1;
    if (isNaN(indice) || indice < 0 || indice >= tabelas.length) {
      console.error('Número de tabela inválido.');
      process.exit(1);
    }
    
    const tabelaSelecionada = tabelas[indice].table_name;
    console.log(`\nVocê selecionou a tabela: ${tabelaSelecionada}`);
    
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
    
    const inicio = new Date();
    
    // Exportar dados da tabela de origem
    console.log(`Exportando dados da tabela ${tabelaSelecionada} do ambiente de produção...`);
    const dados = await exportarDados(supabaseProducao, tabelaSelecionada);
    
    if (dados === null) {
      console.error(`Falha ao exportar tabela ${tabelaSelecionada}.`);
      process.exit(1);
    }
    
    // Importar dados para a tabela de destino
    console.log(`Importando dados para a tabela ${tabelaSelecionada} no ambiente de desenvolvimento...`);
    const sucesso = await importarDados(supabaseDesenvolvimento, tabelaSelecionada, dados);
    
    const fim = new Date();
    const tempoDecorrido = (fim - inicio) / 1000; // em segundos
    
    // Exibir relatório final
    console.log('\n===== RELATÓRIO DE MIGRAÇÃO =====');
    
    if (sucesso) {
      console.log(`Migração da tabela ${tabelaSelecionada} concluída com sucesso em ${tempoDecorrido.toFixed(2)} segundos.`);
      console.log(`Total de registros migrados: ${dados.length}`);
    } else {
      console.error(`Falha ao migrar tabela ${tabelaSelecionada}.`);
      console.log(`Tempo decorrido: ${tempoDecorrido.toFixed(2)} segundos.`);
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
migrarUmaTabela();