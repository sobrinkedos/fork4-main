/**
 * Script para alternar entre ambientes de desenvolvimento e produção
 * 
 * Uso: node scripts/switch-env.js [dev|prod]
 */

const fs = require('fs');
const path = require('path');

// Obter o ambiente a partir dos argumentos da linha de comando
const args = process.argv.slice(2);
const env = args[0] || 'dev';

// Validar o ambiente
if (env !== 'dev' && env !== 'prod') {
  console.error('Erro: O ambiente deve ser "dev" ou "prod"');
  console.log('Uso: node scripts/switch-env.js [dev|prod]');
  process.exit(1);
}

// Mapear o argumento para o nome do arquivo
const envFile = env === 'dev' ? '.env.development' : '.env.production';
const targetFile = '.env';

// Caminhos dos arquivos
const rootDir = path.resolve(__dirname, '..');
const sourceFilePath = path.join(rootDir, envFile);
const targetFilePath = path.join(rootDir, targetFile);

// Verificar se o arquivo de origem existe
if (!fs.existsSync(sourceFilePath)) {
  console.error(`Erro: O arquivo ${envFile} não foi encontrado.`);
  process.exit(1);
}

// Copiar o arquivo de ambiente para .env
try {
  const envContent = fs.readFileSync(sourceFilePath, 'utf8');
  fs.writeFileSync(targetFilePath, envContent);
  console.log(`✅ Ambiente alterado para ${env === 'dev' ? 'DESENVOLVIMENTO' : 'PRODUÇÃO'}`);
  console.log(`Arquivo ${envFile} copiado para ${targetFile}`);
} catch (error) {
  console.error(`Erro ao alternar ambiente: ${error.message}`);
  process.exit(1);
}