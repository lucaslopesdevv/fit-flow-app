import { useState, useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { TextInput, Button as PaperButton, Text, Dialog, Portal } from 'react-native-paper'
import { useTheme } from '@/context/ThemeContext'
import { Button } from '@/components/common/Button'
import { useAuth } from '../../hooks/useAuth'
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

  const { signIn } = useAuth()
  const { theme } = useTheme()
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.appName, { color: theme.colors.primary }]}>FitFlow</Text>
      <Text style={[styles.loginTitle, { color: theme.colors.primary }]}>Login</Text>
      {!!confirmationMsg && (
        <Text style={{ color: theme.dark ? '#4CAF50' : 'green', marginBottom: 12 }}>
          {confirmationMsg}
        </Text>
      )}
      <View
        style={[
          styles.formCard,
          {
            backgroundColor: theme.colors.surface,
            shadowColor: theme.dark ? 'rgba(0,0,0,0)' : '#000',
          },
        ]}
      >
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.input, { backgroundColor: theme.colors.surface }]}
          textColor={theme.colors.onSurface}
          theme={theme}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={[styles.input, { backgroundColor: theme.colors.surface }]}
          textColor={theme.colors.onSurface}
          theme={theme}
        />
        {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
        {success ? (
          <Text style={[styles.success, { color: theme.dark ? '#4CAF50' : '#388e3c' }]}>
            {success}
          </Text>
        ) : null}
        <Button
          title="Sign in"
          variant="contained"
          onPress={handleLogin}
          disabled={false}
          style={styles.button}
        />
        <Button
          title="Resetar minha senha"
          variant="text"
          onPress={() => setResetDialogOpen(true)}
          style={{ marginTop: 8 }}
        />
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
                textColor={theme.colors.onSurface}
                theme={theme}
              />
              {resetMsg ? (
                <Text
                  style={{
                    color: resetMsg.startsWith('E-mail enviado')
                      ? theme.dark
                        ? '#4CAF50'
                        : '#388e3c'
                      : theme.colors.error,
                    marginBottom: 8,
                  }}
                >
                  {resetMsg}
                </Text>
              ) : null}
            </Dialog.Content>
            <Dialog.Actions>
              <PaperButton onPress={() => setResetDialogOpen(false)}>Cancelar</PaperButton>
              <PaperButton
                onPress={handleSendReset}
                loading={resetLoading}
                disabled={!resetEmail || resetLoading}
              >
                Enviar
              </PaperButton>
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
    borderRadius: 16,
    padding: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    marginBottom: 16,
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
