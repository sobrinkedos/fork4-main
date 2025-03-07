import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Stack, useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PageTransition } from '@/components/Transitions';
import { Header } from '@/components/Header';
import { useTheme } from 'styled-components/native';

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const ScrollContent = styled.ScrollView`
  flex: 1;
`;

const Content = styled.View`
  padding: 20px;
  gap: 16px;
`;

const InputContainer = styled.View`
  gap: 8px;
`;

const Label = styled.Text`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: 500;
`;

const StyledInput = styled.TextInput`
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  padding: 16px;
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 16px;
`;

const SaveButton = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.accent};
  padding: 16px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  margin-top: 16px;
  opacity: ${props => props.disabled ? 0.7 : 1};
`;

const ButtonText = styled.Text`
  color: ${({ theme }) => theme.colors.white};
  font-size: 16px;
  font-weight: 600;
`;

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    nickname: '',
    email: '',
    phone_number: '',
  });

  useEffect(() => {
    if (user?.id) {
      console.log('useEffect - user?.id:', user?.id);
      loadProfile();
    }
  }, [user?.id]);

  async function loadProfile() {
    try {
      setLoading(true);
      console.log('Carregando perfil para usuário:', user?.id);
      
      if (!user?.id) {
        console.log('Usuário não encontrado');
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('full_name, nickname, phone_number')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Perfil não encontrado, criando novo perfil...');
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert([
              { 
                user_id: user.id,
                full_name: null,
                nickname: null,
                phone_number: null
              }
            ]);
          
          if (insertError) {
            console.error('Erro ao criar perfil:', insertError);
            throw insertError;
          }

          setProfile({
            full_name: '',
            nickname: '',
            email: user.email || '',
            phone_number: '',
          });
          return;
        }
        
        console.error('Erro ao carregar perfil:', error);
        throw error;
      }

      console.log('Dados do perfil:', data);
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          nickname: data.nickname || '',
          email: user.email || '',
          phone_number: data.phone_number || '',
        });
      }
    } catch (error) {
      console.error('Erro completo:', error);
      Alert.alert('Erro', 'Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    try {
      setLoading(true);

      // Se tiver um número de telefone, verifica se existe jogador com este número
      if (profile.phone_number) {
        const { data: existingPlayer, error: playerError } = await supabase
          .from('players')
          .select('id, name, phone')
          .eq('phone', profile.phone_number)
          .single();

        if (playerError && playerError.code !== 'PGRST116') {
          console.error('Erro ao buscar jogador:', playerError);
          throw playerError;
        }

        if (existingPlayer) {
          // Verifica se o usuário já está vinculado a este jogador
          const { data: existingRelation, error: relationCheckError } = await supabase
            .from('user_player_relations')
            .select('*')
            .eq('user_id', user?.id)
            .eq('player_id', existingPlayer.id)
            .single();

          if (relationCheckError && relationCheckError.code !== 'PGRST116') {
            console.error('Erro ao verificar vínculo:', relationCheckError);
            throw relationCheckError;
          }

          if (!existingRelation) {
            // Perguntar se deseja vincular ao jogador existente
            const userWantsToLink = await new Promise((resolve) => {
              Alert.alert(
                'Jogador Encontrado',
                `Encontramos um jogador "${existingPlayer.name}" com este número de telefone. Deseja vincular seu perfil a este jogador e aproveitar seu histórico e pontuação?`,
                [
                  {
                    text: 'Não',
                    style: 'cancel',
                    onPress: () => resolve(false),
                  },
                  {
                    text: 'Sim',
                    onPress: () => resolve(true),
                  },
                ],
                { cancelable: false }
              );
            });

            if (userWantsToLink) {
              // Vincular usuário ao jogador existente
              const { error: relationError } = await supabase
                .from('user_player_relations')
                .insert({
                  user_id: user?.id,
                  player_id: existingPlayer.id,
                  created_at: new Date().toISOString(),
                  is_primary_user: true // Indica que este usuário é o dono principal do perfil do jogador
                });

              if (relationError) {
                console.error('Erro ao vincular jogador:', relationError);
                throw relationError;
              }

              Alert.alert(
                'Sucesso',
                'Seu perfil foi vinculado ao jogador existente. Agora você tem acesso ao histórico e pontuação deste jogador!'
              );
            } else {
              Alert.alert(
                'Telefone em Uso',
                'Este número de telefone já está registrado para outro jogador. Por favor, use um número diferente.'
              );
              setLoading(false);
              return;
            }
          }
        } else {
          // Se não existir jogador com este número, cria um novo
          const { data: newPlayer, error: createPlayerError } = await supabase
            .from('players')
            .insert({
              name: profile.full_name,
              phone: profile.phone_number,
              created_by: user?.id,
              nickname: profile.nickname
            })
            .select()
            .single();

          if (createPlayerError) {
            console.error('Erro ao criar jogador:', createPlayerError);
            throw createPlayerError;
          }

          // Vincular usuário ao novo jogador como proprietário principal
          const { error: relationError } = await supabase
            .from('user_player_relations')
            .insert({
              user_id: user?.id,
              player_id: newPlayer.id,
              created_at: new Date().toISOString(),
              is_primary_user: true // Indica que este usuário é o dono principal do perfil do jogador
            });

          if (relationError) {
            console.error('Erro ao vincular novo jogador:', relationError);
            throw relationError;
          }

          Alert.alert(
            'Novo Jogador',
            'Um novo jogador foi criado e vinculado ao seu perfil!'
          );
        }
      }

      // Atualiza o perfil do usuário
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          full_name: profile.full_name,
          nickname: profile.nickname,
          phone_number: profile.phone_number
        })
        .eq('user_id', user?.id)
        .select()
        .single();

      if (updateError) {
        console.error('Erro ao atualizar perfil:', updateError);
        throw updateError;
      }

      setProfile(updatedProfile);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar o perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition>
      <Container>
        <Header
          title="Meu Perfil"
          onNotificationPress={() => {}}
          onProfilePress={() => router.back()}
        />
        <ScrollContent showsVerticalScrollIndicator={false}>
          <Content>
            <InputContainer>
              <Label>Nome Completo</Label>
              <StyledInput
                value={profile.full_name}
                onChangeText={(text) => setProfile({ ...profile, full_name: text })}
                placeholder="Seu nome completo"
                placeholderTextColor={colors.textSecondary}
              />
            </InputContainer>

            <InputContainer>
              <Label>Apelido</Label>
              <StyledInput
                value={profile.nickname}
                onChangeText={(text) => setProfile({ ...profile, nickname: text })}
                placeholder="Seu apelido"
                placeholderTextColor={colors.textSecondary}
              />
            </InputContainer>

            <InputContainer>
              <Label>Email</Label>
              <StyledInput
                value={profile.email}
                editable={false}
                placeholder="seu@email.com"
                placeholderTextColor={colors.textSecondary}
              />
            </InputContainer>

            <InputContainer>
              <Label>Telefone</Label>
              <StyledInput
                value={profile.phone_number}
                onChangeText={(text) => setProfile({ ...profile, phone_number: text })}
                placeholder="(00) 00000-0000"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            </InputContainer>

            <SaveButton onPress={updateProfile} disabled={loading}>
              <ButtonText>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </ButtonText>
            </SaveButton>
          </Content>
        </ScrollContent>
      </Container>
    </PageTransition>
  );
}
