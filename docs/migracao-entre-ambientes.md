# Guia de Migração Entre Ambientes no DominoApp

Este documento fornece um guia passo a passo sobre como testar alterações no ambiente de desenvolvimento e depois aplicá-las com segurança no ambiente de produção utilizando dois projetos Supabase separados.

## Visão Geral do Processo

O processo de migração entre ambientes segue estas etapas principais:

1. Desenvolvimento e teste no ambiente de desenvolvimento
2. Geração de scripts de migração
3. Revisão dos scripts de migração
4. Aplicação dos scripts no ambiente de produção
5. Verificação e validação das alterações em produção

## Pré-requisitos

Antes de iniciar o processo de migração, certifique-se de que:

- Você tem acesso aos ambientes de desenvolvimento e produção do Supabase
- A Supabase CLI está instalada e configurada corretamente
- Os dois projetos Supabase (desenvolvimento e produção) estão configurados

## Passo a Passo

### 1. Preparação do Ambiente de Desenvolvimento

```bash
# Alternar para o ambiente de desenvolvimento
npm run env:dev
```

Este passo garante que você está trabalhando com o ambiente de desenvolvimento correto.

### 2. Desenvolvimento e Teste

Realize as alterações necessárias no esquema do banco de dados e teste-as no ambiente de desenvolvimento. Você pode fazer isso através da interface do Supabase ou executando scripts SQL diretamente.

Exemplo de alteração no esquema:

```sql
-- Exemplo: Adicionar uma nova coluna a uma tabela existente
ALTER TABLE players ADD COLUMN last_active_at TIMESTAMP WITH TIME ZONE;
```

### 3. Geração do Script de Migração

Quando estiver satisfeito com as alterações, gere um script de migração:

```bash
# Gerar script de migração
npm run supabase:migration nome-descritivo-da-alteracao
```

Este comando criará um arquivo de migração na pasta `supabase/migrations/` com um timestamp e o nome fornecido.

### 4. Revisão do Script de Migração

Revise cuidadosamente o script de migração gerado para garantir que ele faz exatamente o que você espera. Verifique:

- Se todas as alterações necessárias estão incluídas
- Se não há operações destrutivas não intencionais (como DROP TABLE)
- Se as alterações são compatíveis com os dados existentes

### 5. Aplicação em Produção

Após revisar e validar o script de migração, aplique-o ao ambiente de produção:

```bash
# Alternar para o ambiente de produção
npm run env:prod

# Aplicar o script de migração manualmente no ambiente de produção
# através do editor SQL do Supabase ou usando a CLI
```

### 6. Verificação em Produção

Verifique se as alterações foram aplicadas corretamente no ambiente de produção:

- Verifique o esquema do banco de dados através da interface do Supabase
- Execute consultas para confirmar que as alterações estão funcionando como esperado
- Teste a aplicação para garantir que tudo está funcionando corretamente

## Cenários Comuns de Migração

### Adição de Nova Tabela

1. No ambiente de desenvolvimento, crie a nova tabela
2. Teste as operações CRUD na nova tabela
3. Gere o script de migração
4. Aplique a migração em produção

### Alteração de Tabela Existente

1. No ambiente de desenvolvimento, faça as alterações necessárias
2. Teste se as alterações não afetam negativamente a funcionalidade existente
3. Gere o script de migração
4. Aplique a migração em produção

### Alteração de Políticas de Segurança (RLS)

1. No ambiente de desenvolvimento, modifique as políticas de segurança
2. Teste exaustivamente para garantir que as permissões estão corretas
3. Gere o script de migração
4. Aplique a migração em produção

## Solução de Problemas

### Conflitos de Migração

Se ocorrerem problemas durante a aplicação das migrações:

1. Verifique se o script SQL está correto e compatível com o ambiente de produção
2. Resolva os problemas manualmente editando os scripts de migração
3. Tente aplicar novamente

### Reversão de Alterações

Se uma migração causar problemas em produção:

1. Identifique o problema específico
2. Crie um novo script de migração que reverte as alterações problemáticas
3. Aplique o script de reversão em produção

## Boas Práticas

1. **Sempre teste em desenvolvimento primeiro**: Nunca faça alterações diretamente no ambiente de produção.

2. **Faça backup antes de migrações importantes**: Execute `npx supabase db dump -f backup-$(date +%Y%m%d)` antes de aplicar migrações críticas.

3. **Documente as alterações**: Mantenha um registro das alterações realizadas e por quê.

4. **Migre em horários de baixo tráfego**: Realize migrações em momentos de menor utilização do sistema.

5. **Planeje rollbacks**: Sempre tenha um plano para reverter as alterações caso algo dê errado.

6. **Comunique as alterações**: Informe a equipe sobre as alterações realizadas e possíveis impactos.

## Referências

- [Documentação do Supabase sobre Migrações](https://supabase.com/docs/guides/cli/migrations)
- [Estratégia de Ambientes do DominoApp](./estrategia-ambientes.md)