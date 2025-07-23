import React, { createContext, useContext, useEffect, useState } from 'react'
import { useColorScheme } from 'react-native'
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper'

// Definindo os tipos para o contexto
type ThemeMode = 'light' | 'dark'

interface ThemeContextType {
  mode: ThemeMode
  theme: typeof MD3LightTheme | typeof MD3DarkTheme
  toggleTheme: () => void
}

// Criando o contexto
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Hook personalizado para usar o tema
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Componente Provider
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Obtém o esquema de cores do sistema
  const colorScheme = useColorScheme()
  const [mode, setMode] = useState<ThemeMode>(colorScheme === 'dark' ? 'dark' : 'light')

  // Atualiza o modo quando o esquema de cores do sistema muda
  useEffect(() => {
    setMode(colorScheme === 'dark' ? 'dark' : 'light')
  }, [colorScheme])

  // Temas personalizados com contraste WCAG AA
  const darkTheme = {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      primary: '#8B5CF6', // Roxo mais escuro para dark mode
      primaryContainer: '#4C1D95',
      secondary: '#03DAC6',
      background: '#0F0F0F', // Background mais escuro
      surface: '#1A1A1A', // Cards mais escuros
      surfaceVariant: '#2D2D2D', // Variante de surface mais escura
      onSurface: '#FFFFFF', // High contrast white on dark
      onSurfaceVariant: '#E0E0E0', // Slightly reduced for secondary text
      onBackground: '#FFFFFF',
      error: '#CF6679',
      onError: '#000000',
      outline: '#404040', // Outline mais escuro
      // Additional colors for better accessibility
      onPrimary: '#FFFFFF', // White text on primary color
      onSecondary: '#000000',
      onErrorContainer: '#FFFFFF',
      // Cores adicionais para melhor adaptação ao dark mode
      elevation: {
        level0: 'transparent',
        level1: '#1F1F1F', // Cards elevados
        level2: '#242424',
        level3: '#292929',
        level4: '#2E2E2E',
        level5: '#333333',
      },
    },
    dark: true,
  }

  const lightTheme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: '#6200EE', // Strong purple for good contrast
      primaryContainer: '#E1BEE7',
      secondary: '#018786', // Darker teal for better contrast
      background: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceVariant: '#F5F5F5',
      onSurface: '#1C1B1F', // Near black for maximum contrast
      onSurfaceVariant: '#49454F', // Dark gray for secondary text
      onBackground: '#1C1B1F',
      error: '#BA1A1A', // Darker red for better contrast
      onError: '#FFFFFF',
      outline: '#79747E', // Improved contrast for borders
      // Additional colors for better accessibility
      onPrimary: '#FFFFFF', // White text on primary color
      onSecondary: '#FFFFFF',
      onErrorContainer: '#FFFFFF',
    },
    dark: false,
  }

  // Tema atual baseado no modo
  const theme = mode === 'dark' ? darkTheme : lightTheme

  // Função para alternar o tema manualmente
  const toggleTheme = () => {
    setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'))
  }

  // Tema está sempre pronto

  return (
    <ThemeContext.Provider value={{ mode, theme, toggleTheme }}>{children}</ThemeContext.Provider>
  )
}
