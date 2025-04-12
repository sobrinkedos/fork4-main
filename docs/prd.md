# Documento de Requisitos do Produto (PRD) - Aplicativo de Gerenciamento de Dominó

**Versão:** 1.0
**Data:** 2025-04-12

## 1. Introdução e Visão Geral

Este documento descreve os requisitos para um aplicativo móvel (e potencialmente web) projetado para facilitar o gerenciamento e acompanhamento de partidas de dominó entre amigos e comunidades. O aplicativo permite registrar jogadores, partidas, pontuações e calcular estatísticas detalhadas, fornecendo rankings e insights sobre o desempenho dos jogadores e duplas.

O objetivo principal é centralizar as informações das partidas, eliminar a necessidade de anotações manuais e promover uma interação mais engajadora entre os jogadores.

## 2. Objetivos

*   **Facilitar o Registro:** Simplificar o processo de cadastro de jogadores e registro de partidas de dominó.
*   **Automatizar Cálculos:** Calcular automaticamente pontuações, vitórias, derrotas e outros dados estatísticos relevantes.
*   **Gerar Rankings:** Criar e manter rankings atualizados de jogadores individuais e duplas com base no desempenho.
*   **Visualizar Estatísticas:** Apresentar dados e estatísticas de forma clara e visualmente atraente (gráficos).
*   **Gerenciar Comunidades:** Permitir a criação e gerenciamento de comunidades de jogadores.
*   **Melhorar Engajamento:** Fornecer um feed de atividades e dashboards para manter os usuários informados e engajados.
*   **Multi-ambiente:** Suportar ambientes de desenvolvimento e produção separados para garantir estabilidade.

## 3. Público-Alvo

*   **Jogadores Casuais:** Grupos de amigos que jogam dominó regularmente e querem acompanhar o histórico e as estatísticas.
*   **Organizadores de Torneios:** Indivíduos que organizam pequenos campeonatos ou encontros de dominó.
*   **Comunidades de Jogadores:** Grupos maiores que compartilham o interesse pelo dominó e desejam um espaço centralizado para gerenciar suas atividades.

## 4. Funcionalidades Principais

*   **Autenticação de Usuários:** Login e registro seguros utilizando Supabase Auth.
*   **Gerenciamento de Jogadores:**
    *   Cadastro e edição de perfis de jogadores.
    *   Upload de fotos de avatar (suporte móvel e web).
    *   Associação de jogadores a comunidades.
*   **Registro de Partidas:**
    *   Seleção de jogadores para formar times (duplas).
    *   Registro do placar final da partida.
    *   Identificação do tipo de vitória (ex: "bucha").
*   **Cálculo de Estatísticas:**
    *   Número de vitórias e derrotas (individual e por dupla).
    *   Percentual de vitórias.
    *   Contagem de tipos específicos de vitória.
    *   Estatísticas por período (ex: mensal).
*   **Rankings:**
    *   Ranking dos melhores jogadores individuais (baseado em vitórias).
    *   Ranking das melhores duplas (baseado em vitórias).
*   **Dashboard:**
    *   Visão geral da atividade recente.
    *   Carrossel de gráficos interativos (Melhores Jogadores, Melhores Duplas, Tipos de Vitórias).
*   **Gerenciamento de Comunidades:**
    *   Criação e edição de comunidades.
    *   Adição e remoção de membros.
    *   Designação de organizadores.
*   **Feed de Atividades:** Exibição das últimas partidas registradas e outras atividades relevantes.

## 5. Requisitos Não Funcionais

*   **Plataforma:** Aplicativo móvel desenvolvido com React Native e Expo. Potencial para interface web.
*   **Desempenho:** Consultas ao banco de dados otimizadas para respostas rápidas. Carregamento eficiente de dados e imagens.
*   **Usabilidade:** Interface de usuário intuitiva, clara e fácil de navegar.
*   **Segurança:** Autenticação segura, gerenciamento adequado de permissões (via RLS no Supabase).
*   **Manutenibilidade:** Código bem estruturado e comentado. Separação clara entre lógica de negócios, serviços e UI. Uso de TypeScript para tipagem estática.
*   **Ambientes:** Separação funcional entre ambientes de desenvolvimento e produção utilizando prefixos de tabela no banco de dados (`dev_`).

## 6. Design e UX

*   O aplicativo deve ter um design moderno, limpo e agradável.
*   A experiência do usuário deve ser fluida, especialmente nos processos de registro de partidas e visualização de estatísticas.
*   Utilização de componentes visuais como gráficos (`react-native-chart-kit`) e carrosséis (`react-native-snap-carousel`) para apresentar informações de forma dinâmica.

## 7. Tecnologias

*   **Frontend (Mobile):** React Native, Expo
*   **Linguagem:** TypeScript
*   **Backend/BaaS:** Supabase (Authentication, PostgreSQL Database, Storage)
*   **Bibliotecas Chave:**
    *   `react-native-chart-kit` (Gráficos)
    *   `react-native-snap-carousel` (Carrosséis)
    *   `@supabase/supabase-js` (Cliente Supabase)
    *   `expo-router` (Navegação)
    *   `expo-image-picker` (Seleção de Imagens)
*   **Banco de Dados:** PostgreSQL (via Supabase)
*   **Gerenciamento de Pacotes:** npm ou yarn

## 8. Considerações Futuras (Opcional)

*   Notificações push para novas partidas ou atualizações.
*   Sistema de chat dentro das comunidades.
*   Suporte a diferentes regras/modos de jogo de dominó.
*   Interface web completa para administração e visualização.
*   Internacionalização (i18n).
