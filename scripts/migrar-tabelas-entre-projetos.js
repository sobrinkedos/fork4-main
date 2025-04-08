/**
 * Script para migrar tabelas entre projetos Supabase
 * 
 * Este script exporta tabelas do projeto de produção (domino) e as importa no projeto de desenvolvimento (domino_dev)
 * 
 * Uso: node scripts/migrar-tabelas-entre-projetos.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configurações dos projetos Supabase
const PROJETOS = {
  producao: {
    nome: 'domino',
    url: 'https://evakdtqrtpqiuqhetkqr.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YWtkdHFydHBxaXVxaGV0a3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNjk1MjQsImV4cCI6MjA1NDk0NTUyNH0.Ms4VB9QGBBcWMZPJ5j5Oanl3RD1SeECp7twFb_riPAI',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YWtkdHFydHBxaXVxaGV0a3FyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTM2OTUyNCwiZXhwIjoyMDU0OTQ1NTI0fQ.TLgSEhrgsxhQ_png34HGvhCXbxY-xBo0YEpx8M6HCS0',
    senha: 'l6oieWz4LtSuv8Uy'
  },
  desenvolvimento: {
    nome: 'domino_dev',
    url: 'https://dwsnwsxdkekkaeabiqrw.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3c253c3hka2Vra2FlYWJpcXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MTQ2MTIsImV4cCI6MjA1OTM5MDYxMn0.xixg7V4Jqsny1kJMrJ6b49F5UtwuME9Lv4wY8AiTcxw',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3c253c3hka2Vra2FlYWJpcXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzgxNDYxMiwiZXhwIjoyMDU5MzkwNjEyfQ.7TE_sKGfsDjrz4VL1TfG7ACYJqZpwC822IBT8REJaYM',
    senha: 'l6oieWz4LtSuv8Uy'
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

/**
 * Executa um comando e retorna a saída
 */
function executarComando(comando) {
  try {
    console.log(`Executando: ${comando}`);
    const saida = execSync(comando, { encoding: 'utf8' });
    return saida.trim();
  } catch (erro) {
    console.error(`Erro ao executar comando: ${erro.message}`);
    if (erro.stdout) console.error(erro.stdout);
    if (erro.stderr) console.error(erro.stderr);
    return null;
  }
}

/**
 * Lista todas as tabelas do projeto
 */
async function listarTabelas(projeto) {
  const comando = `psql "postgresql://postgres:${projeto.senha}@${projeto.url.replace('https://', '')}:5432/postgres" -c "\\dt public.*" -t`;
  
  try {
    const saida = executarComando(comando);
    if (!saida) return [];
    
    // Extrair nomes das tabelas da saída do psql
    const tabelas = saida
      .split('\n')
      .map(linha => linha.trim())
      .filter(linha => linha.length > 0)
      .map(linha => {
        const partes = linha.split('|');
        return partes.length > 2 ? partes[1].trim() : null;
      })
      .filter(tabela => tabela && !tabela.startsWith('_'));
    
    return tabelas;
  } catch (erro) {
    console.error(`Erro ao listar tabelas: ${erro.message}`);
    return [];
  }
}

/**
 * Exporta uma tabela do projeto de origem
 */
async function exportarTabela(projeto, tabela) {
  const arquivoSaida = path.join(TEMP_DIR, `${tabela}.sql`);
  const comando = `psql "postgresql://postgres:${projeto.senha}@${projeto.url.replace('https://', '')}:5432/postgres" -c "\\COPY public.${tabela} TO '${arquivoSaida}' WITH CSV HEADER"`;
  
  const resultado = executarComando(comando);
  if (resultado) {
    console.log(`Tabela ${tabela} exportada com sucesso para ${arquivoSaida}`);
    return arquivoSaida;
  }
  return null;
}

/**
 * Importa uma tabela para o projeto de destino
 */
async function importarTabela(projeto, tabela, arquivoOrigem) {
  // Primeiro, limpar a tabela de destino
  const comandoLimpar = `psql "postgresql://postgres:${projeto.senha}@${projeto.url.replace('https://', '')}:5432/postgres" -c "TRUNCATE public.${tabela} CASCADE"`;
  executarComando(comandoLimpar);
  
  // Depois, importar os dados
  const comando = `psql "postgresql://postgres:${projeto.senha}@${projeto.url.replace('https://', '')}:5432/postgres" -c "\\COPY public.${tabela} FROM '${arquivoOrigem}' WITH CSV HEADER"`;
  
  const resultado = executarComando(comando);
  if (resultado) {
    console.log(`Tabela ${tabela} importada com sucesso para o projeto ${projeto.nome}`);
    return true;
  }
  return false;
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
    const tabelas = await listarTabelas(PROJETOS.producao);
    
    if (tabelas.length === 0) {
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
      
      // Exportar tabela do projeto de origem
      console.log(`Exportando tabela ${tabela} do projeto ${PROJETOS.producao.nome}...`);
      const arquivoExportado = await exportarTabela(PROJETOS.producao, tabela);
      
      if (!arquivoExportado) {
        console.error(`Falha ao exportar tabela ${tabela}. Pulando para a próxima.`);
        continue;
      }
      
      // Importar tabela para o projeto de destino
      console.log(`Importando tabela ${tabela} para o projeto ${PROJETOS.desenvolvimento.nome}...`);
      const sucesso = await importarTabela(PROJETOS.desenvolvimento, tabela, arquivoExportado);
      
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