# Configuração do Supabase Local com Docker

Este documento descreve como configurar e usar uma instância local do Supabase usando Docker para desenvolvimento do DominoApp.

## Pré-requisitos

- [Docker](https://www.docker.com/products/docker-desktop/) instalado e funcionando
- [Docker Compose](https://docs.docker.com/compose/install/) instalado (geralmente vem com o Docker Desktop)
- [Node.js](https://nodejs.org/) instalado (para usar a CLI do Supabase)

## Iniciando o Supabase Local

1. Navegue até a pasta raiz do projeto onde está o arquivo `docker-compose.yml`

2. Execute o comando para iniciar os serviços:

   ```bash
   docker-compose up -d
   ```

3. Aguarde até que todos os serviços estejam em execução. Isso pode levar alguns minutos na primeira vez.

4. Acesse o Supabase Studio em: http://localhost:54323

## Configuração da Aplicação para Usar o Supabase Local

Para configurar o DominoApp para usar o Supabase local em vez do ambiente de desenvolvimento ou produção, você precisa atualizar as variáveis de ambiente:

1. Crie ou edite o arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

   ```
   EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
   EXPO_PUBLIC_SUPABASE_BRANCH=main
   ```

2. Reinicie sua aplicação para que ela use as novas variáveis de ambiente.

## Migrando Dados para o Ambiente Local

Você pode migrar o esquema e os dados do seu ambiente de desenvolvimento ou produção para o ambiente local:

### Usando a CLI do Supabase

1. Instale a CLI do Supabase globalmente (se ainda não tiver):

   ```bash
   npm install -g supabase
   ```

2. Faça login na CLI do Supabase:

   ```bash
   npx supabase login
   ```

3. Obtenha o esquema do banco de dados remoto:

   ```bash
   npx supabase db dump -f schema.sql --db-url postgresql://postgres:postgres@localhost:54322/postgres
   ```

4. Aplique o esquema ao banco de dados local:

   ```bash
   npx supabase db reset --db-url postgresql://postgres:postgres@localhost:54322/postgres
   ```

### Migrando Manualmente

Alternativamente, você pode exportar dados do ambiente remoto e importá-los localmente:

1. No Supabase Studio remoto, vá para a seção SQL e exporte os dados necessários.
2. No Supabase Studio local (http://localhost:54323), vá para a seção SQL e importe os dados.

## Parando o Ambiente Local

Para parar todos os serviços do Supabase:

```bash
docker-compose down
```

Para parar e remover todos os volumes (isso apagará todos os dados):

```bash
docker-compose down -v
```

## Solução de Problemas

### Verificando Logs

Para ver os logs de todos os serviços:

```bash
docker-compose logs
```

Para ver os logs de um serviço específico (por exemplo, o banco de dados):

```bash
docker-compose logs supabase-db
```

### Reiniciando Serviços

Se um serviço específico não estiver funcionando corretamente, você pode reiniciá-lo:

```bash
docker-compose restart [nome-do-serviço]
```

Por exemplo:

```bash
docker-compose restart supabase-db
```

## Alternando Entre Ambientes

Para alternar entre o ambiente local e os ambientes remotos (desenvolvimento/produção), você pode usar o script `switch-env.js` existente no projeto, adicionando a opção para o ambiente local.

## Observações Importantes

- O ambiente local usa chaves JWT diferentes das usadas nos ambientes remotos.
- As políticas RLS (Row Level Security) precisam ser configuradas manualmente no ambiente local ou migradas dos ambientes remotos.
- Recomenda-se usar o ambiente local apenas para desenvolvimento e testes, não para produção.