import React, { useState, useEffect } from 'react'
import {
  View,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { ThemedText } from '@/components/ThemedText'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { StudentService } from '@/services/api/StudentService'
import { Profile } from '@/types/database'

interface StudentDetailsModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
  student: Profile | null
}

export function StudentDetailsModal({
  visible,
  onClose,
  onSuccess,
  student,
}: StudentDetailsModalProps) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [errors, setErrors] = useState<{
    fullName?: string
    phone?: string
    general?: string
  }>({})

  useEffect(() => {
    if (student) {
      setFullName(student.full_name || '')
      setPhone(student.phone || '')
      // Assuming is_active is a field in the Profile type
      // If not present in the database yet, we'll need to add it
      setIsActive(student.is_active !== false) // Default to true if undefined
    }
  }, [student])

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true // Phone is optional
    // More flexible phone validation - allows various formats
    const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/
    return phoneRegex.test(phone.trim())
  }

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

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

  const handleSave = async () => {
    if (!student || !validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const updates: Partial<Profile> = {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        is_active: isActive,
      }

      await StudentService.updateStudent(student.id, updates)

      Alert.alert('Sucesso!', 'Informações do aluno atualizadas com sucesso.', [
        {
          text: 'OK',
          onPress: () => {
            setIsEditing(false)
            onSuccess()
          },
        },
      ])
    } catch (error: any) {
      console.error('Error updating student:', error)
      setErrors({ general: 'Erro ao atualizar informações. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async () => {
    if (!student) return

    const newActiveState = !isActive
    const action = newActiveState ? 'reativar' : 'desativar'

    Alert.alert(`Confirmar ${action}`, `Tem certeza que deseja ${action} este aluno?`, [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Confirmar',
        onPress: async () => {
          setLoading(true)
          try {
            await StudentService.updateStudent(student.id, { is_active: newActiveState })
            setIsActive(newActiveState)
            Alert.alert(
              'Sucesso!',
              `Aluno ${newActiveState ? 'reativado' : 'desativado'} com sucesso.`
            )
            onSuccess()
          } catch (error) {
            console.error(`Error ${action} student:`, error)
            Alert.alert('Erro', `Não foi possível ${action} o aluno. Tente novamente.`)
          } finally {
            setLoading(false)
          }
        },
      },
    ])
  }

  const handleClose = () => {
    if (!loading) {
      setIsEditing(false)
      onClose()
    }
  }

  if (!student) {
    return null
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
          <ThemedText style={styles.title}>Detalhes do Aluno</ThemedText>
          <Button title="Fechar" variant="text" onPress={handleClose} disabled={loading} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Student Info Section */}
          <View style={styles.infoSection}>
            <ThemedText style={styles.sectionTitle}>Informações Pessoais</ThemedText>

            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Email:</ThemedText>
              <ThemedText style={styles.infoValue}>{student.email}</ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Data de Cadastro:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {new Date(student.created_at).toLocaleDateString('pt-BR')}
              </ThemedText>
            </View>

            <View style={styles.statusContainer}>
              <ThemedText style={styles.infoLabel}>Status:</ThemedText>
              <View
                style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusInactive]}
              >
                <ThemedText style={styles.statusText}>{isActive ? 'Ativo' : 'Inativo'}</ThemedText>
              </View>
            </View>
          </View>

          {/* Edit Form Section */}
          {isEditing ? (
            <View style={styles.formSection}>
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

              <View style={styles.buttonContainer}>
                <Button
                  title="Cancelar"
                  variant="outlined"
                  onPress={() => {
                    setIsEditing(false)
                    // Reset form to original values
                    setFullName(student.full_name || '')
                    setPhone(student.phone || '')
                    setErrors({})
                  }}
                  disabled={loading}
                  style={styles.cancelButton}
                />
                <Button
                  title={loading ? 'Salvando...' : 'Salvar'}
                  onPress={handleSave}
                  disabled={loading}
                  style={styles.saveButton}
                />
              </View>
            </View>
          ) : (
            <View style={styles.viewSection}>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Nome:</ThemedText>
                <ThemedText style={styles.infoValue}>{student.full_name}</ThemedText>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Telefone:</ThemedText>
                <ThemedText style={styles.infoValue}>{student.phone || 'Não informado'}</ThemedText>
              </View>

              <Button
                title="Editar Informações"
                onPress={() => setIsEditing(true)}
                style={styles.editButton}
              />
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563eb" />
              <ThemedText style={styles.loadingText}>Processando...</ThemedText>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={isActive ? 'Desativar Aluno' : 'Reativar Aluno'}
            onPress={handleToggleActive}
            disabled={loading}
            variant="contained"
            style={[
              styles.actionButton,
              isActive ? { backgroundColor: '#ef4444' } : { backgroundColor: '#22c55e' },
            ]}
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
  infoSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 120,
    color: '#4b5563',
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusInactive: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#166534',
  },
  formSection: {
    marginBottom: 24,
  },
  viewSection: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
  editButton: {
    marginTop: 16,
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
  actionButton: {
    minHeight: 48,
  },
})
