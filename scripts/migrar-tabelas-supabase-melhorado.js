/**
 * Script melhorado para migrar tabelas entre projetos Supabase usando a API do Supabase
 * 
 * Este script exporta tabelas do projeto de produção (domino) e as importa no projeto de desenvolvimento (domino_dev)
 * Não requer psql, apenas Node.js e acesso à internet
 * 
 * Uso: node scripts/migrar-tabelas-supabase-melhorado.js
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
 * Lista todas as tabelas do projeto usando uma abordagem mais simples
 */
async function listarTabelas(supabase) {
  try {
    console.log('Consultando tabelas do banco de dados...');
    
    // Usar information_schema.tables em vez de pg_catalog.pg_tables para maior compatibilidade
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .not('table_name', 'like', 'pg\_%')
      .not('table_name', 'like', 'auth\_%')
      .not('table_name', 'like', 'storage\_%')
      .not('table_name', 'like', '\_prisma\_%')
      .not('table_name', 'like', '\_migrations%');
    
    if (error) {
      console.error('Erro ao consultar tabelas:', error.message);
      // Tentar abordagem alternativa com tabelas conhecidas
      console.log('Tentando abordagem alternativa com lista de tabelas conhecidas...');
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
    
    if (data && data.length > 0) {
      return data.map(table => ({ table_name: table.table_name }));
    } else {
      console.log('Nenhuma tabela encontrada no esquema público.');
      return [];
    }
  } catch (erro) {
    console.error(`Erro ao listar tabelas: ${erro.message}`);
    // Retornar lista de tabelas conhecidas em caso de erro
    console.log('Usando lista de tabelas conhecidas devido ao erro...');
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

// Função para listar tabelas simplificada, não precisamos mais criar funções SQL

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
 * Importa dados para uma tabela
 */
async function importarDados(supabase, tabela, dados, modoTeste = false) {
  try {
    if (!dados || dados.length === 0) {
      console.log(`Nenhum dado para importar na tabela ${tabela}.`);
      return true;
    }
    
    // No modo de teste, limitar o número de registros para importação
    let dadosParaImportar = dados;
    if (modoTeste && dados.length > 5) {
      console.log(`MODO DE TESTE: Limitando a importação a apenas 5 registros para a tabela ${tabela}`);
      dadosParaImportar = dados.slice(0, 5);
    }
    
    console.log(`Importando ${dadosParaImportar.length} registros para a tabela ${tabela}...`);
    
    // Verificar se a tabela existe antes de tentar limpar
    console.log(`Verificando se a tabela ${tabela} existe no destino...`);
    const { error: checkError } = await supabase
      .from(tabela)
      .select('count')
      .limit(1);
      
    if (checkError) {
      console.error(`Erro ao verificar tabela ${tabela} no destino:`, checkError.message);
      console.error(`Código do erro: ${checkError.code}, Detalhes: ${checkError.details || 'Nenhum detalhe disponível'}`);
      return false;
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
    for (let i = 0; i < dadosParaImportar.length; i += TAMANHO_LOTE) {
      const lote = dadosParaImportar.slice(i, i + TAMANHO_LOTE);
      
      console.log(`Inserindo lote ${Math.floor(i/TAMANHO_LOTE) + 1} de ${Math.ceil(dadosParaImportar.length/TAMANHO_LOTE)} (${lote.length} registros)...`);
      
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
      
      console.log(`Importado lote ${Math.floor(i/TAMANHO_LOTE) + 1} de ${Math.ceil(dadosParaImportar.length/TAMANHO_LOTE)} para tabela ${tabela}.`);
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
 * Função principal para migrar tabelas entre projetos
 */
async function migrarTabelas() {
  try {
    console.log('Iniciando migração de tabelas entre projetos Supabase...');
    console.log(`Origem: ${PROJETOS.producao.nome} (${PROJETOS.producao.url})`);
    console.log(`Destino: ${PROJETOS.desenvolvimento.nome} (${PROJETOS.desenvolvimento.url})`);
    
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
    console.log('Opções:');
    console.log('- "todas": migrar todas as tabelas');
    console.log('- "teste": testar com apenas a tabela "profiles"');
    console.log('- lista de números separados por vírgula (ex: 1,3,5)');
    console.log('- "cancelar": cancelar a operação');
    
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
    } else if (resposta.toLowerCase() === 'teste') {
      // Opção para testar com apenas uma tabela (profiles)
      console.log('Modo de teste selecionado: migrando apenas a tabela "profiles"');
      tabelasSelecionadas = ['profiles'];
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
    
    // Verificar se estamos no modo de teste
    const modoTeste = resposta.toLowerCase() === 'teste';
    
    // Realizar a migração
    console.log('\nIniciando processo de migração...');
    if (modoTeste) {
      console.log('MODO DE TESTE ATIVADO: Apenas uma quantidade limitada de registros será migrada.');
    }
    
    // Armazenar resultados para relatório final
    const resultados = [];
    
    for (const tabela of tabelasSelecionadas) {
      console.log(`\nProcessando tabela: ${tabela}`);
      const inicio = new Date();
      
      try {
        // Exportar dados da tabela de origem
        console.log(`Exportando dados da tabela ${tabela} do ambiente de produção...`);
        const dados = await exportarDados(supabaseProducao, tabela);
        
        if (dados === null) {
          console.error(`Falha ao exportar tabela ${tabela}. Pulando para a próxima.`);
          resultados.push({ tabela, sucesso: false, erro: 'Falha na exportação', tempo: 0 });
          continue;
        }
        
        // Importar dados para a tabela de destino
        console.log(`Importando dados para a tabela ${tabela} no ambiente de desenvolvimento...`);
        const sucesso = await importarDados(supabaseDesenvolvimento, tabela, dados, modoTeste);
        
        const fim = new Date();
        const tempoDecorrido = (fim - inicio) / 1000; // em segundos
        
        if (!sucesso) {
          console.error(`Falha ao importar tabela ${tabela}.`);
          resultados.push({ tabela, sucesso: false, erro: 'Falha na importação', tempo: tempoDecorrido });
        } else {
          console.log(`Migração da tabela ${tabela} concluída com sucesso em ${tempoDecorrido.toFixed(2)} segundos.`);
          resultados.push({ tabela, sucesso: true, registros: dados.length, tempo: tempoDecorrido });
        }
      } catch (erro) {
        const fim = new Date();
        const tempoDecorrido = (fim - inicio) / 1000; // em segundos
        console.error(`Erro inesperado ao processar tabela ${tabela}:`, erro.message);
        resultados.push({ tabela, sucesso: false, erro: erro.message, tempo: tempoDecorrido });
      }
    }
    
    // Exibir relatório final
    console.log('\n===== RELATÓRIO DE MIGRAÇÃO =====');
    console.log(`Total de tabelas processadas: ${resultados.length}`);
    
    const sucessos = resultados.filter(r => r.sucesso);
    const falhas = resultados.filter(r => !r.sucesso);
    
    console.log(`Tabelas migradas com sucesso: ${sucessos.length}`);
    console.log(`Tabelas com falha: ${falhas.length}`);
    
    if (sucessos.length > 0) {
      console.log('\nTabelas migradas com sucesso:');
      sucessos.forEach(r => {
        console.log(`- ${r.tabela}: ${r.registros} registros em ${r.tempo.toFixed(2)} segundos`);
      });
    }
    
    if (falhas.length > 0) {
      console.log('\nTabelas com falha:');
      falhas.forEach(r => {
        console.log(`- ${r.tabela}: ${r.erro} (${r.tempo.toFixed(2)} segundos)`);
      });
    }
    
    console.log('\nProcesso de migração concluído!');
    if (modoTeste) {
      console.log('NOTA: Esta foi uma execução de teste com número limitado de registros.');
      console.log('Para migrar todos os dados, execute novamente sem selecionar a opção "teste".');
    }
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