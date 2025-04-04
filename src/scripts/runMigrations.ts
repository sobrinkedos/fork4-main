import fs from 'fs';
import path from 'path';
import { supabaseMCP } from '../lib/supabaseMCP';

// Diretório onde estão os arquivos de migração
const MIGRATIONS_DIR = path.resolve(__dirname, '../../supabase/migrations');

/**
 * Função para executar um arquivo SQL no Supabase
 * @param filePath Caminho completo para o arquivo SQL
 */
async function executeSqlFile(filePath: string): Promise<void> {
  try {
    console.log(`Executando arquivo: ${path.basename(filePath)}`);
    
    // Lê o conteúdo do arquivo SQL
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Executa o SQL usando o cliente Supabase
    const { error } = await supabaseMCP.rpc('exec_sql', {
      query: sqlContent
    });
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Arquivo ${path.basename(filePath)} executado com sucesso!`);
  } catch (error) {
    console.error(`❌ Erro ao executar ${path.basename(filePath)}:`, error);
    throw error;
  }
}

/**
 * Função para executar todos os arquivos SQL de migração
 * @param onlyLatest Se true, executa apenas os arquivos mais recentes (últimos 5)
 */
async function runMigrations(onlyLatest: boolean = true): Promise<void> {
  try {
    // Verifica se o diretório de migrações existe
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      throw new Error(`Diretório de migrações não encontrado: ${MIGRATIONS_DIR}`);
    }
    
    // Lista todos os arquivos SQL no diretório de migrações
    let sqlFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ordena alfabeticamente (geralmente por data se os arquivos seguem o padrão YYYYMMDD_)
    
    // Se onlyLatest for true, pega apenas os 5 arquivos mais recentes
    if (onlyLatest && sqlFiles.length > 5) {
      sqlFiles = sqlFiles.slice(-5);
      console.log('Executando apenas os 5 arquivos mais recentes...');
    }
    
    if (sqlFiles.length === 0) {
      console.log('Nenhum arquivo SQL encontrado para migração.');
      return;
    }
    
    console.log(`Encontrados ${sqlFiles.length} arquivos SQL para execução.`);
    
    // Executa cada arquivo SQL em sequência
    for (const file of sqlFiles) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      await executeSqlFile(filePath);
    }
    
    console.log('✅ Todas as migrações foram executadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
    process.exit(1);
  }
}

// Executa as migrações quando o script é chamado diretamente
if (require.main === module) {
  const onlyLatest = process.argv.includes('--latest');
  runMigrations(onlyLatest);
}

export { runMigrations, executeSqlFile };
