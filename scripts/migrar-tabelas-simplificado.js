/**
 * Script simplificado para migrar tabelas entre projetos Supabase
 * 
 * Este script usa diretamente a API do Supabase para listar tabelas e transferir dados
 * entre os projetos domino (produção) e domino_dev (desenvolvimento)
 * 
 * Uso: node scripts/migrar-tabelas-simplificado.js
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
 * Lista todas as tabelas do projeto usando a API do Supabase
 */
async function listarTabelas(supabase) {
  try {
    // Usar a API do Supabase para listar tabelas diretamente
    // Esta abordagem não depende de funções SQL personalizadas
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .not('table_name', 'like', 'pg\_%')
      .not('table_name', 'like', '\_prisma\_%')
      .not('table_name', 'like', '\_migrations%');
    
    if (error) {
      console.error('Erro ao listar tabelas:', error.message);
      return [];
    }
    
    // Filtrar tabelas do sistema
    const tabelas = data
      .map(row => row.table_name)
      .filter(tableName => 
        !tableName.startsWith('pg_') && 
        !tableName.startsWith('_prisma_') && 
        !tableName.startsWith('_migrations')
      );
    
    return tabelas;
  } catch (erro) {
    console.error(`Erro ao listar tabelas: ${erro.message}`);
    return [];
  }
}

/**
 * Método alternativo para listar tabelas usando metadados do Supabase
 */
async function listarTabelasAlternativo(supabase) {
  try {
    // Tentar obter metadados das tabelas
    const { data, error } = await supabase.rpc('get_supabase_metadata');
    
    if (error || !data) {
      // Tentar abordagem mais simples: listar algumas tabelas conhecidas
      console.log('Usando lista de tabelas conhecidas como fallback...');
      return [
        'users',
        'profiles',
        'players',
        'communities',
        'community_members',
        'community_organizers',
        'competitions',
        'competition_members',
        'games',
        'game_players',
        'activities'
      ];
    }
    
    // Extrair nomes de tabelas dos metadados
    return data.tables.map(table => table.name);
  } catch (erro) {
    console.error(`Erro ao listar tabelas (método alternativo): ${erro.message}`);
    
    // Retornar lista de tabelas conhecidas como último recurso
    return [
      'users',
      'profiles',
      'players',
      'communities',
      'community_members',
      'community_organizers',
      'competitions',
      'competition_members',
      'games',
      'game_players',
      'activities'
    ];
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
        .insert(lote);
      
      if (error) {
        console.error(`Erro ao importar lote para tabela ${tabela}:`, error.message);
        return false;
      }
      
      console.log(`Importado lote ${Math.floor(i/TAMANHO_LOTE) + 1} de ${Math.ceil(dados.length/TAMANHO_LOTE)} para tabela ${tabela}.`);
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
    
    // Listar tabelas do projeto de origem
    console.log('\nListando tabelas do projeto de origem...');
    let tabelas = await listarTabelas(supabaseProducao);
    
    // Se o método principal falhar, tentar método alternativo
    if (!tabelas || tabelas.length === 0) {
      console.log('Método principal para listar tabelas falhou, tentando método alternativo...');
      tabelas = await listarTabelasAlternativo(supabaseProducao);
    }
    
    if (!tabelas || tabelas.length === 0) {
      console.error('Nenhuma tabela encontrada no projeto de origem.');
      process.exit(1);
    }
    
    console.log('\nTabelas encontradas:');
    tabelas.forEach((tabela, index) => {
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
      tabelasSelecionadas = tabelas;
    } else {
      const indices = resposta.split(',').map(num => parseInt(num.trim()) - 1);
      tabelasSelecionadas = indices.map(i => tabelas[i]).filter(t => t);
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
  }
}

// Executar a função principal
migrarTabelas();