# Guia de Ambientes: Produção e Desenvolvimento

Este documento explica como trabalhar com os ambientes separados de produção e desenvolvimento no projeto Fork4.

## Visão Geral

Implementamos uma solução que permite trabalhar com dois ambientes de banco de dados separados:

- **Ambiente de Produção**: Usa as tabelas padrão do Supabase (sem prefixo)
- **Ambiente de Desenvolvimento**: Usa tabelas com o prefixo `dev_`

Essa abordagem permite que você desenvolva e teste novas funcionalidades sem afetar os dados de produção.

## Configuração Inicial

Para começar a usar os ambientes separados, você precisa:

1. Executar o script SQL que cria as tabelas de desenvolvimento
2. Usar as funções utilitárias em seu código para acessar o ambiente correto

### 1. Criando as Tabelas de Desenvolvimento

Execute o script SQL localizado em `src/comandos-sql/criar_tabelas_dev.sql` no Supabase Studio. Este script:

- Cria cópias de todas as tabelas com o prefixo `dev_`
- Copia todos os dados das tabelas de produção para as tabelas de desenvolvimento
- Mantém a mesma estrutura e restrições das tabelas originais

### 2. Atualizando o Código

Para usar os ambientes separados, substitua as chamadas diretas ao Supabase pela função `getTable()`:

**Antes:**
```typescript
import { supabase } from '../utils/supabase';

// Acesso direto à tabela
const { data } = await supabase.from('players').select('*');
```

**Depois:**
```typescript
import { getTable } from '../utils/supabase';

// Acesso à tabela com prefixo automático
const { data } = await getTable('players').select('*');
```

## Como Funciona

O sistema detecta automaticamente se você está em ambiente de desenvolvimento ou produção:

- **Desenvolvimento**: Quando executado no Expo Go ou em localhost
- **Produção**: Quando executado como APK/IPA ou em um domínio web que não seja localhost

### Funções Utilitárias

Adicionamos as seguintes funções para facilitar o trabalho com ambientes:

1. **getTablePrefix()**: Retorna o prefixo apropriado para o ambiente atual
   - Retorna `"dev_"` para ambiente de desenvolvimento
   - Retorna `""` (vazio) para ambiente de produção

2. **getTableName(tableName)**: Adiciona o prefixo correto ao nome da tabela
   - Exemplo: `getTableName("players")` retorna `"dev_players"` em desenvolvimento

3. **getTable(tableName)**: Retorna uma referência à tabela com o prefixo correto
   - Use esta função em vez de `supabase.from()`

## Forçando um Ambiente Específico

Se precisar forçar um ambiente específico (independente de onde o app está rodando), você pode definir a variável de ambiente:

- Para forçar ambiente de produção: `EXPO_PUBLIC_DB_ENV=prod`
- Para forçar ambiente de desenvolvimento: `EXPO_PUBLIC_DB_ENV=dev`

### Como definir a variável de ambiente:

1. **No desenvolvimento local**:
   - Crie ou edite o arquivo `.env` na raiz do projeto:
     ```
     EXPO_PUBLIC_DB_ENV=dev
     ```

2. **No Expo Go**:
   - Adicione a variável ao arquivo `app.config.js`:
     ```javascript
     extra: {
       EXPO_PUBLIC_DB_ENV: "dev"
     }
     ```

3. **Na linha de comando**:
   - Windows (PowerShell):
     ```powershell
     $env:EXPO_PUBLIC_DB_ENV="dev"; npx expo start
     ```

## Verificando o Ambiente Atual

Para verificar qual ambiente está sendo usado, você pode chamar a função `logEnvironmentInfo()`:

```typescript
import { logEnvironmentInfo } from '../utils/environment';

// Exibe informações do ambiente no console
const info = logEnvironmentInfo();
console.log(`Usando banco de dados de ${info.dbEnvironment}`);
```

## Sincronizando os Ambientes

Quando quiser atualizar o ambiente de desenvolvimento com os dados mais recentes de produção, execute novamente o script `criar_tabelas_dev.sql` no Supabase Studio.

## Considerações Importantes

1. **Políticas de Segurança**: As políticas de segurança do Supabase se aplicam igualmente às tabelas de produção e desenvolvimento.

2. **Funções e Gatilhos**: Se você criar funções ou gatilhos personalizados, lembre-se de adaptá-los para trabalhar com os dois conjuntos de tabelas.

3. **Backup**: Faça backups regulares do ambiente de produção. O ambiente de desenvolvimento pode ser recriado a qualquer momento.

4. **Migrações**: Ao aplicar migrações de banco de dados, aplique-as primeiro no ambiente de desenvolvimento para teste.

## Solução de Problemas

### Dados não aparecem no ambiente correto

Verifique se você está usando a função `getTable()` em vez de `supabase.from()` em todos os lugares relevantes.

### Erro ao acessar tabelas com prefixo

Certifique-se de que o script `criar_tabelas_dev.sql` foi executado com sucesso no Supabase Studio.

### Ambiente incorreto sendo usado

Verifique a saída de `logEnvironmentInfo()` para confirmar qual ambiente está sendo detectado.
