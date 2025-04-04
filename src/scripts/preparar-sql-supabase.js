// Script para preparar os arquivos SQL para execução manual no Supabase
const fs = require('fs');
const path = require('path');

// Diretório onde estão os arquivos de migração
const MIGRATIONS_DIR = path.resolve(__dirname, '../../supabase/migrations');

// Diretório de saída para os arquivos combinados
const OUTPUT_DIR = path.resolve(__dirname, '../../supabase/output');

// Função principal
function main() {
  console.log('Preparando arquivos SQL para execução no Supabase...');
  
  try {
    // Verificar se o diretório de migrações existe
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      console.error(`Diretório de migrações não encontrado: ${MIGRATIONS_DIR}`);
      return;
    }
    
    // Criar diretório de saída se não existir
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Listar todos os arquivos SQL no diretório de migrações
    let arquivosSQL = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ordena alfabeticamente (geralmente por data se os arquivos seguem o padrão YYYYMMDD_)
    
    if (arquivosSQL.length === 0) {
      console.log('Nenhum arquivo SQL encontrado para migração.');
      return;
    }
    
    // Pegar os 5 arquivos mais recentes
    const ultimosArquivos = arquivosSQL.slice(-5);
    console.log(`Encontrados ${arquivosSQL.length} arquivos SQL no total.`);
    console.log(`Preparando os 5 mais recentes:`);
    
    // Criar um arquivo combinado com todos os SQLs
    let sqlCombinado = '';
    let listaArquivos = '';
    
    for (const arquivo of ultimosArquivos) {
      console.log(`- ${arquivo}`);
      listaArquivos += `- ${arquivo}\n`;
      
      const caminhoArquivo = path.join(MIGRATIONS_DIR, arquivo);
      const conteudoSQL = fs.readFileSync(caminhoArquivo, 'utf8');
      
      sqlCombinado += `-- ==========================================\n`;
      sqlCombinado += `-- Arquivo: ${arquivo}\n`;
      sqlCombinado += `-- ==========================================\n\n`;
      sqlCombinado += conteudoSQL;
      sqlCombinado += '\n\n';
    }
    
    // Salvar o SQL combinado em um arquivo
    const dataHora = new Date().toISOString().replace(/[:.]/g, '-');
    const arquivoSaida = path.join(OUTPUT_DIR, `migracao_combinada_${dataHora}.sql`);
    fs.writeFileSync(arquivoSaida, sqlCombinado);
    
    // Salvar a lista de arquivos em um arquivo de texto
    const arquivoLista = path.join(OUTPUT_DIR, `lista_arquivos_${dataHora}.txt`);
    fs.writeFileSync(arquivoLista, listaArquivos);
    
    console.log(`\nArquivos SQL combinados salvos em: ${arquivoSaida}`);
    console.log(`Lista de arquivos salva em: ${arquivoLista}`);
    console.log('\nInstruções:');
    console.log('1. Abra o painel do Supabase (https://app.supabase.io)');
    console.log('2. Vá para o SQL Editor');
    console.log('3. Crie uma nova consulta');
    console.log('4. Copie e cole o conteúdo do arquivo combinado');
    console.log('5. Execute a consulta');
    
    // Exibir o conteúdo do arquivo combinado
    console.log('\n===== CONTEÚDO DO ARQUIVO COMBINADO =====');
    console.log(sqlCombinado);
  } catch (error) {
    console.error('Erro ao preparar arquivos SQL:', error);
  }
}

// Executar o script
main();
