# Gerenciamento de Ambientes Supabase com Database Branching

Este documento descreve como configurar e gerenciar ambientes separados (desenvolvimento e produção) no DominoApp utilizando o recurso de Database Branching do Supabase.

## Visão Geral

O Database Branching do Supabase permite criar uma cópia completa do banco de dados principal para desenvolvimento, possibilitando testar alterações sem afetar o ambiente de produção. Após validar as alterações, é possível aplicá-las ao ambiente de produção de forma segura.

## Pré-requisitos

- Conta Supabase com plano que suporte Database Branching
- Supabase CLI instalado localmente
- Acesso ao projeto Supabase

## Configuração Inicial

### 1. Instalação e Configuração da Supabase CLI

Se ainda não tiver a Supabase CLI instalada, execute:

```bash
npm install supabase --save-dev
```

Faça login na sua conta Supabase:

```bash
npx supabase login
```

Vincule seu projeto local ao projeto Supabase:

```bash
npx supabase link --project-ref <ref-do-seu-projeto>
```

### 2. Criação do Branch de Desenvolvimento

Crie um branch de desenvolvimento a partir do banco de dados principal:

```bash
npx supabase db branch create development
```

Este comando criará uma cópia completa do seu banco de dados de produção em um novo branch chamado "development".

### 3. Configuração dos Arquivos de Ambiente

Atualize os arquivos `.env.development` e `.env.production` para apontar para os ambientes corretos:

#### .env.development

```
# Ambiente de Desenvolvimento

# Supabase - Branch de Desenvolvimento
EXPO_PUBLIC_SUPABASE_URL=https://evakdtqrtpqiuqhetkqr.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<chave-do-branch-development>
EXPO_PUBLIC_SUPABASE_BRANCH=development

# Outras configurações...
```

#### .env.production

```
# Ambiente de Produção

# Supabase - Branch Principal
EXPO_PUBLIC_SUPABASE_URL=https://evakdtqrtpqiuqhetkqr.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<chave-do-branch-principal>
EXPO_PUBLIC_SUPABASE_BRANCH=main

# Outras configurações...
```

## Fluxo de Trabalho

### Desenvolvimento de Novas Funcionalidades

1. Alterne para o ambiente de desenvolvimento:
   ```bash
   npm run env:dev
   ```

2. Desenvolva e teste suas alterações no branch de desenvolvimento.

3. Quando as alterações estiverem prontas, crie um script de migração:
   ```bash
   npx supabase db diff -f nome-da-migracao
   ```
   Isso criará um arquivo de migração na pasta `supabase/migrations/`.

### Aplicação das Alterações em Produção

1. Revise o script de migração gerado para garantir que ele faz exatamente o que você espera.

2. Aplique a migração ao branch principal:
   ```bash
   npx supabase db push
   ```

3. Alterne para o ambiente de produção:
   ```bash
   npm run env:prod
   ```

4. Verifique se as alterações foram aplicadas corretamente.

## Sincronização de Branches

### Atualizar o Branch de Desenvolvimento com Alterações da Produção

Para manter o branch de desenvolvimento atualizado com as alterações feitas diretamente no branch principal:

```bash
npx supabase db branch refresh development
```

### Mesclar Alterações do Branch de Desenvolvimento para Produção

Para aplicar todas as alterações do branch de desenvolvimento para o branch principal:

```bash
npx supabase db branch merge development
```

## Boas Práticas

1. **Sempre teste em desenvolvimento primeiro**: Nunca faça alterações diretamente no ambiente de produção.

2. **Mantenha scripts de migração**: Documente todas as alterações no esquema do banco de dados através de scripts de migração.

3. **Backup regular**: Faça backup regular do banco de dados de produção:
   ```bash
   npx supabase db dump -f backup-$(date +%Y%m%d)
   ```

4. **Revisão de código**: Sempre revise os scripts de migração antes de aplicá-los em produção.

5. **Documentação**: Mantenha a documentação atualizada sobre as alterações no esquema do banco de dados.

## Solução de Problemas

### Conflitos de Migração

Se ocorrerem conflitos durante a mesclagem de branches:

1. Identifique os conflitos:
   ```bash
   npx supabase db branch conflicts development
   ```

2. Resolva os conflitos manualmente editando os scripts de migração.

3. Tente mesclar novamente.

### Reversão de Alterações

Para reverter uma migração que causou problemas:

```bash
npx supabase db reset --no-backup
npx supabase db push
```

Isso reverterá o banco de dados para o estado anterior à última migração.

## Referências

- [Documentação do Supabase sobre Database Branching](https://supabase.com/docs/guides/platform/branching)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)