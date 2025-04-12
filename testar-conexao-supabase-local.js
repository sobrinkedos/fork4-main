// Script para testar a conexão com o Supabase local
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase local
const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function testarConexao() {
  console.log('Testando conexão com o Supabase local...');
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Chave anônima: ${supabaseKey ? '[PRESENTE]' : '[AUSENTE]'}`);

  try {
    // Tentar fazer uma consulta simples
    const { data, error } = await supabase
      .from('_migrations_log')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Erro ao conectar ao Supabase local:', error.message);
      console.error('Detalhes do erro:', error);
      
      // Verificar se é um erro de conexão recusada
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        console.log('\nPossíveis soluções:');
        console.log('1. Verifique se os contêineres Docker do Supabase estão em execução');
        console.log('2. Verifique se as portas 54321 e 54322 estão acessíveis');
        console.log('3. Verifique se o firewall está bloqueando as conexões');
        console.log('4. Tente reiniciar os contêineres com: docker-compose restart');
      }
    } else {
      console.log('Conexão com o Supabase local estabelecida com sucesso!');
      console.log('Dados retornados:', data);
    }
  } catch (err) {
    console.error('Erro ao executar a consulta:', err.message);
    console.error('Detalhes do erro:', err);
  }
}

// Executar o teste
testarConexao();