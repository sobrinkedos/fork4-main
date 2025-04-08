# Migração de Tabelas Entre Projetos Supabase

Este documento explica como migrar tabelas do projeto Supabase de produção (domino) para o ambiente de desenvolvimento (domino_dev) usando o script de migração fornecido.

## Pré-requisitos

- Node.js instalado
- Acesso aos ambientes de produção e desenvolvimento do Supabase
- Ferramenta `psql` (cliente PostgreSQL) instalada e disponível no PATH

## Visão Geral do Processo

O processo de migração consiste em:

1. Listar todas as tabelas disponíveis no ambiente de produção
2. Selecionar quais tabelas deseja migrar
3. Exportar os dados das tabelas selecionadas do ambiente de produção
4. Importar os dados para o ambiente de desenvolvimento

## Como Usar o Script de Migração

### 1. Executar o Script

```bash
node scripts/migrar-tabelas-entre-projetos.js
```

### 2. Selecionar Tabelas

O script listará todas as tabelas disponíveis no ambiente de produção e solicitará que você escolha quais deseja migrar. Você pode:

- Digitar `todas` para migrar todas as tabelas
- Digitar números específicos separados por vírgula (ex: `1,3,5`) para selecionar tabelas específicas
- Digitar `cancelar` para abortar a operação

### 3. Confirmar a Migração

O script pedirá confirmação antes de iniciar o processo de migração. Digite `sim` para confirmar ou qualquer outra coisa para cancelar.

### 4. Verificar Resultados

Após a conclusão do processo, verifique os dados no ambiente de desenvolvimento para confirmar que a migração foi bem-sucedida.

## Observações Importantes

1. **Backup**: É recomendável fazer um backup do ambiente de desenvolvimento antes de executar a migração, especialmente se houver dados importantes que não devem ser perdidos.

2. **Truncate**: O script utiliza o comando `TRUNCATE CASCADE` para limpar as tabelas de destino antes de importar os novos dados. Isso significa que todos os dados existentes nas tabelas selecionadas serão removidos.

3. **Relações**: Devido ao uso de `CASCADE`, as tabelas relacionadas também podem ser afetadas. Certifique-se de entender as dependências entre tabelas antes de executar a migração.

4. **Arquivos Temporários**: Os dados exportados são armazenados temporariamente na pasta `temp` na raiz do projeto. Esses arquivos não são automaticamente removidos após a migração.

5. **Políticas de Segurança**: As políticas RLS (Row Level Security) não são migradas automaticamente. Se você tiver políticas personalizadas, precisará migrá-las separadamente.

## Solução de Problemas

### Erro de Conexão

Se ocorrerem erros de conexão, verifique:

- Se as credenciais no script estão corretas
- Se você tem acesso aos projetos Supabase
- Se a ferramenta `psql` está instalada corretamente

### Erro de Importação

Se ocorrerem erros durante a importação, verifique:

- Se as estruturas das tabelas são compatíveis entre os ambientes
- Se há restrições de chave estrangeira que podem estar impedindo a importação
- Se há diferenças de esquema entre os ambientes

## Customização do Script

Se necessário, você pode modificar o script para atender às suas necessidades específicas:

- Alterar as credenciais dos projetos
- Modificar a lógica de exportação/importação
- Adicionar suporte para migração de políticas RLS
- Implementar migração seletiva de dados

## Referências

- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do PostgreSQL sobre COPY](https://www.postgresql.org/docs/current/sql-copy.html)