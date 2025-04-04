import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { supabaseMCP } from '@/lib/supabaseMCP';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Tipo para representar um arquivo de migração
type MigrationFile = {
  name: string;
  path: string;
  content?: string;
  executed: boolean;
  error?: string;
};

export default function MigrationRunner() {
  const [migrations, setMigrations] = useState<MigrationFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Função para listar os arquivos de migração
  const listMigrationFiles = async () => {
    setLoading(true);
    setLoadingMessage('Buscando arquivos de migração...');
    setError(null);
    setSuccess(null);
    
    try {
      let migrationFiles: MigrationFile[] = [];
      
      if (Platform.OS === 'web') {
        // Na web, não podemos acessar o sistema de arquivos diretamente
        // Então vamos usar uma abordagem diferente
        setError('Listagem de arquivos não suportada na web. Use a versão móvel ou desktop.');
        setLoading(false);
        return;
      }
      
      // Caminho para a pasta de migrações
      const migrationsDir = FileSystem.documentDirectory + 'supabase/migrations';
      
      // Verifica se o diretório existe
      const dirInfo = await FileSystem.getInfoAsync(migrationsDir);
      if (!dirInfo.exists) {
        throw new Error(`Diretório de migrações não encontrado: ${migrationsDir}`);
      }
      
      // Lista os arquivos no diretório
      const files = await FileSystem.readDirectoryAsync(migrationsDir);
      
      // Filtra apenas os arquivos SQL
      const sqlFiles = files.filter(file => file.endsWith('.sql'));
      
      // Ordena os arquivos por nome (geralmente por data se seguirem o padrão YYYYMMDD_)
      sqlFiles.sort();
      
      // Cria a lista de arquivos de migração
      migrationFiles = sqlFiles.map(file => ({
        name: file,
        path: `${migrationsDir}/${file}`,
        executed: false
      }));
      
      setMigrations(migrationFiles);
      setSuccess(`Encontrados ${migrationFiles.length} arquivos de migração.`);
    } catch (err) {
      setError(`Erro ao listar arquivos de migração: ${(err as Error).message}`);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Função para executar um arquivo SQL no Supabase
  const executeSqlFile = async (migration: MigrationFile, index: number) => {
    try {
      setLoadingMessage(`Executando ${migration.name}...`);
      
      // Lê o conteúdo do arquivo
      const fileContent = await FileSystem.readAsStringAsync(migration.path);
      
      // Executa o SQL usando o cliente Supabase
      const { error } = await supabaseMCP.rpc('exec_sql', {
        query: fileContent
      });
      
      if (error) throw error;
      
      // Atualiza o estado da migração
      const updatedMigrations = [...migrations];
      updatedMigrations[index] = {
        ...migration,
        executed: true,
        content: fileContent
      };
      
      setMigrations(updatedMigrations);
      setSuccess(`Arquivo ${migration.name} executado com sucesso!`);
    } catch (err) {
      const errorMessage = (err as Error).message;
      
      // Atualiza o estado da migração com o erro
      const updatedMigrations = [...migrations];
      updatedMigrations[index] = {
        ...migration,
        error: errorMessage
      };
      
      setMigrations(updatedMigrations);
      setError(`Erro ao executar ${migration.name}: ${errorMessage}`);
    }
  };

  // Função para executar todas as migrações
  const executeAllMigrations = async () => {
    setLoading(true);
    setLoadingMessage('Iniciando execução de todas as migrações...');
    setError(null);
    setSuccess(null);
    
    try {
      for (let i = 0; i < migrations.length; i++) {
        const migration = migrations[i];
        if (!migration.executed) {
          await executeSqlFile(migration, i);
        }
      }
      
      setSuccess('Todas as migrações foram executadas com sucesso!');
    } catch (err) {
      setError(`Erro durante a execução das migrações: ${(err as Error).message}`);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Função para executar apenas as últimas 5 migrações
  const executeLatestMigrations = async () => {
    setLoading(true);
    setLoadingMessage('Iniciando execução das últimas migrações...');
    setError(null);
    setSuccess(null);
    
    try {
      // Pega as últimas 5 migrações ou todas se houver menos de 5
      const latestCount = Math.min(migrations.length, 5);
      const startIndex = migrations.length - latestCount;
      
      for (let i = startIndex; i < migrations.length; i++) {
        const migration = migrations[i];
        if (!migration.executed) {
          await executeSqlFile(migration, i);
        }
      }
      
      setSuccess('As últimas migrações foram executadas com sucesso!');
    } catch (err) {
      setError(`Erro durante a execução das migrações: ${(err as Error).message}`);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Executor de Migrações SQL</Text>
      
      {success && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{success}</Text>
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Listar Arquivos de Migração" 
          onPress={listMigrationFiles} 
          disabled={loading} 
        />
        <View style={styles.buttonSpacer} />
        <Button 
          title="Executar Todas as Migrações" 
          onPress={executeAllMigrations} 
          disabled={loading || migrations.length === 0} 
        />
        <View style={styles.buttonSpacer} />
        <Button 
          title="Executar Últimas 5 Migrações" 
          onPress={executeLatestMigrations} 
          disabled={loading || migrations.length === 0} 
        />
      </View>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>{loadingMessage}</Text>
        </View>
      )}
      
      <ScrollView style={styles.listContainer}>
        <Text style={styles.subtitle}>
          {migrations.length > 0 
            ? `${migrations.length} Arquivos de Migração:` 
            : 'Nenhum arquivo de migração listado'}
        </Text>
        
        {migrations.map((migration, index) => (
          <View key={index} style={[
            styles.migrationItem, 
            migration.executed ? styles.executedItem : {},
            migration.error ? styles.errorItem : {}
          ]}>
            <Text style={styles.migrationName}>{migration.name}</Text>
            
            {migration.executed && (
              <Text style={styles.executedText}>✅ Executado</Text>
            )}
            
            {migration.error && (
              <Text style={styles.migrationError}>❌ Erro: {migration.error}</Text>
            )}
            
            {!migration.executed && !migration.error && (
              <Button
                title="Executar"
                onPress={() => executeSqlFile(migration, index)}
                disabled={loading}
              />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  buttonSpacer: {
    width: 8,
    height: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#0000ff',
  },
  listContainer: {
    flex: 1,
  },
  migrationItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  executedItem: {
    backgroundColor: '#e6ffe6',
  },
  errorItem: {
    backgroundColor: '#ffe6e6',
  },
  migrationName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  migrationError: {
    color: 'red',
    marginTop: 8,
  },
  executedText: {
    color: 'green',
    fontWeight: 'bold',
  },
  successContainer: {
    backgroundColor: '#e6ffe6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: 'green',
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#ffe6e6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});
