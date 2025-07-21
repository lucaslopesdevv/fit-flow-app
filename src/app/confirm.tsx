import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Alert, TextInput } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/services/supabase/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button, Loading } from '@/components/common'

export default function ConfirmScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const { refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  useEffect(() => {
    const checkAuthAndParams = async () => {
      const type = params.type as string
      const email = params.email as string

      console.log('Confirm screen params:', params)

      // Check if user is already authenticated (from invite link)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        console.log('User is already authenticated from invite:', session.user)

        // User is authenticated, complete the setup
        try {
          await refreshUser()
          setSuccess(true)

          Alert.alert(
            'Welcome!',
            'Your invitation has been accepted successfully. You can now access your training program.',
            [
              {
                text: 'Continue',
                onPress: () => router.replace('/(tabs)/(student)'),
              },
            ]
          )
        } catch (err) {
          console.error('Error refreshing user:', err)
          setError('Error setting up your account. Please try logging in.')
        }
      } else if (type === 'invite') {
        // User not authenticated, show password form
        setShowPasswordForm(true)
        if (email) {
          setEmail(email)
        }
        setError(null)
      } else {
        setError('Invalid confirmation link. Please contact your instructor for a new invitation.')
      }
    }

    checkAuthAndParams()
  }, [params, refreshUser, router])

  const handlePasswordSetup = async () => {
    if (!email || !password) {
      setError('Please enter your email and password')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Try to sign up the user with the email and password
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
      })

      if (signUpError) {
        // If user already exists, try to sign in
        if (signUpError.message.includes('already registered')) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
          })

          if (signInError) {
            setError(signInError.message)
            return
          }
        } else {
          setError(signUpError.message)
          return
        }
      }

      // Refresh user data
      await refreshUser()
      setSuccess(true)

      Alert.alert(
        'Welcome!',
        'Your account has been set up successfully. You can now access your training program.',
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)/(student)'),
          },
        ]
      )
    } catch (err: any) {
      console.error('Password setup error:', err)
      setError(err.message || 'An error occurred during account setup')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <View style={styles.container}>
        <Text style={styles.successText}>Account setup completed successfully!</Text>
      </View>
    )
  }

  if (showPasswordForm) {
    const instructor = params.instructor as string

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Complete Your Account Setup</Text>
        <Text style={styles.subtitle}>
          {instructor
            ? `You've been invited by ${instructor} to join their training program.`
            : "You've been invited to join a training program."}{' '}
          Please set up your account:
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password (min 6 characters)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button
          title={loading ? 'Setting up...' : 'Complete Setup'}
          onPress={handlePasswordSetup}
          disabled={loading}
          style={styles.button}
        />

        <Button
          title="Back to Login"
          onPress={() => router.replace('/login')}
          style={[styles.button, styles.secondaryButton]}
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>{error || 'Invalid confirmation link'}</Text>
      <Button title="Go to Login" onPress={() => router.replace('/login')} style={styles.button} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    lineHeight: 22,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#333',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#ff0000',
    marginBottom: 20,
    marginTop: 10,
  },
  successText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#28a745',
    fontWeight: '600',
  },
  button: {
    marginTop: 15,
    width: '100%',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
})
