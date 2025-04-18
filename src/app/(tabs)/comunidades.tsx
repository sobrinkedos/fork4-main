import React, { useState, useCallback } from 'react';
import { Alert, Modal as RNModal, ActivityIndicator, Pressable, View, ScrollView, RefreshControl } from 'react-native';
import styled from 'styled-components/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Community, communityService } from '@/services/communityService';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Header } from '@/components/Header';
import { useTheme } from '@/contexts/ThemeProvider';

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const ScrollContent = styled.ScrollView.attrs({
    contentContainerStyle: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 80,
    },
})`
    flex: 1;
`;

const CommunityCard = styled(Pressable)`
    background-color: ${({ theme }) => theme.colors.secondary};
    border-radius: 8px;
    margin-bottom: 16px;
    padding: 16px;
`;

const CommunityHeader = styled.View`
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
`;

const ActionButtons = styled.View`
    flex-direction: row;
    align-items: center;
    gap: 8px;
`;

const ActionButton = styled.TouchableOpacity`
    padding: 8px;
`;

const CommunityInfo = styled.View`
    flex: 1;
    margin-right: 12px;
`;

const CommunityTitle = styled.Text`
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 4px;
`;

const CommunityDescription = styled.Text`
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 14px;
    margin-bottom: 8px;
`;

const CommunityStats = styled.View`
    flex-direction: row;
    align-items: center;
    margin-top: 8px;
`;

const StatContainer = styled.View`
    flex-direction: row;
    align-items: center;
    margin-right: 16px;
`;

const StatText = styled.Text`
    color: ${({ theme }) => theme.colors.textTertiary};
    font-size: 14px;
    margin-left: 4px;
`;

const EmptyContainer = styled.View`
    flex: 1;
    align-items: center;
    justify-content: center;
    padding: 20px;
`;

const EmptyText = styled.Text`
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 16px;
    text-align: center;
    margin-top: 12px;
`;

const LoadingContainer = styled.View`
    flex: 1;
    align-items: center;
    justify-content: center;
`;

const FloatingButton = styled(Pressable)`
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 28px;
    background-color: ${({ theme }) => theme.colors.accent};
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.Text`
    font-size: 20px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.textPrimary};
    margin: 16px 0;
`;

const SectionContainer = styled.View`
    margin-bottom: 24px;
`;

export default function Comunidades() {
    const [createdCommunities, setCreatedCommunities] = useState<Community[]>([]);
    const [organizedCommunities, setOrganizedCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const { theme, colors } = useTheme();

    const loadCommunities = useCallback(async () => {
        try {
            console.log('Carregando comunidades em modo seguro (sem dados completos)');
            const { created, organized } = await communityService.list(false);
            setCreatedCommunities(created || []);
            setOrganizedCommunities(organized || []);
        } catch (error) {
            console.error('Erro ao carregar comunidades:', error);
            Alert.alert('Erro', 'Não foi possível carregar as comunidades');
            setCreatedCommunities([]);
            setOrganizedCommunities([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadCommunities();
        }, [loadCommunities])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        loadCommunities();
    };

    const handleEditCommunity = (community: Community, event: any) => {
        event.stopPropagation();
        router.push(`/comunidade/${community.id}/editar`);
    };

    const handleDeleteCommunity = async (community: Community, event: any) => {
        event.stopPropagation();
        
        // Verificar se existem competições associadas
        if (community.competitions_count > 0) {
            Alert.alert(
                'Não é possível excluir',
                'Esta comunidade possui competições e não pode ser excluída. Deseja inativá-la?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { 
                        text: 'Inativar', 
                        onPress: async () => {
                            try {
                                await communityService.updateCommunity(community.id, { is_active: false });
                                Alert.alert('Sucesso', 'Comunidade inativada com sucesso!');
                                loadCommunities();
                            } catch (error) {
                                console.error('Erro ao inativar comunidade:', error);
                                Alert.alert('Erro', 'Não foi possível inativar a comunidade');
                            }
                        } 
                    },
                ]
            );
            return;
        }

        // Se não houver competições, confirmar exclusão
        Alert.alert(
            'Confirmar exclusão',
            'Tem certeza que deseja excluir esta comunidade? Esta ação não pode ser desfeita.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Excluir', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await communityService.deleteCommunity(community.id);
                            Alert.alert('Sucesso', 'Comunidade excluída com sucesso!');
                            loadCommunities();
                        } catch (error) {
                            console.error('Erro ao excluir comunidade:', error);
                            Alert.alert('Erro', 'Não foi possível excluir a comunidade');
                        }
                    } 
                },
            ]
        );
    };

    const renderCommunityCard = (community: Community) => (
        <CommunityCard
            key={community.id}
            onPress={() => router.push(`/comunidade/${community.id}`)}
        >
            <CommunityHeader>
                <CommunityInfo>
                    <CommunityTitle>{community.name}</CommunityTitle>
                    {community.description && (
                        <CommunityDescription>{community.description}</CommunityDescription>
                    )}
                </CommunityInfo>
                <ActionButtons>
                    <ActionButton onPress={(e) => handleEditCommunity(community, e)}>
                        <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
                    </ActionButton>
                    <ActionButton onPress={(e) => handleDeleteCommunity(community, e)}>
                        <MaterialCommunityIcons name="delete" size={20} color={colors.error} />
                    </ActionButton>
                </ActionButtons>
            </CommunityHeader>
            
            <CommunityStats>
                <StatContainer>
                    <MaterialCommunityIcons name="account-group" size={20} color={colors.textTertiary} />
                    <StatText>{community.members_count || 0} membros</StatText>
                </StatContainer>
                <StatContainer>
                    <MaterialCommunityIcons name="trophy" size={20} color={colors.textTertiary} />
                    <StatText>{community.competitions_count || 0} competições</StatText>
                </StatContainer>
                {community.is_active === false && (
                    <StatContainer>
                        <MaterialCommunityIcons name="cancel" size={20} color={colors.error} />
                        <StatText style={{ color: colors.error }}>Inativa</StatText>
                    </StatContainer>
                )}
            </CommunityStats>
        </CommunityCard>
    );

    if (loading) {
        return (
            <Container>
                <Header title="Comunidades" />
                <LoadingContainer>
                    <ActivityIndicator size="large" color={colors.accent} />
                </LoadingContainer>
            </Container>
        );
    }

    const hasNoCommunities = createdCommunities.length === 0 && organizedCommunities.length === 0;

    return (
        <Container>
            <Header title="Comunidades" />
            
            <ScrollContent
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[colors.accent]}
                    />
                }
            >
                {hasNoCommunities ? (
                    <EmptyContainer>
                        <MaterialCommunityIcons name="account-group" size={48} color={colors.textSecondary} />
                        <EmptyText>Nenhuma comunidade encontrada</EmptyText>
                    </EmptyContainer>
                ) : (
                    <>
                        <SectionContainer>
                            <SectionTitle>Minhas Comunidades</SectionTitle>
                            {createdCommunities.length === 0 ? (
                                <EmptyText>Você ainda não criou nenhuma comunidade</EmptyText>
                            ) : (
                                createdCommunities.map(renderCommunityCard)
                            )}
                        </SectionContainer>

                        {organizedCommunities.length > 0 && (
                            <SectionContainer>
                                <SectionTitle>Comunidades que Organizo</SectionTitle>
                                {organizedCommunities.map(renderCommunityCard)}
                            </SectionContainer>
                        )}
                    </>
                )}
            </ScrollContent>

            <FloatingButton
                onPress={() => router.push('/comunidade/nova')}
            >
                <MaterialCommunityIcons name="plus" size={24} color={colors.backgroundLight} />
            </FloatingButton>
        </Container>
    );
}