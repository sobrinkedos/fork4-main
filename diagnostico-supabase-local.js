// Script para diagnosticar problemas de conexão com o Supabase local
const http = require('http');
const https = require('https');

// Configuração do Supabase local
const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Função para fazer uma requisição HTTP simples
function fazerRequisicaoHttp(url, apiKey) {
  return new Promise((resolve, reject) => {
    console.log(`Fazendo requisição para: ${url}`);
    
    // Determinar qual módulo usar com base no protocolo
    const client = url.startsWith('https') ? https : http;
    
    const options = {
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 5 segundos de timeout
    };

    const req = client.get(url, options, (res) => {
      let data = '';
      
      // Log do status da resposta
      console.log(`Status da resposta: ${res.statusCode}`);
      console.log(`Cabeçalhos da resposta:`, res.headers);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      console.error(`Erro na requisição: ${error.message}`);
      if (error.code === 'ECONNREFUSED') {
        console.log('Conexão recusada. O servidor não está aceitando conexões nesta porta.');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('Timeout na conexão. O servidor não respondeu a tempo.');
      }
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout na requisição'));
    });

    req.end();
  });
}

// Função para testar diferentes endpoints do Supabase
async function diagnosticarConexao() {
  console.log('=== DIAGNÓSTICO DE CONEXÃO COM SUPABASE LOCAL ===');
  console.log(`URL base: ${supabaseUrl}`);
  console.log(`Chave API: ${supabaseKey ? '[PRESENTE]' : '[AUSENTE]'}`);
  console.log('\n');

  // Lista de endpoints para testar
  const endpoints = [
    '/rest/v1/',                // API REST
    '/auth/v1/token?grant_type=password', // Auth
    '/storage/v1/object/list', // Storage
    '/realtime/v1/socket'      // Realtime
  ];

  for (const endpoint of endpoints) {
    const url = `${supabaseUrl}${endpoint}`;
    console.log(`\n--- Testando endpoint: ${endpoint} ---`);
    
    try {
      const resposta = await fazerRequisicaoHttp(url, supabaseKey);
      console.log(`Resposta (${resposta.statusCode}):`, resposta.data.substring(0, 200) + (resposta.data.length > 200 ? '...' : ''));
    } catch (erro) {
      console.error(`Falha ao acessar ${endpoint}:`, erro.message);
    }
  }

  console.log('\n=== VERIFICAÇÃO DE PORTAS ===');
  // Verificar se as portas estão acessíveis
  const portas = [54321, 54322, 54323];
  for (const porta of portas) {
    const url = `http://localhost:${porta}`;
    console.log(`\n--- Verificando porta ${porta} ---`);
    
    try {
      await fazerRequisicaoHttp(url, '');
      console.log(`Porta ${porta} está acessível`);
    } catch (erro) {
      console.error(`Porta ${porta} não está acessível:`, erro.message);
    }
  }

  console.log('\n=== RECOMENDAÇÕES ===');
  console.log('1. Verifique se todos os contêineres Docker estão rodando: docker ps');
  console.log('2. Reinicie os contêineres: docker-compose restart');
  console.log('3. Verifique os logs do Kong: docker logs fork4-main-kong-1');
  console.log('4. Verifique se o firewall está bloqueando as conexões');
  console.log('5. Tente acessar o Supabase Studio: http://localhost:54323');
}

// Executar o diagnóstico
diagnosticarConexao();