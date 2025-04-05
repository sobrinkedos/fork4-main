# Estratégia de Ambientes no DominoApp

## Visão Geral

Devido às limitações do plano gratuito do Supabase, que não permite a criação de branches de banco de dados, adotamos uma estratégia alternativa para separar os ambientes de desenvolvimento e produção. Em vez de usar branches dentro de um único projeto Supabase, utilizamos dois projetos Supabase distintos:

- **Ambiente de Desenvolvimento**: Projeto `domino_new` (https://dwsnwsxdkekkaeabiqrw.supabase.co)
- **Ambiente de Produção**: Projeto `domino` (https://evakdtqrtpqiuqhetkqr.supabase.co)

## Configuração dos Ambientes

A configuração dos ambientes é gerenciada através de arquivos de variáveis de ambiente:

- `.env.development`: Configurações para o ambiente de desenvolvimento (banco `domino_new`)
- `.env.production`: Configurações para o ambiente de produção (banco `domino`)
- `.env`: Arquivo gerado automaticamente pelo script de alternância de ambiente

## Como Alternar Entre Ambientes

Para alternar entre os ambientes de desenvolvimento e produção, utilize o script `switch-env.js`:

```bash
# Para alternar para o ambiente de desenvolvimento
node scripts/switch-env.js dev

# Para alternar para o ambiente de produção
node scripts/switch-env.js prod
```

Este script copia o arquivo de configuração correspondente (`.env.development` ou `.env.production`) para o arquivo `.env` que é utilizado pela aplicação.

## Sincronização Entre Ambientes

Como estamos utilizando dois bancos de dados separados, é necessário sincronizar manualmente as alterações entre os ambientes. Recomendamos o seguinte fluxo de trabalho:

1. Desenvolva e teste todas as alterações no ambiente de desenvolvimento
2. Quando as alterações estiverem prontas para produção, crie scripts SQL para aplicar as mesmas alterações no banco de dados de produção
3. Aplique os scripts SQL no ambiente de produção

### Exemplo de Sincronização

1. Crie um arquivo SQL com as alterações necessárias
2. Conecte-se ao banco de dados de produção através do painel do Supabase
3. Execute o script SQL no editor SQL do Supabase

## Boas Práticas

1. **Nunca comite os arquivos `.env.*` no repositório**. Eles estão incluídos no `.gitignore`.
2. Mantenha uma cópia de backup dos arquivos `.env.*` em um local seguro.
3. Ao adicionar novas variáveis de ambiente, atualize ambos os arquivos `.env.development` e `.env.production`.
4. Documente todas as alterações de esquema para facilitar a sincronização entre ambientes.
5. Considere criar scripts de migração para automatizar a sincronização entre ambientes.

## Limitações

Esta abordagem tem algumas limitações em comparação com o Database Branching nativo do Supabase:

1. A sincronização manual entre ambientes pode ser propensa a erros
2. Não há um histórico automático de alterações de esquema
3. É necessário manter duas cópias separadas dos dados

No futuro, se migrarmos para um plano pago do Supabase, poderemos considerar a utilização do Database Branching nativo para uma experiência mais integrada.