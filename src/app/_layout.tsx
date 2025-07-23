import { AuthProvider, useAuth } from '../hooks/useAuth'
import { Redirect, Slot, usePathname } from 'expo-router'
import React from 'react'
import { View, ActivityIndicator, Text, StyleSheet, StatusBar } from 'react-native'
import { PaperProvider } from 'react-native-paper'
import { Button } from '@/components/common/Button'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

function AppContent() {
  const { theme, mode } = useTheme()

  // Ajusta a barra de status com base no tema
  StatusBar.setBarStyle(mode === 'dark' ? 'light-content' : 'dark-content')

  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <AuthGate>
          <Slot />
        </AuthGate>
      </PaperProvider>
    </AuthProvider>
  )
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const pathname = usePathname()
  const { theme } = useTheme()

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
          Carregando...
        </Text>
      </View>
    )
  }

  // Handle unauthenticated users
  if (!user) {
    if (pathname !== '/login' && pathname !== '/reset-password' && pathname !== '/confirm') {
      return <Redirect href="/login" />
    }
    return <>{children}</>
  }

  // Handle authenticated users with role-based routing
  const isValidRole = ['student', 'instructor', 'admin'].includes(user.role)

  if (!isValidRole) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorTitle, { color: theme.colors.error }]}>Erro de Acesso</Text>
        <Text style={[styles.errorMessage, { color: theme.colors.onBackground }]}>
          Função de usuário desconhecida: {user.role}
        </Text>
        <Text style={[styles.errorSubtext, { color: theme.colors.onSurfaceVariant }]}>
          Entre em contato com o administrador do sistema.
        </Text>
        <Button
          variant="contained"
          onPress={signOut}
          style={styles.errorButton}
          title="Fazer Logout"
        />
      </View>
    )
  }

  // Simple role-based redirects without pathname checks to avoid loops
  if (user.role === 'admin' && pathname === '/') {
    return <Redirect href="/admin" />
  } else if (user.role === 'instructor' && (pathname === '/' || pathname === '/login')) {
    return <Redirect href="/(tabs)/(instructor)/home" />
  } else if (user.role === 'student' && (pathname === '/' || pathname === '/login')) {
    return <Redirect href="/(tabs)/(student)" />
  }

  return <>{children}</>
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 16,
  },
})
