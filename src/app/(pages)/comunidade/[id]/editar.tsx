import React, { useState, useEffect } from 'react';
import { Alert, ActivityIndicator, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import styled from 'styled-components/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { InternalHeader } from '@/components/InternalHeader';
import { useTheme } from '@/contexts/ThemeProvider';
import { communityService } from '@/services/communityService';
import { TextInput } from 'react-native-paper';
import { useAuth } from '@/hooks/useAuth';

const Container = styled.View`
    flex: 1;
    background-color: ${props => props.theme.colors.backgroundDark};
`;

const Content = styled.View`
    flex: 1;
    padding: 20px;
`;

const InputContainer = styled.View`
    margin-bottom: 20px;
`;

const Label = styled.Text`
    font-size: 16px;
    margin-bottom: 8px;
    color: ${props => props.theme.colors.textPrimary};
`;

const ButtonContainer = styled.View`
    margin-top: 20px;
    flex-direction: row;
    justify-content: space-between;
`;

const Button = styled.TouchableOpacity`
    background-color: ${props => props.variant === 'secondary' ? props.theme.colors.gray600 : props.theme.colors.primary};
    padding: 15px;
    border-radius: 8px;
    align-items: center;
    justify-content: center;
    flex: 1;
    margin: 0 5px;
`;

const ButtonText = styled.Text`
    color: ${props => props.theme.colors.white};
    font-size: 16px;
    font-weight: bold;
`;

const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const ToggleContainer = styled.View`
    flex-direction: row;
    align-items: center;
    margin-bottom: 20px;
`;

const ToggleLabel = styled.Text`
    font-size: 16px;
    color: ${props => props.theme.colors.textPrimary};
    margin-right: 10px;
`;

const ToggleSwitch = styled.Switch`
`;

export default function EditCommunity() {
    const { colors } = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasCompetitions, setHasCompetitions] = useState(false);

    useEffect(() => {
        const loadCommunity = async () => {
            try {
                setLoading(true);
                const community = await communityService.getById(id as string);
                
                if (!community) {
                    Alert.alert('Erro', 'Comunidade não encontrada');
                    router.back();
                    return;
                }

                // Verificar se o usuário atual é o criador da comunidade
                if (community.created_by !== user?.id) {
                    Alert.alert('Acesso negado', 'Você não tem permissão para editar esta comunidade');
                    router.back();
                    return;
                }

                setName(community.name);
                setDescription(community.description || '');
                setIsActive(community.is_active !== false); // Se is_active for undefined, considera como true
                setHasCompetitions(community.competitions_count > 0);
            } catch (error) {
                console.error('Erro ao carregar comunidade:', error);
                Alert.alert('Erro', 'Não foi possível carregar os dados da comunidade');
                router.back();
            } finally {
                setLoading(false);
            }
        };

        loadCommunity();
    }, [id, router, user]);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Erro', 'O nome da comunidade é obrigatório');
            return;
        }

        try {
            setSaving(true);
            await communityService.updateCommunity(id as string, {
                name,
                description,
                is_active: isActive
            });
            Alert.alert('Sucesso', 'Comunidade atualizada com sucesso!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Erro ao atualizar comunidade:', error);
            Alert.alert('Erro', 'Não foi possível atualizar a comunidade');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Container>
                <InternalHeader title="Editar Comunidade" />
                <LoadingContainer>
                    <ActivityIndicator size="large" color={colors.primary} />
                </LoadingContainer>
            </Container>
        );
    }

    return (
        <Container>
            <InternalHeader title="Editar Comunidade" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView>
                    <Content>
                        <InputContainer>
                            <Label>Nome</Label>
                            <TextInput
                                mode="outlined"
                                value={name}
                                onChangeText={setName}
                                placeholder="Nome da comunidade"
                                style={{ backgroundColor: colors.backgroundLight }}
                                outlineColor={colors.gray600}
                                activeOutlineColor={colors.primary}
                                textColor={colors.textPrimary}
                            />
                        </InputContainer>

                        <InputContainer>
                            <Label>Descrição</Label>
                            <TextInput
                                mode="outlined"
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Descrição da comunidade"
                                multiline
                                numberOfLines={4}
                                style={{ backgroundColor: colors.backgroundLight }}
                                outlineColor={colors.gray600}
                                activeOutlineColor={colors.primary}
                                textColor={colors.textPrimary}
                            />
                        </InputContainer>

                        {hasCompetitions && (
                            <ToggleContainer>
                                <ToggleLabel>Ativa</ToggleLabel>
                                <ToggleSwitch
                                    value={isActive}
                                    onValueChange={setIsActive}
                                    trackColor={{ false: colors.gray600, true: colors.primary }}
                                    thumbColor={isActive ? colors.white : colors.gray300}
                                />
                            </ToggleContainer>
                        )}

                        <ButtonContainer>
                            <Button 
                                variant="secondary" 
                                onPress={() => router.back()}
                                style={{ marginRight: 10 }}
                            >
                                <ButtonText>Cancelar</ButtonText>
                            </Button>
                            <Button 
                                onPress={handleSave}
                                disabled={saving}
                                style={{ marginLeft: 10 }}
                            >
                                {saving ? (
                                    <ActivityIndicator color={colors.white} />
                                ) : (
                                    <ButtonText>Salvar</ButtonText>
                                )}
                            </Button>
                        </ButtonContainer>
                    </Content>
                </ScrollView>
            </KeyboardAvoidingView>
        </Container>
    );
}