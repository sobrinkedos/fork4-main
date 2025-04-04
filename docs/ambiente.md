# Gerenciamento de Ambientes no DominoApp

Este documento descreve como o DominoApp gerencia diferentes ambientes (desenvolvimento e produção) para as configurações do Supabase e outras integrações, utilizando o recurso de Database Branching do Supabase.

## Estrutura de Arquivos

O projeto utiliza os seguintes arquivos para gerenciar os ambientes:

- `.env.development`: Contém as variáveis de ambiente para o ambiente de desenvolvimento
- `.env.production`: Contém as variáveis de ambiente para o ambiente de produção
- `.env`: Arquivo gerado automaticamente pelo script de alternância de ambiente

## Variáveis de Ambiente

As seguintes variáveis de ambiente são configuradas para cada ambiente:

### Supabase
- `EXPO_PUBLIC_SUPABASE_URL`: URL da instância do Supabase
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima para autenticação no Supabase
- `EXPO_PUBLIC_SUPABASE_BRANCH`: Branch do banco de dados Supabase a ser utilizado (development ou main)

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

## Database Branching do Supabase

O projeto utiliza o recurso de Database Branching do Supabase para manter ambientes separados para desenvolvimento e produção. Isso permite testar alterações no banco de dados sem afetar o ambiente de produção.

### Branches Disponíveis

- `main`: Branch principal utilizado em produção
- `development`: Branch de desenvolvimento para testes

### Scripts para Gerenciamento de Branches

O projeto inclui scripts para facilitar o gerenciamento dos branches do Supabase:

```bash
# Criar branch de desenvolvimento
npm run supabase:create-dev

# Sincronizar branch de desenvolvimento com o branch principal
npm run supabase:sync-dev

# Mesclar alterações do branch de desenvolvimento para o branch principal
npm run supabase:merge-dev

# Gerar script de migração
npm run supabase:migration nome-da-migracao
```

### Documentação Detalhada

Para mais informações sobre como utilizar o Database Branching do Supabase, consulte:

- [Guia de Database Branching](./supabase-database-branching.md)
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