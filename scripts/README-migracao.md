# Scripts de Migração entre Projetos Supabase

Este diretório contém scripts para facilitar a migração de dados entre os projetos Supabase de produção (domino) e desenvolvimento (domino_dev).

## Scripts Disponíveis

### 1. migrar-tabelas-supabase-melhorado.js

Este é o script mais recente e recomendado para migração de tabelas. Ele utiliza a API do Supabase diretamente e implementa métodos alternativos para listar tabelas, resolvendo problemas comuns encontrados no script original.

**Uso:**
```bash
node scripts/migrar-tabelas-supabase-melhorado.js
```

**Características:**
- Migra dados entre projetos Supabase usando apenas a API REST
- Interface interativa para seleção de tabelas
- Não requer instalação de ferramentas adicionais
- Gerencia automaticamente a limpeza das tabelas de destino
- Implementa métodos alternativos para listar tabelas quando o método padrão falha

### 2. migrar-tabelas-supabase.js

Este é o script original para migração de tabelas usando a API do Supabase.

**Uso:**
```bash
node scripts/migrar-tabelas-supabase.js
```

**Características:**
- Migra dados entre projetos Supabase usando apenas a API REST
- Interface interativa para seleção de tabelas
- Não requer instalação de ferramentas adicionais

### 3. migrar-tabelas-entre-projetos.js

Este script é uma alternativa que utiliza o cliente PostgreSQL (psql) para exportar e importar dados.

**Uso:**
```bash
node scripts/migrar-tabelas-entre-projetos.js
```

**Pré-requisitos:**
- Cliente PostgreSQL (psql) instalado e disponível no PATH

## Documentação Adicional

Para mais informações sobre o processo de migração, consulte:

- [Migração de Tabelas Entre Projetos](../docs/migracao-tabelas-entre-projetos.md)
- [Guia de Migração Entre Ambientes](../docs/migracao-entre-ambientes.md)

## Adicionando ao package.json

Para facilitar o uso, você pode adicionar os seguintes scripts ao seu arquivo package.json:

```json
"scripts": {
  "migrar:tabelas": "node scripts/migrar-tabelas-supabase.js",
  "migrar:tabelas:psql": "node scripts/migrar-tabelas-entre-projetos.js"
}
```

Assim, você poderá executar os scripts com:

```bash
npm run migrar:tabelas
```