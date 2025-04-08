# Solução para Migração de Tabelas entre Projetos Supabase

## Problema Identificado

Após análise do ambiente, foi identificado que **nenhuma das tabelas** do banco de dados de produção (domino) foi migrada para o banco de dados de desenvolvimento (domino_dev). A verificação mostrou que todas as 9 tabelas exportadas não existem no ambiente de desenvolvimento:

1. activities
2. communities
3. community_members
4. community_organizers
5. competition_members
6. competitions
7. games
8. players
9. profiles

## Causa do Problema

O problema ocorre porque o script de migração (`scripts/migrar-tabelas-supabase-melhorado.js`) depende de duas variáveis de ambiente que não estão definidas:

- `SUPABASE_PROD_SERVICE_ROLE_KEY` - Chave de serviço do projeto de produção
- `SUPABASE_DEV_SERVICE_ROLE_KEY` - Chave de serviço do projeto de desenvolvimento

Sem estas chaves, o script não consegue autenticar-se com permissões suficientes para realizar a migração.

## Solução

Para resolver o problema e migrar as tabelas corretamente, siga os passos abaixo:

### 1. Obter as Chaves de Serviço (Service Role Keys)

Para cada projeto Supabase (produção e desenvolvimento), você precisa obter a chave de serviço:

1. Acesse o dashboard do Supabase para o projeto de produção (domino): https://evakdtqrtpqiuqhetkqr.supabase.co
2. Vá para Configurações > API
3. Na seção "Project API keys", copie a chave "service_role" (NÃO a anon key)
4. Repita o processo para o projeto de desenvolvimento (domino_dev): https://dwsnwsxdkekkaeabiqrw.supabase.co

### 2. Definir as Variáveis de Ambiente

No Windows, abra o PowerShell e defina as variáveis de ambiente:

```powershell
$env:SUPABASE_PROD_SERVICE_ROLE_KEY="sua_chave_de_producao_aqui"
$env:SUPABASE_DEV_SERVICE_ROLE_KEY="sua_chave_de_desenvolvimento_aqui"
```

### 3. Executar o Script de Migração

Agora execute o script de migração:

```powershell
node scripts/migrar-tabelas-supabase-melhorado.js
```

O script irá:
1. Listar as tabelas disponíveis no ambiente de produção
2. Perguntar quais tabelas você deseja migrar (escolha "todas")
3. Confirmar a operação
4. Exportar os dados das tabelas selecionadas
5. Importar os dados para o ambiente de desenvolvimento

### 4. Verificar a Migração

Após a conclusão do script, você pode verificar se as tabelas foram migradas corretamente executando:

```powershell
node scripts/comparar-tabelas-domino-dev.js
```

## Observações Importantes

- As chaves de serviço (service_role) têm permissões elevadas. Nunca as compartilhe ou inclua em código-fonte versionado.
- As variáveis de ambiente definidas no PowerShell são temporárias e válidas apenas para a sessão atual.
- Para definir as variáveis de ambiente permanentemente, você pode configurá-las nas variáveis de ambiente do sistema ou usar um arquivo .env com uma biblioteca como dotenv.
- Se você estiver usando outro sistema operacional (Linux/Mac), o comando para definir as variáveis de ambiente seria:
  ```bash
  export SUPABASE_PROD_SERVICE_ROLE_KEY="sua_chave_de_producao_aqui"
  export SUPABASE_DEV_SERVICE_ROLE_KEY="sua_chave_de_desenvolvimento_aqui"
  ```

## Alternativa: Migração Manual

Se o script automatizado não funcionar, você pode realizar a migração manualmente:

1. Os dados já foram exportados e estão disponíveis na pasta `temp/` como arquivos JSON
2. Você pode importar esses dados manualmente usando a interface do Supabase ou SQL