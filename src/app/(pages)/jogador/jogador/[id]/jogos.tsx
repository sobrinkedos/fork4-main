import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { InternalHeader } from '@/components/InternalHeader';
import { Feather } from '@expo/vector-icons';
import { gameService, Game } from '@/services/gameService';
import { playerService } from '@/services/playerService';
import { useTheme } from 'styled-components/native';

type Game = {
    id: string;
    team1: string[];
    team2: string[];
    team1_score: number;
    team2_score: number;
    status: string;
    is_buchuda: boolean;
    is_buchuda_de_re: boolean;
    created_at: string;
};

type Player = {
    id: string;
    name: string;
};

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const Content = styled.View`
    flex: 1;
    padding: 16px;
`;

const GamesList = styled.FlatList`
    flex: 1;
    padding: 16px;
`;

const GameCard = styled.View`
    background-color: ${({ theme }) => theme.colors.secondary};
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
`;

const GameDate = styled.Text`
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 14px;
    margin-bottom: 8px;
`;

const GameScore = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
`;

const TeamScore = styled.View`
    align-items: center;
`;

const TeamName = styled.Text`
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: 14px;
    margin-bottom: 4px;
`;

const Score = styled.Text`
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: 24px;
    font-weight: bold;
`;

const Separator = styled.Text`
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 20px;
    margin: 0 12px;
`;

const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const LoadingText = styled.Text`
    font-size: 18px;
    color: ${({ theme }) => theme.colors.textPrimary};
    text-align: center;
    margin-top: 20px;
`;

const EmptyContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

const EmptyText = styled.Text`
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 16px;
    text-align: center;
`;

const BuchudaTag = styled.View`
    background-color: ${({ theme }) => theme.colors.accent};
    padding: 4px 8px;
    border-radius: 4px;
    margin-top: 8px;
    align-self: flex-start;
`;

const BuchudaText = styled.Text`
    color: ${({ theme }) => theme.colors.white};
    font-size: 12px;
`;

const StatsButton = styled.TouchableOpacity`
    flex-direction: row;
    align-items: center;
    padding: 8px 16px;
    border-radius: 8px;
    background-color: ${({ theme }) => theme.colors.backgroundLight}20;
`;

const BackButton = styled.TouchableOpacity`
    padding: 8px;
    margin-right: 16px;
`;

export default function PlayerGames() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [player, setPlayer] = useState<any>(null);
    const [games, setGames] = useState<Game[]>([]);
    const { colors } = useTheme();

    useEffect(() => {
        loadPlayerAndGames();
    }, []);

    const loadPlayerAndGames = async () => {
        try {
            setLoading(true);
            const [playerData, gamesData] = await Promise.all([
                playerService.getById(id as string),
                gameService.listByPlayer(id as string)
            ]);
            setPlayer(playerData);
            setGames(gamesData);
        } catch (error) {
            console.error('Erro ao carregar jogador e jogos:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Container>
                <InternalHeader title="Jogos do Jogador" />
                <LoadingContainer>
                    <ActivityIndicator size="large" color={colors.accent} />
                    <LoadingText>Carregando...</LoadingText>
                </LoadingContainer>
            </Container>
        );
    }

    return (
        <Container>
            <InternalHeader title={`Jogos de ${player?.name || ''}`} />
            <Content>
                <GamesList
                    data={games}
                    renderItem={({ item }) => (
                        <GameCard>
                            <GameDate>
                                {new Date(item.created_at).toLocaleDateString('pt-BR')}
                            </GameDate>
                            <GameScore>
                                <TeamScore>
                                    <TeamName>Time 1</TeamName>
                                    <Score>{item.team1_score}</Score>
                                </TeamScore>
                                <Separator>x</Separator>
                                <TeamScore>
                                    <TeamName>Time 2</TeamName>
                                    <Score>{item.team2_score}</Score>
                                </TeamScore>
                            </GameScore>
                            {item.is_buchuda && (
                                <BuchudaTag>
                                    <BuchudaText>Buchuda</BuchudaText>
                                </BuchudaTag>
                            )}
                            {item.is_buchuda_de_re && (
                                <BuchudaTag>
                                    <BuchudaText>Buchuda de Ré</BuchudaText>
                                </BuchudaTag>
                            )}
                        </GameCard>
                    )}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={() => (
                        <EmptyContainer>
                            <EmptyText>Nenhum jogo encontrado</EmptyText>
                        </EmptyContainer>
                    )}
                />
            </Content>
            <StatsButton onPress={() => router.push(`/jogador/${id}`)}>
                <Feather name="bar-chart-2" size={20} color={colors.white} />
                <Text style={{ color: colors.white, marginLeft: 8 }}>Estatísticas</Text>
            </StatsButton>
            <BackButton onPress={() => router.back()}>
                <Feather name="arrow-left" size={24} color={colors.white} />
            </BackButton>
        </Container>
    );
}