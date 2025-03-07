import React, { useState, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { Feather } from '@expo/vector-icons';
import { gameService, VictoryType } from '@/services/gameService';
import { competitionService } from '@/services/competitionService';
import { InternalHeader } from '@/components/InternalHeader';
import { useTheme } from '@/contexts/ThemeProvider';

interface VictoryOption {
    type: VictoryType;
    label: string;
    points: number;
    description: string;
}

interface Player {
    id: string;
    name: string;
}

const victoryOptions: VictoryOption[] = [
    {
        type: 'simple',
        label: 'Vitória Simples',
        points: 1,
        description: 'Vitória normal (1 ponto)'
    },
    {
        type: 'carroca',
        label: 'Vitória de Carroça',
        points: 2,
        description: 'Vitória com carroça (2 pontos)'
    },
    {
        type: 'la_e_lo',
        label: 'Vitória de Lá-e-lô',
        points: 3,
        description: 'Vitória de lá-e-lô (3 pontos)'
    },
    {
        type: 'cruzada',
        label: 'Vitória de Cruzada',
        points: 4,
        description: 'Vitória de cruzada (4 pontos)'
    },
    {
        type: 'contagem',
        label: 'Vitória por Contagem',
        points: 1,
        description: 'Vitória por contagem de pontos (1 ponto)'
    },
    {
        type: 'empate',
        label: 'Empate',
        points: 0,
        description: 'Empate (0 pontos + 1 ponto bônus na próxima)'
    }
];

export default function RegisterResult() {
    const router = useRouter();
    const { id: communityId, competitionId, gameId } = useLocalSearchParams();
    const { colors } = useTheme();
    const [selectedType, setSelectedType] = useState<VictoryType | null>(null);
    const [winnerTeam, setWinnerTeam] = useState<'team1' | 'team2' | null>(null);
    const [loading, setLoading] = useState(false);
    const [team1Players, setTeam1Players] = useState<Player[]>([]);
    const [team2Players, setTeam2Players] = useState<Player[]>([]);

    useEffect(() => {
        loadPlayers();
    }, []);

    const loadPlayers = async () => {
        try {
            const game = await gameService.getById(gameId as string);
            if (!game) return;

            const team1 = await Promise.all(
                game.team1.map(playerId => competitionService.getPlayerById(playerId))
            );

            const team2 = await Promise.all(
                game.team2.map(playerId => competitionService.getPlayerById(playerId))
            );

            setTeam1Players(team1.filter(Boolean));
            setTeam2Players(team2.filter(Boolean));
        } catch (error) {
            console.error('Erro ao carregar jogadores:', error);
            Alert.alert('Erro', 'Não foi possível carregar os jogadores');
        }
    };

    const handleRegisterResult = async () => {
        if (!selectedType) {
            Alert.alert('Erro', 'Selecione o tipo de vitória');
            return;
        }

        if (selectedType !== 'empate' && !winnerTeam) {
            Alert.alert('Erro', 'Selecione o time vencedor');
            return;
        }

        try {
            setLoading(true);
            const winnerTeamNumber = winnerTeam === 'team1' ? 1 : winnerTeam === 'team2' ? 2 : null;
            const result = await gameService.registerRound(gameId as string, selectedType, winnerTeamNumber);
            
            if (result.status === 'finished') {
                let message = 'Jogo finalizado!';
                if (result.team1_score === 6 && result.team2_score === 0) {
                    message = 'BUCHUDA! 🎉\nTime 1 venceu sem que o adversário marcasse pontos!';
                } else if (result.team2_score === 6 && result.team1_score === 0) {
                    message = 'BUCHUDA! 🎉\nTime 2 venceu sem que o adversário marcasse pontos!';
                } else if (result.team1_was_losing_5_0) {
                    message = 'BUCHUDA DE RÉ! 🎉🔄\nIncrível virada do Time 1 após estar perdendo de 5x0!';
                } else if (result.team2_was_losing_5_0) {
                    message = 'BUCHUDA DE RÉ! 🎉🔄\nIncrível virada do Time 2 após estar perdendo de 5x0!';
                }
                Alert.alert('Parabéns!', message, [
                    { 
                        text: 'OK', 
                        onPress: () => {
                            router.back();
                        }
                    }
                ]);
            } else {
                router.back();
            }
        } catch (error) {
            console.error('Erro ao registrar resultado:', error);
            Alert.alert('Erro', 'Não foi possível registrar o resultado');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <LoadingContainer colors={colors}>
                <ActivityIndicator size="large" color={colors.primary} />
            </LoadingContainer>
        );
    }

    return (
        <Container colors={colors}>
            <InternalHeader title="Registrar Resultado" onBackPress={() => router.back()} />
            <MainContent 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 32 }}
            >
                <SectionTitle colors={colors}>Tipo de Vitória</SectionTitle>

                <VictoryOptionsGrid>
                    {victoryOptions.map(option => (
                        <VictoryOptionWrapper key={option.type}>
                            <VictoryOption
                                onPress={() => {
                                    setSelectedType(option.type);
                                    if (option.type === 'empate') {
                                        setWinnerTeam(null);
                                    }
                                }}
                                selected={selectedType === option.type}
                                colors={colors}
                            >
                                <VictoryOptionContent>
                                    <VictoryTitle colors={colors}>{option.label}</VictoryTitle>
                                    <VictoryDescription colors={colors}>{option.description}</VictoryDescription>
                                </VictoryOptionContent>
                                {selectedType === option.type && (
                                    <Feather name="check" size={24} color={colors.buttonText} />
                                )}
                            </VictoryOption>
                        </VictoryOptionWrapper>
                    ))}
                </VictoryOptionsGrid>

                {selectedType && selectedType !== 'empate' && (
                    <>
                        <SectionTitle colors={colors}>Time Vencedor</SectionTitle>
                        <TeamOptions>
                            <TeamOption
                                selected={winnerTeam === 'team1'}
                                onPress={() => setWinnerTeam('team1')}
                                colors={colors}
                            >
                                <TeamOptionContent>
                                    {team1Players.map((player, index) => (
                                        <TeamOptionText key={player.id} colors={colors}>
                                            {player.name}
                                            {index < team1Players.length - 1 ? ' e ' : ''}
                                        </TeamOptionText>
                                    ))}
                                </TeamOptionContent>
                            </TeamOption>

                            <TeamOption
                                selected={winnerTeam === 'team2'}
                                onPress={() => setWinnerTeam('team2')}
                                colors={colors}
                            >
                                <TeamOptionContent>
                                    {team2Players.map((player, index) => (
                                        <TeamOptionText key={player.id} colors={colors}>
                                            {player.name}
                                            {index < team2Players.length - 1 ? ' e ' : ''}
                                        </TeamOptionText>
                                    ))}
                                </TeamOptionContent>
                            </TeamOption>
                        </TeamOptions>
                    </>
                )}

                <RegisterButton onPress={handleRegisterResult} colors={colors}>
                    <RegisterButtonText colors={colors}>Registrar Resultado</RegisterButtonText>
                </RegisterButton>
            </MainContent>
        </Container>
    );
}

const Container = styled.View<{ colors: any }>`
    flex: 1;
    background-color: ${props => props.colors.background};
`;

const LoadingContainer = styled.View<{ colors: any }>`
    flex: 1;
    align-items: center;
    justify-content: center;
    background-color: ${props => props.colors.background};
`;

const MainContent = styled.ScrollView`
    flex: 1;
    padding: 16px;
`;

const SectionTitle = styled.Text<{ colors: any }>`
    color: ${props => props.colors.text};
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 16px;
    margin-top: 24px;
`;

const VictoryOptionsGrid = styled.View`
    flex-direction: row;
    flex-wrap: wrap;
    margin: -4px;
`;

const VictoryOptionWrapper = styled.View`
    width: 50%;
    padding: 4px;
`;

const VictoryOption = styled.TouchableOpacity<{ selected: boolean, colors: any }>`
    background-color: ${props => props.selected ? props.colors.primary : props.colors.card};
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 8px;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    border: 1px solid ${props => props.selected ? '#fff' : props.colors.border};
`;

const VictoryOptionContent = styled.View`
    flex: 1;
    margin-right: 16px;
`;

const VictoryTitle = styled.Text<{ colors: any }>`
    color: ${props => props.colors.text};
    font-size: 16px;
    font-weight: bold;
`;

const VictoryDescription = styled.Text<{ colors: any }>`
    color: ${props => props.colors.textSecondary};
    font-size: 14px;
    margin-top: 4px;
`;

const TeamOptions = styled.View`
    flex-direction: row;
    margin: -4px;
`;

const TeamOption = styled.TouchableOpacity<{ selected: boolean, colors: any }>`
    flex: 1;
    background-color: ${props => props.selected ? props.colors.primary : props.colors.card};
    border-radius: 8px;
    padding: 16px;
    margin: 4px;
    align-items: center;
    border: 1px solid ${props => props.selected ? '#fff' : props.colors.border};
`;

const TeamOptionContent = styled.View`
    align-items: center;
    justify-content: center;
`;

const TeamOptionText = styled.Text<{ colors: any }>`
    color: ${props => props.colors.text};
    font-size: 16px;
    text-align: center;
`;

const RegisterButton = styled.TouchableOpacity<{ colors: any }>`
    background-color: ${props => props.colors.primary};
    padding: 16px;
    border-radius: 8px;
    align-items: center;
    margin-top: 24px;
    margin-bottom: 24px;
`;

const RegisterButtonText = styled.Text<{ colors: any }>`
    color: ${props => props.colors.buttonText};
    font-size: 16px;
    font-weight: bold;
`;
