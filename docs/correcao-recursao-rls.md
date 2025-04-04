# Correção Definitiva para o Problema de Recursão Infinita nas Políticas RLS

Este documento explica o problema de recursão infinita nas políticas de segurança (RLS) do Supabase e como aplicar a correção definitiva.

## O Problema

O problema de recursão infinita ocorre quando as políticas de segurança (RLS) das tabelas `communities`, `community_organizers` e `community_members` fazem referências circulares entre si. Isso causa:

- Consultas que nunca terminam de executar
- Erros de timeout no banco de dados
- Falhas nas operações de leitura/escrita nas tabelas afetadas

Especificamente, o problema acontece quando:

1. Uma política na tabela A verifica permissões usando uma subconsulta na tabela B
2. A tabela B tem uma política que verifica permissões usando uma subconsulta na tabela A
3. Isso cria um loop infinito de verificações

## A Solução

A solução implementada:

1. Remove todas as políticas existentes nas tabelas problemáticas
2. Recria políticas simplificadas que evitam referências circulares
3. Usa subconsultas diretas (IN) em vez de cláusulas EXISTS complexas
4. Elimina verificações aninhadas que causam recursão

## Arquivos Criados

1. **Script SQL de Correção**: `supabase/migrations/20250406_fix_recursion_definitive.sql`
   - Remove todas as políticas conflitantes
   - Cria novas políticas simplificadas sem referências circulares

2. **Script de Aplicação**: `src/scripts/aplicar-correcao-rls.js`
   - Ferramenta para aplicar a correção no banco de dados Supabase

## Como Aplicar a Correção

Você tem duas opções para aplicar a correção:

### Opção 1: Usando a CLI do Supabase (Recomendado)

1. Certifique-se de estar logado na CLI do Supabase:
   ```
   npx supabase login
   ```

2. Vincule seu projeto local ao projeto remoto (se ainda não estiver vinculado):
   ```
   npx supabase link
   ```

3. Verifique as alterações que serão aplicadas:
   ```
   npx supabase db diff
   ```

4. Aplique a migração:
   ```
   npx supabase db push
   ```

### Opção 2: Usando o Script de Aplicação

1. Execute o script de aplicação:
   ```
   node src/scripts/aplicar-correcao-rls.js
   ```

2. O script registrará a migração na tabela `_migrations_log` do Supabase

3. Acesse o painel do Supabase (SQL Editor) e execute o SQL manualmente ou atualize o status para "executado" após a execução

## Verificação

Para verificar se a correção foi aplicada com sucesso:

1. Acesse o painel do Supabase (SQL Editor)

2. Execute a seguinte consulta para listar as políticas atuais:
   ```sql
   SELECT
       schemaname,
       tablename,
       policyname
   FROM
       pg_policies
   WHERE
       tablename IN ('communities', 'community_organizers', 'community_members');
   ```

3. Verifique se apenas as novas políticas estão presentes e se não há políticas antigas ou duplicadas

## Prevenção de Problemas Futuros

Para evitar que o problema ocorra novamente:

1. Evite criar políticas com referências circulares entre tabelas
2. Use subconsultas diretas (IN) em vez de cláusulas EXISTS complexas
3. Teste as políticas com diferentes cenários de permissão antes de aplicá-las em produção
4. Sempre use `npx supabase db diff` para verificar as alterações antes de aplicá-las