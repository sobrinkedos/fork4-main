// Script para gerar comandos SQL individuais para corrigir políticas no Supabase
const fs = require('fs');
const path = require('path');

// Caminho para o arquivo de migração
const migrationFilePath = path.resolve(__dirname, '../../supabase/migrations/20250403_fix_infinite_recursion.sql');

// Função para dividir o SQL em comandos individuais
function dividirComandosSQL(sql) {
  // Dividir o SQL em comandos individuais
  const comandos = sql.split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0)
    .map(cmd => cmd + ';');
  
  return comandos;
}

// Função para gerar os arquivos de comandos
function gerarArquivosComandos(comandos) {
  // Criar diretório para os comandos se não existir
  const outputDir = path.resolve(__dirname, '../comandos-sql');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Gerar um arquivo para cada grupo de comandos
  const grupos = [
    { nome: '1-desativar-rls', descricao: 'Desativar RLS', inicio: 0, fim: 1 },
    { nome: '2-remover-policies-communities', descricao: 'Remover políticas de communities', inicio: 2, fim: 9 },
    { nome: '3-remover-policies-organizers', descricao: 'Remover políticas de community_organizers', inicio: 10, fim: 17 },
    { nome: '4-criar-policies-communities', descricao: 'Criar novas políticas para communities', inicio: 18, fim: 21 },
    { nome: '5-criar-policies-organizers', descricao: 'Criar novas políticas para community_organizers', inicio: 22, fim: 25 },
    { nome: '6-reativar-rls', descricao: 'Reativar RLS', inicio: 26, fim: 27 }
  ];
  
  // Gerar um arquivo para cada grupo
  for (const grupo of grupos) {
    const comandosGrupo = comandos.slice(grupo.inicio, grupo.fim + 1);
    const conteudo = `-- ${grupo.descricao}\n\n${comandosGrupo.join('\n\n')}`;
    
    const outputFile = path.join(outputDir, `${grupo.nome}.sql`);
    fs.writeFileSync(outputFile, conteudo);
    console.log(`Arquivo gerado: ${outputFile}`);
  }
  
  // Gerar um arquivo com todos os comandos
  const todosComandos = `-- Todos os comandos para corrigir políticas\n\n${comandos.join('\n\n')}`;
  const outputFileTodos = path.join(outputDir, 'todos-comandos.sql');
  fs.writeFileSync(outputFileTodos, todosComandos);
  console.log(`Arquivo gerado: ${outputFileTodos}`);
}

// Função principal
function main() {
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(migrationFilePath)) {
      console.error(`Arquivo de migração não encontrado: ${migrationFilePath}`);
      return;
    }
    
    // Ler conteúdo do arquivo
    const sqlContent = fs.readFileSync(migrationFilePath, 'utf8');
    console.log(`Conteúdo carregado: ${sqlContent.length} caracteres`);
    
    // Dividir o SQL em comandos individuais
    const comandos = dividirComandosSQL(sqlContent);
    console.log(`Total de comandos SQL: ${comandos.length}`);
    
    // Gerar arquivos de comandos
    gerarArquivosComandos(comandos);
    
    console.log('\nInstruções para corrigir as políticas no Supabase:');
    console.log('1. Acesse o painel do Supabase em https://app.supabase.io');
    console.log('2. Selecione seu projeto');
    console.log('3. Vá para a seção "SQL Editor" ou "Editor SQL"');
    console.log('4. Crie uma nova consulta');
    console.log('5. Cole o conteúdo de cada arquivo gerado na pasta "comandos-sql" e execute-os na ordem numérica');
    console.log('6. Alternativamente, você pode executar o arquivo "todos-comandos.sql" de uma vez só');
    
  } catch (err) {
    console.error(`Erro: ${err.message}`);
  }
}

// Executar o script
main();
