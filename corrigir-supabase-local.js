// Script para corrigir problemas com o Supabase local
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Função para executar comandos e capturar a saída
function executarComando(comando) {
  console.log(`Executando: ${comando}`);
  try {
    const saida = execSync(comando, { encoding: 'utf8' });
    return { sucesso: true, saida };
  } catch (erro) {
    return { sucesso: false, erro: erro.message, saida: erro.stdout };
  }
}

// Função para verificar se um diretório existe
function verificarDiretorio(caminho) {
  try {
    return fs.existsSync(caminho) && fs.statSync(caminho).isDirectory();
  } catch (erro) {
    return false;
  }
}

// Função principal para corrigir problemas do Supabase local
async function corrigirSupabaseLocal() {
  console.log('=== CORREÇÃO DE PROBLEMAS DO SUPABASE LOCAL ===');
  
  // 1. Parar todos os contêineres
  console.log('\n1. Parando todos os contêineres Docker do Supabase...');
  executarComando('docker-compose down');
  
  // 2. Verificar e limpar volumes problemáticos
  console.log('\n2. Verificando volumes do Docker...');
  const volumesResult = executarComando('docker volume ls');
  
  if (volumesResult.sucesso) {
    console.log('Volumes encontrados:');
    console.log(volumesResult.saida);
    
    // Verificar se existem volumes do Supabase
    if (volumesResult.saida.includes('fork4-main_db-data')) {
      console.log('\nVolume do banco de dados encontrado. Fazendo backup antes de remover...');
      
      // Criar diretório de backup se não existir
      const backupDir = path.join(__dirname, 'supabase-backup');
      if (!verificarDiretorio(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // Backup do volume (opcional, pode ser comentado se não for necessário)
      // executarComando(`docker run --rm -v fork4-main_db-data:/data -v ${backupDir}:/backup alpine tar -czf /backup/db-data-backup-${Date.now()}.tar.gz /data`);
      
      console.log('\nRemovendo volume do banco de dados para resolver problemas de corrupção...');
      executarComando('docker volume rm fork4-main_db-data');
    }
  }
  
  // 3. Iniciar os contêineres novamente
  console.log('\n3. Iniciando os contêineres novamente...');
  executarComando('docker-compose up -d');
  
  // 4. Aguardar inicialização
  console.log('\n4. Aguardando inicialização dos serviços (30 segundos)...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  // 5. Verificar status
  console.log('\n5. Verificando status dos contêineres...');
  const statusResult = executarComando('docker ps');
  console.log(statusResult.saida);
  
  // 6. Testar conexão
  console.log('\n6. Testando conexão com o Supabase...');
  console.log('Executando script de diagnóstico...');
  executarComando('node diagnostico-supabase-local.js');
  
  console.log('\n=== RECOMENDAÇÕES FINAIS ===');
  console.log('1. Se o problema persistir, verifique se há espaço suficiente em disco');
  console.log('2. Verifique se o Docker tem permissões suficientes');
  console.log('3. Reinicie o Docker Desktop completamente');
  console.log('4. Verifique se há conflitos de porta (54321, 54322, 54323)');
  console.log('5. Acesse o Supabase Studio em: http://localhost:54323');
}

// Executar a função principal
corrigirSupabaseLocal();