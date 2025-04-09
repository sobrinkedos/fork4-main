import { createClient } from '@supabase/supabase-js';
import { getTableName } from './environment';

// Inicializa o cliente Supabase com as credenciais do projeto
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Retorna uma referência à tabela com o prefixo correto para o ambiente atual
 * @param tableName Nome da tabela sem prefixo
 * @returns Referência à tabela com o prefixo apropriado para o ambiente
 */
export const getTable = (tableName: string) => {
  return supabase.from(getTableName(tableName));
};

/**
 * Função auxiliar para consultas RPC com suporte a ambientes
 * @param functionName Nome da função RPC
 * @param params Parâmetros para a função
 * @returns Resultado da chamada RPC
 */
export const callRPC = (functionName: string, params?: any) => {
  return supabase.rpc(functionName, params);
};

export default supabase;
