# Migração de Tabelas dev_ para Supabase Local

Este documento explica como usar o script para migrar tabelas com prefixo `dev_` do servidor Supabase remoto (domino_dev) para o servidor Supabase local.

## Pré-requisitos

- Node.js instalado
- Docker e Docker Compose instalados
- Servidor Supabase local em execução (via docker-compose)
- Acesso à internet para conectar ao servidor remoto

## Configuração do Ambiente Local

Antes de executar o script de migração, certifique-se de que o servidor Supabase local está em execução:

```bash
# Na pasta raiz do projeto
docker-compose up -d
```

Verifique se o Supabase Studio local está acessível em: http://localhost:54323

## Executando o Script de Migração

Para migrar as tabelas com prefixo `dev_` do servidor remoto para o local, execute:

```bash
node scripts/migrar-tabelas-dev-para-local.js
```

O script irá:

1. Listar todas as tabelas com prefixo `dev_` no servidor remoto
2. Permitir que você selecione quais tabelas deseja migrar
3. Exportar os dados das tabelas selecionadas
4. Criar as tabelas correspondentes no servidor local (se não existirem)
5. Importar os dados para o servidor local

## Verificando a Migração

Após a conclusão do script, você pode verificar se as tabelas foram migradas corretamente acessando o Supabase Studio local em http://localhost:54323 e navegando até a seção "Table Editor".

## Solução de Problemas

Se encontrar problemas durante a migração:

1. Verifique se o servidor Supabase local está em execução
2. Confirme se as credenciais no script estão corretas
3. Verifique os logs do Docker para identificar possíveis erros no servidor local:
   ```bash
   docker-compose logs
   ```
4. Os dados exportados são salvos na pasta `temp/` e podem ser usados para importação manual se necessário

## Observações

- Este script foi desenvolvido especificamente para migrar tabelas com prefixo `dev_`
- As tabelas no servidor local terão o mesmo nome que no servidor remoto (mantendo o prefixo `dev_`)
- O script tenta criar automaticamente a estrutura da tabela no servidor local se ela não existir