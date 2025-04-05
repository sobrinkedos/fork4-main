# Gerenciamento de Ambientes no DominoApp

Este documento descreve como o DominoApp gerencia diferentes ambientes (desenvolvimento e produção) para as configurações do Supabase e outras integrações, utilizando dois projetos Supabase distintos.

## Estrutura de Arquivos

O projeto utiliza os seguintes arquivos para gerenciar os ambientes:

- `.env.development`: Contém as variáveis de ambiente para o ambiente de desenvolvimento (banco `domino_new`)
- `.env.production`: Contém as variáveis de ambiente para o ambiente de produção (banco `domino`)
- `.env`: Arquivo gerado automaticamente pelo script de alternância de ambiente

## Variáveis de Ambiente

As seguintes variáveis de ambiente são configuradas para cada ambiente:

### Supabase
- `EXPO_PUBLIC_SUPABASE_URL`: URL da instância do Supabase (diferente para cada ambiente)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima para autenticação no Supabase (diferente para cada ambiente)
- `EXPO_PUBLIC_SUPABASE_BRANCH`: Mantido por compatibilidade, sempre definido como 'main'

### Integração com WhatsApp (N8N)
- `N8N_BASE_URL`: URL base do servidor N8N
- `N8N_API_KEY`: Chave de API para autenticação no N8N
- `N8N_WORKFLOW_*`: IDs dos workflows no N8N para diferentes operações

### Integração com WhatsApp (Evolution API)
- `EVOLUTION_API_BASE_URL`: URL base da Evolution API
- `EVOLUTION_API_KEY`: Chave de API para autenticação na Evolution API
- `EVOLUTION_API_INSTANCE`: Instância do WhatsApp a ser utilizada

## Como Alternar Entre Ambientes

O projeto inclui scripts para facilitar a alternância entre ambientes:

```bash
# Alternar para ambiente de desenvolvimento
npm run env:dev

# Alternar para ambiente de produção
npm run env:prod
```

Estes comandos copiam o arquivo de configuração correspondente (`.env.development` ou `.env.production`) para o arquivo `.env` que é utilizado pela aplicação.

## Estratégia de Ambientes Separados

Devido às limitações do plano gratuito do Supabase, que não permite a criação de branches de banco de dados, adotamos uma estratégia alternativa para separar os ambientes de desenvolvimento e produção. Em vez de usar branches dentro de um único projeto Supabase, utilizamos dois projetos Supabase distintos:

- **Ambiente de Desenvolvimento**: Projeto `domino_new` (https://dwsnwsxdkekkaeabiqrw.supabase.co)
- **Ambiente de Produção**: Projeto `domino` (https://evakdtqrtpqiuqhetkqr.supabase.co)

### Sincronização Entre Ambientes

Como estamos utilizando dois bancos de dados separados, é necessário sincronizar manualmente as alterações entre os ambientes. Recomendamos o seguinte fluxo de trabalho:

1. Desenvolva e teste todas as alterações no ambiente de desenvolvimento
2. Quando as alterações estiverem prontas para produção, crie scripts SQL para aplicar as mesmas alterações no banco de dados de produção
3. Aplique os scripts SQL no ambiente de produção

### Exemplo de Sincronização

```bash
# 1. Crie um arquivo SQL com as alterações necessárias
# 2. Conecte-se ao banco de dados de produção através do painel do Supabase
# 3. Execute o script SQL no editor SQL do Supabase
```

### Documentação Detalhada

Para mais informações sobre como gerenciar os ambientes separados, consulte:

- [Estratégia de Ambientes](./estrategia-ambientes.md)
- [Guia de Migração Entre Ambientes](./migracao-entre-ambientes.md)

## Configuração no Vercel

O arquivo `vercel.json` foi configurado para usar variáveis de ambiente condicionais baseadas no ambiente de execução:

- `production`: Usa as variáveis de ambiente de produção
- `preview`: Usa as variáveis de ambiente de desenvolvimento
- `development`: Usa as variáveis de ambiente de desenvolvimento

As variáveis de ambiente devem ser configuradas no painel do Vercel para cada ambiente.

## Boas Práticas

1. **Nunca comite os arquivos `.env.*` no repositório**. Eles estão incluídos no `.gitignore`.
2. Mantenha uma cópia de backup dos arquivos `.env.*` em um local seguro.
3. Ao adicionar novas variáveis de ambiente, atualize ambos os arquivos `.env.development` e `.env.production`.
4. Ao implantar em produção, verifique se as variáveis de ambiente estão corretamente configuradas no Vercel.
5. Documente todas as alterações de esquema para facilitar a sincronização entre ambientes.
6. Considere criar scripts de migração para automatizar a sincronização entre ambientes.