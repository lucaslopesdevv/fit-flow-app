import React, { useState } from 'react'
import {
  View,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native'
import { ThemedText } from '@/components/ThemedText'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { StudentService, StudentInvitation } from '@/services/api/StudentService'
import { ActivityIndicator } from 'react-native'

interface InviteStudentModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

export function InviteStudentModal({ visible, onClose, onSuccess }: InviteStudentModalProps) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{
    email?: string
    fullName?: string
    phone?: string
    general?: string
  }>({})

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true // Phone is optional
    // More flexible phone validation - allows various formats
    const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/
    return phoneRegex.test(phone.trim())
  }

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!validateEmail(email.trim())) {
      newErrors.email = 'Email deve ter um formato válido'
    }

    if (!fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório'
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Nome deve ter pelo menos 2 caracteres'
    }

    if (phone.trim() && !validatePhone(phone.trim())) {
      newErrors.phone = 'Telefone deve ter um formato válido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const invitation: StudentInvitation = {
        email: email.trim(),
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
      }

      const result = await StudentService.inviteStudent(invitation)

      if (result.success) {
        Alert.alert(
          'Sucesso!',
          'Convite enviado com sucesso. O aluno receberá um email para criar sua conta.',
          [
            {
              text: 'OK',
              onPress: () => {
                resetForm()
                onSuccess()
                onClose()
              },
            },
          ]
        )
      } else {
        // Handle specific error cases
        let errorMessage = result.error || 'Erro ao enviar convite'

        if (result.error?.includes('already exists') || result.error?.includes('duplicate')) {
          errorMessage = 'Este email já está cadastrado no sistema'
        } else if (result.error?.includes('invalid email')) {
          errorMessage = 'Email inválido'
        } else if (result.error?.includes('network') || result.error?.includes('connection')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.'
        }

        setErrors({ general: errorMessage })
      }
    } catch (error: any) {
      console.error('Error inviting student:', error)
      setErrors({ general: 'Erro inesperado. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setFullName('')
    setPhone('')
    setErrors({})
  }

  const handleClose = () => {
    if (!loading) {
      resetForm()
      onClose()
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <ThemedText style={styles.title}>Convidar Aluno</ThemedText>
          <Button title="Cancelar" variant="text" onPress={handleClose} disabled={loading} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText style={styles.description}>
            Preencha os dados do aluno para enviar um convite por email.
          </ThemedText>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            errorMessage={errors.email}
            required
            style={styles.input}
            editable={!loading}
          />

          <Input
            label="Nome Completo"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoComplete="name"
            errorMessage={errors.fullName}
            required
            style={styles.input}
            editable={!loading}
          />

          <Input
            label="Telefone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            errorMessage={errors.phone}
            helperText="Opcional"
            style={styles.input}
            editable={!loading}
          />

          {errors.general && <ThemedText style={styles.errorText}>{errors.general}</ThemedText>}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563eb" />
              <ThemedText style={styles.loadingText}>Enviando convite...</ThemedText>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={loading ? 'Enviando...' : 'Enviar Convite'}
            onPress={handleSubmit}
            disabled={loading || !email.trim() || !fullName.trim()}
            style={styles.submitButton}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#6b7280',
    fontSize: 14,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    minHeight: 48,
  },
})
