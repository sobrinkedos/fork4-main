import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Database } from '@/types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Inicializando cliente Supabase...');
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Erro: Variáveis de ambiente do Supabase não encontradas');
    console.log('URL:', supabaseUrl);
    console.log('ANON_KEY:', supabaseAnonKey ? '[PRESENTE]' : '[AUSENTE]');
    throw new Error('Configuração do Supabase incompleta');
}
console.log('Variáveis de ambiente do Supabase verificadas com sucesso');

// Adapter para web
const webAdapter = {
    getItem: (key: string) => {
        try {
            const item = localStorage.getItem(key);
            return Promise.resolve(item);
        } catch {
            return Promise.resolve(null);
        }
    },
    setItem: (key: string, value: string) => {
        try {
            localStorage.setItem(key, value);
            return Promise.resolve();
        } catch {
            return Promise.resolve();
        }
    },
    removeItem: (key: string) => {
        try {
            localStorage.removeItem(key);
            return Promise.resolve();
        } catch {
            return Promise.resolve();
        }
    },
};

// Adapter para mobile
const mobileAdapter = {
    getItem: SecureStore.getItemAsync,
    setItem: SecureStore.setItemAsync,
    removeItem: SecureStore.deleteItemAsync,
};

// Escolher o adapter apropriado baseado na plataforma
const storageAdapter = Platform.OS === 'web' ? webAdapter : mobileAdapter;

console.log('Criando cliente Supabase...');
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: storageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        onAuthStateChange: (event, session) => {
            if (event === 'TOKEN_REFRESHED') {
                console.log('Token atualizado com sucesso');
            } else if (event === 'SIGNED_OUT') {
                console.log('Usuário desconectado');
            } else if (event === 'USER_UPDATED') {
                console.log('Dados do usuário atualizados');
            }
        }
    },
});
