import { View, type ViewProps } from 'react-native'
import { useTheme } from '@/context/ThemeContext'

export type ThemedViewProps = ViewProps & {
  lightColor?: string
  darkColor?: string
}

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const { theme, mode } = useTheme()

  // Determina a cor de fundo com base no tema atual
  const backgroundColor =
    mode === 'dark' ? darkColor || theme.colors.background : lightColor || theme.colors.background

  return <View style={[{ backgroundColor }, style]} {...otherProps} />
}
