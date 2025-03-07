import React from 'react';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeProvider';

interface ThemeToggleProps {
  size?: number;
}

export function ThemeToggle({ size = 24 }: ThemeToggleProps) {
  const { toggleTheme, isDarkTheme } = useTheme();

  return (
    <ToggleButton onPress={toggleTheme}>
      <Feather 
        name={isDarkTheme ? 'sun' : 'moon'} 
        size={size} 
        color={isDarkTheme ? '#F5F5FA' : '#121214'} 
      />
    </ToggleButton>
  );
}

const ToggleButton = styled(TouchableOpacity)`
  padding: 8px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.colors.tertiary};
`;
