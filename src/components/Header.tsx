import styled from "styled-components/native"
import { colors } from "@/styles/colors"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity, StatusBar, Platform, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { ThemeToggle } from './ThemeToggle';

const logoSvg = `
<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="30" height="30" rx="8" fill="#1E1E1E"/>
    <path d="M7 7h4v4H7zM7 13h4v4H7zM7 19h4v4H7zM13 7h4v4h-4zM13 13h4v4h-4zM13 19h4v4h-4zM19 7h4v4h-4zM19 13h4v4h-4zM19 19h4v4h-4z" fill="#FFF"/>
</svg>
`;

const SafeAreaView = styled.View`
    background-color: ${colors.primary};
`;

const Container = styled.View<{ statusBarHeight: number }>`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 16px 12px;
    background-color: ${colors.primary};
    padding-top: ${({ statusBarHeight }) => Platform.OS === 'ios' ? 44 : 16}px;
    width: 100%;
`;

const LeftContainer = styled.View`
    flex-direction: row;
    align-items: center;
    max-width: 50%;
`;

const LogoContainer = styled.View`
    width: 32px;
    height: 32px;
    border-radius: 16px;
    background-color: ${colors.white};
    align-items: center;
    justify-content: center;
`;

const Title = styled.Text`
    color: ${colors.white};
    font-size: 20px;
    font-weight: bold;
    text-transform: uppercase;
    flex-shrink: 1;
`;

const AppTitle = styled(Title)`
    margin-left: 8px;
    text-transform: none;
    flex-shrink: 1;
    font-size: 18px;
`;

const ActionContainer = styled.View`
    flex-direction: row;
    align-items: center;
    gap: 12px;
`;

const IconButton = styled.TouchableOpacity`
    padding: 4px;
`;

interface HeaderProps {
    title?: string;
    showBackButton?: boolean;
    isDashboard?: boolean;
}

export function Header({ title, showBackButton, isDashboard }: HeaderProps) {
    const router = useRouter();
    const { signOut } = useAuth();
    const statusBarHeight = StatusBar.currentHeight || 0;

    React.useEffect(() => {
        if (Platform.OS === 'android') {
            StatusBar.setTranslucent(true);
            StatusBar.setBackgroundColor('transparent');
        }
        StatusBar.setBarStyle('light-content');
    }, []);

    const handleLogout = async () => {
        try {
            const response = await signOut();
            if (response.success) {
                // Redirecionar para a página de login após logout bem-sucedido
                router.replace('/login');
            } else {
                console.error('Erro ao fazer logout:', response.error);
            }
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    return (
        <SafeAreaView>
            <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
            <Container statusBarHeight={statusBarHeight}>
                <LeftContainer>
                    {isDashboard ? (
                        <>
                            <LogoContainer>
                                <SvgXml xml={logoSvg} width={32} height={32} />
                            </LogoContainer>
                            <AppTitle>DommatchApp</AppTitle>
                        </>
                    ) : showBackButton ? (
                        <IconButton onPress={() => router.back()}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
                        </IconButton>
                    ) : (
                        <Title>{title}</Title>
                    )}
                </LeftContainer>
                
                <ActionContainer>
                    <IconButton onPress={() => router.push('/notifications')}>
                        <MaterialCommunityIcons name="bell-outline" size={24} color={colors.white} />
                    </IconButton>
                    <IconButton onPress={() => router.push('/profile')}>
                        <MaterialCommunityIcons name="account-circle-outline" size={24} color={colors.white} />
                    </IconButton>
                    <ThemeToggle />
                    <IconButton onPress={handleLogout}>
                        <MaterialCommunityIcons name="logout" size={24} color={colors.white} />
                    </IconButton>
                </ActionContainer>
            </Container>
        </SafeAreaView>
    );
}
