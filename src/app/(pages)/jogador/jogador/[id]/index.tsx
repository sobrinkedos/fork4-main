import { Redirect } from 'expo-router';

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getPlayer } from '@/services/playerService';
import { Header } from '@/components/Header';
import { colors } from '@/styles/colors';
import styled from 'styled-components/native';
import { PageTransition } from '@/components/Transitions';
import { Feather } from '@expo/vector-icons';

const Container = styled.View`
    flex: 1;
    background-color: ${colors.backgroundDark};
`;

const Content = styled.View`
    flex: 1;
    padding: 20px;
`;

const PlayerInfo = styled.View`
    background-color: ${colors.backgroundMedium};
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
`;

const PlayerName = styled.Text`
    color: ${colors.gray100};
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 16px;
`;

const InfoItem = styled.View`
    margin-bottom: 12px;
`;

const InfoLabel = styled.Text`
    color: ${colors.gray300};
    font-size: 14px;
    margin-bottom: 4px;
`;

const InfoValue = styled.Text`
    color: ${colors.gray100};
    font-size: 16px;
`;

type Player = {
  id: string;
  name: string;
  email: string;
  phone?: string;
};

export default function PlayerDetails() {
  const { id } = useLocalSearchParams();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlayer() {
      try {
        if (typeof id === 'string') {
          const playerData = await getPlayer(id);
          setPlayer(playerData);
        }
      } catch (err) {
        setError('Erro ao carregar os detalhes do jogador');
      } finally {
        setLoading(false);
      }
    }

    loadPlayer();
  }, [id]);

  return (
    <PageTransition>
      <Container>
        <Header 
          title="Detalhes do Jogador" 
          showBackButton
          rightContent={
            <TouchableOpacity onPress={() => router.push(`/jogador/${id}/estatisticas`)}>
              <Feather name="bar-chart-2" size={24} color={colors.gray100} />
            </TouchableOpacity>
          }
        />
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.error }}>{error}</Text>
          </View>
        ) : !player ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.gray300 }}>Jogador não encontrado</Text>
          </View>
        ) : (
          <Content>
            <PlayerInfo>
              <PlayerName>{player.name}</PlayerName>
              {player.phone && (
                <InfoItem>
                  <InfoLabel>Telefone</InfoLabel>
                  <InfoValue>{player.phone}</InfoValue>
                </InfoItem>
              )}
              {player.email && (
                <InfoItem>
                  <InfoLabel>Email</InfoLabel>
                  <InfoValue>{player.email}</InfoValue>
                </InfoItem>
              )}
            </PlayerInfo>
          </Content>
        )}
      </Container>
    </PageTransition>
  );
}