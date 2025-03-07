import React, { useState } from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { useRouter } from 'expo-router';
import { InternalHeader } from '@/components/InternalHeader';
import { playerService } from '@/services/playerService';
import { Feather } from '@expo/vector-icons';
import { TextInput } from 'react-native-paper';
import { useTheme } from 'styled-components/native';

export default function NovoJogador() {
    const router = useRouter();
    const { colors } = useTheme();
    const [formData, setFormData] = useState({
        name: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Erro', 'O nome do jogador é obrigatório');
            return;
        }

        if (!formData.phone.trim()) {
            Alert.alert('Erro', 'O celular do jogador é obrigatório');
            return;
        }

        try {
            setLoading(true);
            await playerService.create({
                name: formData.name.trim(),
                phone: formData.phone.trim()
            });
            router.back();
        } catch (error: any) {
            console.error('Erro ao criar jogador:', error);
            Alert.alert(
                'Erro',
                error?.message || 'Erro ao criar jogador. Tente novamente.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <InternalHeader title="Novo Jogador" />
            <Content>
                <FormGroup>
                    <Label>Nome</Label>
                    <TextInput
                        mode="outlined"
                        value={formData.name}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                        placeholder="Nome do jogador"
                        style={{
                            backgroundColor: colors.backgroundDark,
                        }}
                        theme={{
                            colors: {
                                primary: colors.accent,
                                text: colors.textPrimary,
                                placeholder: colors.textSecondary,
                                background: colors.backgroundDark,
                                surface: colors.backgroundDark,
                                onSurface: colors.textPrimary,
                                outline: colors.backgroundLight,
                            }
                        }}
                    />
                </FormGroup>

                <FormGroup>
                    <Label>Celular</Label>
                    <TextInput
                        mode="outlined"
                        value={formData.phone}
                        onChangeText={(text) => {
                            // Remove tudo que não for número
                            const numericOnly = text.replace(/\D/g, '');
                            // Limita a 11 caracteres
                            const limitedText = numericOnly.slice(0, 11);
                            setFormData(prev => ({ ...prev, phone: limitedText }));
                        }}
                        placeholder="(00) 00000-0000"
                        keyboardType="phone-pad"
                        maxLength={11}
                        style={{
                            backgroundColor: colors.backgroundDark,
                        }}
                        theme={{
                            colors: {
                                primary: colors.accent,
                                text: colors.textPrimary,
                                placeholder: colors.textSecondary,
                                background: colors.backgroundDark,
                                surface: colors.backgroundDark,
                                onSurface: colors.textPrimary,
                                outline: colors.backgroundLight,
                            }
                        }}
                    />
                </FormGroup>

                <SaveButton onPress={handleSave} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <SaveButtonText>Criar Jogador</SaveButtonText>
                    )}
                </SaveButton>
            </Content>
        </Container>
    );
}

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const Content = styled.ScrollView.attrs({
    contentContainerStyle: {
        flexGrow: 1,
        padding: 20,
    },
})``;

const FormGroup = styled.View`
    margin-bottom: 20px;
`;

const Label = styled.Text`
    font-size: 16px;
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: 8px;
`;

const SaveButton = styled.TouchableOpacity<{ disabled?: boolean }>`
    background-color: ${({ theme }) => theme.colors.accent};
    padding: 16px;
    border-radius: 8px;
    align-items: center;
    opacity: ${props => props.disabled ? 0.7 : 1};
`;

const SaveButtonText = styled.Text`
    color: ${({ theme }) => theme.colors.white};
    font-size: 16px;
    font-weight: bold;
`;
