# Instruções para executar pg_dump no Windows

## Opção 1: Instalar o PostgreSQL

1. Baixe o instalador do PostgreSQL para Windows no site oficial: https://www.postgresql.org/download/windows/
2. Execute o instalador e siga as instruções na tela
3. Durante a instalação, certifique-se de que a opção "Command Line Tools" esteja marcada
4. Após a instalação, abra um novo PowerShell e execute:

```powershell
pg_dump -h aws-0-sa-east-1.pooler.supabase.com -p 6543 -U postgres.evakdtqrtpqiuqhetkqr -d postgres --schema-only > domino_structure.sql
```

## Opção 2: Usar o Docker (se o Docker Desktop estiver em execução)

1. Inicie o Docker Desktop
2. Execute o seguinte comando no PowerShell:

```powershell
docker run --rm -v ${PWD}:/workdir -w /workdir postgres:15 pg_dump -h aws-0-sa-east-1.pooler.supabase.com -p 6543 -U postgres.evakdtqrtpqiuqhetkqr -d postgres --schema-only > domino_structure.sql
```

## Opção 3: Usar o Supabase Studio

Como alternativa, você pode usar o Supabase Studio para exportar a estrutura do banco de dados:

1. Acesse o Supabase Studio
2. Vá para a seção "SQL Editor"
3. Execute o seguinte comando SQL para obter a estrutura das tabelas:

```sql
SELECT 
    'CREATE TABLE ' || table_name || ' (' ||
    string_agg(
        column_name || ' ' || data_type || 
        CASE 
            WHEN character_maximum_length IS NOT NULL THEN '(' || character_maximum_length || ')'
            ELSE ''
        END ||
        CASE 
            WHEN is_nullable = 'NO' THEN ' NOT NULL'
            ELSE ''
        END,
        ', '
    ) || ');' as create_statement
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
GROUP BY 
    table_name
ORDER BY 
    table_name;
```

Este comando irá gerar instruções CREATE TABLE básicas para todas as tabelas no esquema público.

## Opção 4: Usar o script SQL que já criamos

O script que já criamos (`criar_tabelas_dev.sql`) já contém os comandos necessários para duplicar todas as tabelas com o prefixo "dev_". Se o objetivo é apenas ter uma cópia das tabelas para desenvolvimento, este script já atende à necessidade sem precisar do pg_dump.
