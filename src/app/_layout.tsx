import { AuthProvider, useAuth } from '../hooks/useAuth'
import { Redirect, Slot, usePathname } from 'expo-router'
import React from 'react'
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'
import { PaperProvider, MD3LightTheme, Button } from 'react-native-paper'

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaperProvider theme={MD3LightTheme}>
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

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Carregando...</Text>
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
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Erro de Acesso</Text>
        <Text style={styles.errorMessage}>Função de usuário desconhecida: {user.role}</Text>
        <Text style={styles.errorSubtext}>Entre em contato com o administrador do sistema.</Text>
        <Button mode="contained" onPress={signOut} style={styles.errorButton}>
          Fazer Logout
        </Button>
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
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 16,
  },
})
