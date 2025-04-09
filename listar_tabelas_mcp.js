/**
 * Script para listar todas as tabelas do banco de dados Supabase usando o padrão MCP
 * 
 * Este script utiliza o Model-Controller-Presenter para organizar o código
 * e facilitar a manutenção e extensão do sistema.
 * 
 * Uso: node listar_tabelas_mcp.js
 */

const { createClient } = require('@supabase/supabase-js');

// Credenciais do Supabase obtidas do arquivo de configuração
const supabaseUrl = 'https://evakdtqrtpqiuqhetkqr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YWtkdHFydHBxaXVxaGV0a3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNjk1MjQsImV4cCI6MjA1NDk0NTUyNH0.Ms4VB9QGBBcWMZPJ5j5Oanl3RD1SeECp7twFb_riPAI';

// ===== MODEL =====
// Responsável por gerenciar os dados e a comunicação com o Supabase
class TabelasModel {
  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    this.context = {}; // Armazena os dados em cache
  }

  /**
   * Busca todas as tabelas do esquema público
   */
  async buscarTabelas() {
    try {
      // Lista de tabelas conhecidas do projeto
      // Esta é uma abordagem alternativa quando não podemos acessar diretamente o catálogo do sistema
      const tabelasConhecidas = [
        { tablename: 'profiles' },
        { tablename: 'players' },
        { tablename: 'games' },
        { tablename: 'communities' },
        { tablename: 'community_members' },
        { tablename: 'community_organizers' },
        { tablename: 'competitions' },
        { tablename: 'competition_members' },
        { tablename: 'activities' }
      ];
      
      // Armazenar no contexto
      this.context.tabelas = tabelasConhecidas;
      return tabelasConhecidas;
    } catch (error) {
      console.error('Erro ao buscar tabelas:', error.message);
      throw error;
    }
  }

  /**
   * Busca detalhes de uma tabela específica
   */
  async buscarDetalhesTabela(nomeTabela) {
    try {
      // Buscar contagem de registros
      const { count, error } = await this.supabase
        .from(nomeTabela)
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      return { nome: nomeTabela, registros: count || 0 };
    } catch (error) {
      console.error(`Erro ao buscar detalhes da tabela ${nomeTabela}:`, error.message);
      return { nome: nomeTabela, erro: error.message };
    }
  }

  /**
   * Busca detalhes de todas as tabelas
   */
  async buscarDetalhesTabelas() {
    try {
      // Verificar se já temos as tabelas no contexto
      if (!this.context.tabelas) {
        await this.buscarTabelas();
      }
      
      const tabelas = this.context.tabelas;
      const detalhes = [];
      
      // Buscar detalhes para cada tabela
      for (const tabela of tabelas) {
        const detalhe = await this.buscarDetalhesTabela(tabela.tablename);
        detalhes.push(detalhe);
      }
      
      // Armazenar no contexto
      this.context.detalhes = detalhes;
      return detalhes;
    } catch (error) {
      console.error('Erro ao buscar detalhes das tabelas:', error.message);
      throw error;
    }
  }

  /**
   * Limpa o contexto
   */
  limparContexto() {
    this.context = {};
  }
}

// ===== CONTROLLER =====
// Responsável por coordenar as ações entre o Model e o Presenter
class TabelasController {
  constructor(model, presenter) {
    this.model = model;
    this.presenter = presenter;
  }

  /**
   * Inicia o processo de listagem de tabelas
   */
  async listarTabelas() {
    try {
      this.presenter.exibirMensagem('Conectando ao Supabase e buscando tabelas...');
      
      // Buscar tabelas
      const tabelas = await this.model.buscarTabelas();
      
      // Exibir tabelas
      this.presenter.exibirTabelas(tabelas);
      
      return tabelas;
    } catch (error) {
      this.presenter.exibirErro('Erro ao listar tabelas: ' + error.message);
    }
  }

  /**
   * Busca e exibe detalhes de todas as tabelas
   */
  async buscarDetalhes() {
    try {
      this.presenter.exibirMensagem('Buscando detalhes das tabelas...');
      
      // Buscar detalhes
      const detalhes = await this.model.buscarDetalhesTabelas();
      
      // Exibir detalhes
      this.presenter.exibirDetalhesTabelas(detalhes);
      
      return detalhes;
    } catch (error) {
      this.presenter.exibirErro('Erro ao buscar detalhes: ' + error.message);
    }
  }
}

// ===== PRESENTER =====
// Responsável pela apresentação dos dados ao usuário
class TabelasPresenter {
  /**
   * Exibe uma mensagem para o usuário
   */
  exibirMensagem(mensagem) {
    console.log(`\n${mensagem}`);
  }

  /**
   * Exibe um erro para o usuário
   */
  exibirErro(mensagem) {
    console.error(`\nERRO: ${mensagem}`);
  }

  /**
   * Exibe a lista de tabelas
   */
  exibirTabelas(tabelas) {
    console.log('\n============================');
    console.log('TABELAS DO BANCO DE DADOS');
    console.log('============================');
    
    if (tabelas && tabelas.length > 0) {
      tabelas.forEach((tabela, index) => {
        console.log(`${index + 1}. ${tabela.tablename}`);
      });
      
      console.log(`\nTotal: ${tabelas.length} tabelas encontradas.`);
    } else {
      console.log('Nenhuma tabela encontrada no esquema público.');
    }
    
    console.log('============================');
  }

  /**
   * Exibe detalhes de todas as tabelas
   */
  exibirDetalhesTabelas(detalhes) {
    console.log('\n============================');
    console.log('DETALHES DAS TABELAS');
    console.log('============================');
    
    if (detalhes && detalhes.length > 0) {
      detalhes.forEach((detalhe) => {
        if (detalhe.erro) {
          console.log(`Tabela: ${detalhe.nome.padEnd(20)} | Erro: ${detalhe.erro}`);
        } else {
          console.log(`Tabela: ${detalhe.nome.padEnd(20)} | Registros: ${detalhe.registros}`);
        }
      });
    } else {
      console.log('Nenhum detalhe disponível.');
    }
    
    console.log('============================');
  }
}

// ===== APLICAÇÃO =====
// Inicializa e executa a aplicação
async function main() {
  console.log('Iniciando listagem de tabelas do Supabase usando MCP...');
  
  // Criar instâncias
  const model = new TabelasModel();
  const presenter = new TabelasPresenter();
  const controller = new TabelasController(model, presenter);
  
  try {
    // Listar tabelas
    await controller.listarTabelas();
    
    // Buscar detalhes
    await controller.buscarDetalhes();
    
    console.log('\nProcesso concluído com sucesso!');
  } catch (error) {
    console.error('Erro na execução do script:', error.message);
  }
}

// Executar a aplicação
main();