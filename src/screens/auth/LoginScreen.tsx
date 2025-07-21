import React, { useState, useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { TextInput, Button, Text, useTheme, Dialog, Portal } from 'react-native-paper'
import { useAuth } from '../../hooks/useAuth'
import { useRouter } from 'expo-router'
import { useGlobalLoading } from '@/store/useGlobalLoading'
import { supabase } from '@/services/supabase/supabase'

const LoginScreen = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetMsg, setResetMsg] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [confirmationMsg, setConfirmationMsg] = useState('')

  const { signIn, user } = useAuth()
  const theme = useTheme()
  const router = useRouter()
  const { showLoading, hideLoading } = useGlobalLoading()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      // Detecta hash do Supabase após confirmação
      if (url.hash.includes('type=signup')) {
        setConfirmationMsg('Acesso confirmado! Agora você pode completar seu cadastro.')
      }
    }
  }, [])

  // Let AuthGate handle redirection

  const handleLogin = async () => {
    setError('')
    setSuccess('')
    showLoading('Entrando...')
    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Login realizado com sucesso!')
        // Wait a moment for the auth state to update, then let AuthGate handle routing
        setTimeout(() => {
          // The AuthGate will handle the redirect based on user role
        }, 1000)
      }
    } finally {
      hideLoading()
    }
  }

  const handleSendReset = async () => {
    setResetLoading(true)
    setResetMsg('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + '/reset-password',
      })
      if (error) throw error
      setResetMsg('E-mail enviado! Verifique sua caixa de entrada.')
    } catch (e: any) {
      setResetMsg(e.message || 'Erro ao enviar e-mail de redefinição.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.appName, { color: theme.colors.primary }]}>FitFlow</Text>
      <Text style={[styles.loginTitle, { color: theme.colors.primary }]}>Login</Text>
      {!!confirmationMsg && (
        <Text style={{ color: 'green', marginBottom: 12 }}>{confirmationMsg}</Text>
      )}
      <View style={styles.formCard}>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}
        <Button mode="contained" onPress={handleLogin} disabled={false} style={styles.button}>
          Sign in
        </Button>
        <Button mode="text" onPress={() => setResetDialogOpen(true)} style={{ marginTop: 8 }}>
          Resetar minha senha
        </Button>
        <Portal>
          <Dialog
            visible={resetDialogOpen}
            onDismiss={() => {
              setResetDialogOpen(false)
              setResetMsg('')
              setResetEmail('')
            }}
          >
            <Dialog.Title>Resetar senha</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="E-mail"
                value={resetEmail}
                onChangeText={setResetEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ marginBottom: 12 }}
              />
              {resetMsg ? (
                <Text
                  style={{
                    color: resetMsg.startsWith('E-mail enviado') ? '#388e3c' : '#d32f2f',
                    marginBottom: 8,
                  }}
                >
                  {resetMsg}
                </Text>
              ) : null}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setResetDialogOpen(false)}>Cancelar</Button>
              <Button
                onPress={handleSendReset}
                loading={resetLoading}
                disabled={!resetEmail || resetLoading}
              >
                Enviar
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  appName: {
    fontSize: 44,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1.2,
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 4,
  },
  error: {
    color: '#d32f2f',
    marginBottom: 8,
    textAlign: 'center',
  },
  success: {
    color: '#388e3c',
    marginBottom: 8,
    textAlign: 'center',
  },
})

export default LoginScreen
