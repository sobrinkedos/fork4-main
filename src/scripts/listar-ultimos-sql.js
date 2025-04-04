// Script simples para listar os últimos arquivos SQL
const fs = require('fs');
const path = require('path');

// Diretório onde estão os arquivos de migração
const MIGRATIONS_DIR = path.resolve(__dirname, '../../supabase/migrations');

// Função principal
function listarUltimosSql() {
  console.log('Listando os últimos arquivos SQL para migração no Supabase...');
  
  try {
    // Verificar se o diretório existe
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      console.log(`Diretório não encontrado: ${MIGRATIONS_DIR}`);
      return;
    }
    
    // Listar arquivos SQL
    const arquivos = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ordena alfabeticamente
    
    if (arquivos.length === 0) {
      console.log('Nenhum arquivo SQL encontrado.');
      return;
    }
    
    // Pegar os 5 mais recentes
    const ultimosArquivos = arquivos.slice(-5);
    
    console.log(`\nTotal de arquivos SQL: ${arquivos.length}`);
    console.log(`\nÚltimos 5 arquivos SQL:`);
    
    // Exibir cada arquivo e seu conteúdo
    for (let i = 0; i < ultimosArquivos.length; i++) {
      const arquivo = ultimosArquivos[i];
      const caminhoCompleto = path.join(MIGRATIONS_DIR, arquivo);
      const conteudo = fs.readFileSync(caminhoCompleto, 'utf8');
      
      console.log(`\n[${i+1}] ${arquivo}`);
      console.log('----------------------------------------');
      console.log(conteudo);
      console.log('----------------------------------------');
    }
    
    console.log('\nInstruções para migração manual:');
    console.log('1. Acesse o painel do Supabase (https://app.supabase.io)');
    console.log('2. Vá para o SQL Editor');
    console.log('3. Crie uma nova consulta');
    console.log('4. Copie e cole o conteúdo de cada arquivo SQL listado acima');
    console.log('5. Execute cada consulta separadamente');
  } catch (erro) {
    console.log('Erro ao listar arquivos:', erro.message);
  }
}

// Executar função
listarUltimosSql();
