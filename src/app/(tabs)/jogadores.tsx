import React, { useState, useEffect, useCallback } from 'react';
import { Alert, FlatList, RefreshControl, ActivityIndicator, View } from 'react-native';
import styled from 'styled-components/native';
import { MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { Player, playerService } from '@/services/playerService';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Header } from '@/components/Header';
import { useTheme } from '@/contexts/ThemeProvider';

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const Content = styled.View`
    flex: 1;
    padding: 8px;
`;

const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const PlayerCard = styled.TouchableOpacity`
    background-color: ${({ theme }) => theme.colors.secondary};
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 8px;
    elevation: 3;
`;

const PlayerHeader = styled.View`
    flex-direction: row;
    align-items: center;
    margin-bottom: 8px;
`;

const Avatar = styled.View`
    width: 50px;
    height: 50px;
    border-radius: 25px;
    background-color: ${({ theme }) => theme.colors.accent}20;
    justify-content: center;
    align-items: center;
    margin-right: 12px;
`;

const PlayerInfo = styled.View`
    flex: 1;
`;

const PlayerNameContainer = styled.View`
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
`;

const PlayerName = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.textPrimary};
`;

const PlayerNickname = styled.Text`
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-top: 2px;
`;

const PlayerPhone = styled.Text`
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-top: 4px;
`;

const LinkedUserBadge = styled.View`
    flex-direction: row;
    align-items: center;
    background-color: ${({ theme }) => theme.colors.successLight};
    padding: 4px 8px;
    border-radius: 8px;
    margin-left: 8px;
`;

const LinkedUserText = styled.Text`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.success};
    margin-left: 4px;
`;

const StatsContainer = styled.View`
    flex-direction: row;
    justify-content: space-between;
    margin-top: 12px;
    padding-top: 12px;
    border-top-width: 1px;
    border-top-color: ${({ theme }) => theme.colors.backgroundLight}40;
`;

const StatItem = styled.View`
    align-items: center;
`;

const StatValue = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: 4px;
`;

const StatLabel = styled.Text`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textSecondary};
`;

const ActionsContainer = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    margin-top: 12px;
`;

const ActionButton = styled.Pressable`
    padding: 8px;
    margin-left: 8px;
`;

const SectionTitle = styled.Text`
    font-size: 20px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: 16px;
    margin-top: 24px;
`;

const EmptyText = styled.Text`
    font-size: 16px;
    color: ${({ theme }) => theme.colors.textSecondary};
    text-align: center;
    margin: 24px 0;
`;

const FAB = styled.Pressable`
    position: absolute;
    right: 20px;
    bottom: 20px;
    width: 56px;
    height: 56px;
    border-radius: 28px;
    background-color: ${({ theme }) => theme.colors.accent};
    justify-content: center;
    align-items: center;
    elevation: 4;
`;

export default function Jogadores() {
    const router = useRouter();
    const [myPlayers, setMyPlayers] = useState<Player[]>([]);
    const [communityPlayers, setCommunityPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { theme, colors } = useTheme();

    const loadPlayers = async () => {
        try {
            setLoading(true);
            const { myPlayers: my, communityPlayers: community } = await playerService.list();
            setMyPlayers(my || []);
            setCommunityPlayers(community || []);
        } catch (error) {
            console.error('Erro ao carregar jogadores:', error);
            Alert.alert('Erro', 'Não foi possível carregar os jogadores');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlayers();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadPlayers();
        }, [])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        loadPlayers().finally(() => setRefreshing(false));
    };

    const handleDelete = (player: Player) => {
        Alert.alert(
            'Confirmar exclusão',
            `Deseja realmente excluir o jogador ${player.name}?`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await playerService.delete(player.id);
                            Alert.alert('Sucesso', 'Jogador excluído com sucesso');
                            loadPlayers();
                        } catch (error) {
                            console.error('Erro ao excluir jogador:', error);
                            Alert.alert('Erro', 'Não foi possível excluir o jogador');
                        }
                    }
                }
            ]
        );
    };

    const renderPlayerItem = ({ item, isMyPlayer }: { item: Player; isMyPlayer: boolean }) => (
        <PlayerCard onPress={() => router.push(`/jogador/${item.id}/jogos`)}>
            <PlayerHeader>
                <Avatar>
                    <FontAwesome5 name="user-alt" size={20} color={colors.accent} />
                </Avatar>
                <PlayerInfo>
                    <PlayerNameContainer>
                        <PlayerName>{item.name}</PlayerName>
                        {item.isLinkedUser && (
                            <LinkedUserBadge>
                                <MaterialCommunityIcons
                                    name="account-check"
                                    size={16}
                                    color={colors.success}
                                />
                                <LinkedUserText>Vinculado</LinkedUserText>
                            </LinkedUserBadge>
                        )}
                    </PlayerNameContainer>
                    {item.nickname && (
                        <PlayerNickname>@{item.nickname}</PlayerNickname>
                    )}
                    {item.phone && (
                        <PlayerPhone>
                            <MaterialCommunityIcons name="phone" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                            {item.phone}
                        </PlayerPhone>
                    )}
                </PlayerInfo>
            </PlayerHeader>

            <StatsContainer>
                <StatItem>
                    <StatValue>{item.stats?.total_games || 0}</StatValue>
                    <StatLabel>Jogos</StatLabel>
                </StatItem>
                <StatItem>
                    <StatValue>{item.stats?.wins || 0}</StatValue>
                    <StatLabel>Vitórias</StatLabel>
                </StatItem>
                <StatItem>
                    <StatValue>{item.stats?.losses || 0}</StatValue>
                    <StatLabel>Derrotas</StatLabel>
                </StatItem>
                <StatItem>
                    <StatValue>{item.stats?.buchudas || 0}</StatValue>
                    <StatLabel>Buchudas</StatLabel>
                </StatItem>
            </StatsContainer>

            {isMyPlayer && (
                <ActionsContainer>
                    <ActionButton onPress={() => router.push(`/jogador/${item.id}/editar`)}>
                        <Feather name="edit" size={20} color={colors.accent} />
                    </ActionButton>
                    <ActionButton onPress={() => handleDelete(item)}>
                        <Feather name="trash-2" size={20} color={colors.error} />
                    </ActionButton>
                </ActionsContainer>
            )}
        </PlayerCard>
    );

    const renderSectionHeader = (title: string) => (
        <SectionTitle>{title}</SectionTitle>
    );

    const renderItem = ({ item }: { item: any }) => {
        if (item.sectionTitle) {
            return renderSectionHeader(item.sectionTitle);
        }

        if (item.emptyMessage) {
            return <EmptyText>{item.emptyMessage}</EmptyText>;
        }

        return renderPlayerItem({
            item,
            isMyPlayer: item.section === 'myPlayers'
        });
    };

    // Preparar dados para a FlatList
    const sections = [];
    
    // Seção "Meus Jogadores"
    sections.push({ sectionTitle: 'Meus Jogadores' });
    if (myPlayers.length === 0) {
        sections.push({ emptyMessage: 'Você ainda não criou nenhum jogador' });
    } else {
        myPlayers.forEach(player => sections.push({ ...player, section: 'myPlayers' }));
    }

    // Seção "Jogadores das Comunidades"
    sections.push({ sectionTitle: 'Jogadores das Comunidades' });
    if (communityPlayers.length === 0) {
        sections.push({ emptyMessage: 'Nenhum jogador disponível nas suas comunidades' });
    } else {
        communityPlayers.forEach(player => sections.push({ ...player, section: 'communityPlayers' }));
    }

    if (loading) {
        return (
            <Container>
                <Header />
                <LoadingContainer>
                    <ActivityIndicator size="large" color={colors.accent} />
                </LoadingContainer>
            </Container>
        );
    }

    return (
        <Container>
            <Header title="JOGADORES" />
            <Content>
                <FlatList
                    data={sections}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item.id || `section-${index}`}
                    contentContainerStyle={{ padding: 20 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[colors.accent]}
                        />
                    }
                />

                <FAB onPress={() => router.push('/jogador/jogador/novo')}>
                    <Feather name="plus" size={24} color={colors.backgroundLight} />
                </FAB>
            </Content>
        </Container>
    );
}