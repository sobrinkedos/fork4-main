import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { useTheme } from '@/contexts/ThemeProvider';
import { InternalHeader } from '@/components/InternalHeader';
import { PageTransition } from '@/components/Transitions';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { rankingService, PairRanking } from '@/services/rankingService';
import { useRouter } from 'expo-router';

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const Content = styled.View`
    flex: 1;
    padding: 20px;
`;

const PairCard = styled.TouchableOpacity`
    background-color: ${({ theme }) => theme.colors.backgroundMedium};
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
`;

const Position = styled.Text`
    color: ${({ theme }) => theme.colors.primary};
    font-size: 24px;
    font-weight: bold;
    min-width: 40px;
`;

const CardHeader = styled.View`
    flex-direction: column;
    margin-bottom: 12px;
`;

const PlayerInfo = styled.View`
    flex: 1;
    flex-direction: row;
    align-items: center;
`;

const PlayerName = styled.Text`
    color: ${({ theme }) => theme.colors.gray100};
    font-size: 16px;
    font-weight: bold;
    margin-left: 8px;
`;

const PlayerIcon = styled.View`
    width: 32px;
    height: 32px;
    border-radius: 16px;
    background-color: ${({ theme }) => theme.colors.primary}20;
    align-items: center;
    justify-content: center;
`;

const Separator = styled.View`
    width: 32px;
    align-items: center;
`;

const SeparatorText = styled.Text`
    color: ${({ theme }) => theme.colors.gray300};
    font-size: 14px;
`;

const StatsContainer = styled.View`
    flex-direction: row;
    justify-content: space-between;
    padding-top: 12px;
    border-top-width: 1px;
    border-top-color: ${({ theme }) => theme.colors.backgroundLight};
`;

const StatItem = styled.View`
    align-items: center;
    flex: 1;
`;

const StatValue = styled.Text`
    color: ${({ theme }) => theme.colors.primary};
    font-size: 16px;
    font-weight: bold;
`;

const StatLabel = styled.Text`
    color: ${({ theme }) => theme.colors.gray300};
    font-size: 12px;
    margin-top: 4px;
    text-align: center;
`;

const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

const ErrorContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

const ErrorText = styled.Text`
    color: ${({ theme }) => theme.colors.error};
    font-size: 16px;
    text-align: center;
`;

const EmptyContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

const EmptyText = styled.Text`
    color: ${({ theme }) => theme.colors.gray300};
    font-size: 16px;
    text-align: center;
`;

export default function TopDuplas() {
    const [pairs, setPairs] = useState<PairRanking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { colors } = useTheme();
    const router = useRouter();

    useEffect(() => {
        loadPairs();
    }, []);

    const loadPairs = async () => {
        try {
            const data = await rankingService.getTopPairs();
            setPairs(data);
            setError(null);
        } catch (err) {
            setError('Erro ao carregar o ranking de duplas');
        } finally {
            setLoading(false);
        }
    };

    const renderPair = ({ item, index }: { item: PairRanking; index: number }) => (
        <PairCard>
            <CardHeader>
                <Position>{index + 1}º</Position>
                <PlayerInfo>
                    <PlayerIcon>
                        <MaterialCommunityIcons name="account" size={20} color={colors.primary} />
                    </PlayerIcon>
                    <PlayerName>{item.player1.name}</PlayerName>
                </PlayerInfo>
                <Separator>
                    <SeparatorText>&</SeparatorText>
                </Separator>
                <PlayerInfo>
                    <PlayerIcon>
                        <MaterialCommunityIcons name="account" size={20} color={colors.primary} />
                    </PlayerIcon>
                    <PlayerName>{item.player2.name}</PlayerName>
                </PlayerInfo>
            </CardHeader>
            <StatsContainer>
                <StatItem>
                    <StatValue>{item.totalGames}</StatValue>
                    <StatLabel>Jogos</StatLabel>
                </StatItem>
                <StatItem>
                    <StatValue>{item.wins}</StatValue>
                    <StatLabel>Vitórias</StatLabel>
                </StatItem>
                <StatItem>
                    <StatValue>{item.winRate.toFixed(0)}%</StatValue>
                    <StatLabel>Taxa de Vitória</StatLabel>
                </StatItem>
            </StatsContainer>
        </PairCard>
    );

    if (loading) {
        return (
            <Container>
                <InternalHeader title="Top Duplas" />
                <LoadingContainer>
                    <ActivityIndicator size="large" color={colors.primary} />
                </LoadingContainer>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <InternalHeader title="Top Duplas" />
                <ErrorContainer>
                    <ErrorText>{error}</ErrorText>
                </ErrorContainer>
            </Container>
        );
    }

    return (
        <PageTransition>
            <Container>
                <InternalHeader title="Top Duplas" />
                <Content>
                    {pairs.length > 0 ? (
                        <FlatList
                            data={pairs}
                            renderItem={renderPair}
                            keyExtractor={(item, index) => item.player1Id && item.player2Id ? `${item.player1Id}-${item.player2Id}` : `pair-${index}`}
                        />
                    ) : (
                        <EmptyContainer>
                            <EmptyText>Nenhuma dupla encontrada</EmptyText>
                        </EmptyContainer>
                    )}
                </Content>
            </Container>
        </PageTransition>
    );
}
