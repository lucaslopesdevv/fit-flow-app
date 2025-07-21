import { create } from 'zustand'
import { Appearance } from 'react-native'

export type ThemeType = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: ThemeType
  setTheme: (theme: ThemeType) => void
}

export const useThemeStore = create<ThemeState>(set => ({
  theme: 'system',
  setTheme: theme => set({ theme }),
}))

export function getEffectiveTheme(theme: ThemeType): 'light' | 'dark' {
  if (theme === 'system') {
    const colorScheme = Appearance.getColorScheme()
    return colorScheme === 'dark' ? 'dark' : 'light'
  }
  return theme
}
