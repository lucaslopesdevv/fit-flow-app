import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
import { Card } from '@/components/common/Card'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/context/ThemeContext'
import {
  CreateWorkoutModalProps,
  WorkoutFormState,
  WorkoutCreationStep,
  WorkoutExerciseConfig,
  Profile,
  WorkoutWithExercises,
} from '@/types/database'
import { WorkoutFormWrapper, useWorkoutOperations } from '../workout'
import {
  announceForAccessibility,
  getFieldAccessibilityProps,
  getButtonAccessibilityProps,
  getModalAccessibilityProps,
  getProgressAccessibilityProps,
  getListItemAccessibilityProps,
} from '@/utils/accessibility'
import * as Haptics from 'expo-haptics'

const INITIAL_FORM_STATE: WorkoutFormState = {
  name: '',
  description: '',
  studentId: '',
  selectedExercises: [],
  loading: false,
  error: null,
  currentStep: WorkoutCreationStep.BASIC_INFO,
}

export default function CreateWorkoutModal({
  visible,
  onClose,
  onSuccess,
  instructorStudents,
  editingWorkout = null,
}: CreateWorkoutModalProps) {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [formState, setFormState] = useState<WorkoutFormState>(INITIAL_FORM_STATE)
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null)

  // Create dynamic styles based on theme
  const styles = useMemo(() => createStyles(theme), [theme])

  const {
    createWorkout,
    updateWorkout,
    loading: operationLoading,
    error: operationError,
    getPersistedFormData,
    clearPersistedFormData,
    retry,
    clearError,
  } = useWorkoutOperations({
    persistFormData: true,
    formStorageKey: 'create_workout_form',
  })

  const loadPersistedFormData = useCallback(async () => {
    try {
      const persistedData = await getPersistedFormData()
      if (persistedData) {
        setFormState(prev => ({
          ...prev,
          ...persistedData,
          loading: false,
          error: null,
        }))
      } else {
        setFormState(INITIAL_FORM_STATE)
      }
    } catch (error) {
      console.warn('Failed to load persisted form data:', error)
      setFormState(INITIAL_FORM_STATE)
    }
  }, [getPersistedFormData])

  // Reset form when modal opens/closes or populate with editing data
  useEffect(() => {
    if (visible) {
      if (editingWorkout) {
        // Populate form with existing workout data
        const exerciseConfigs: WorkoutExerciseConfig[] = editingWorkout.exercises.map(we => ({
          exerciseId: we.exercise_id,
          exercise: we.exercise,
          sets: we.sets,
          reps: we.reps,
          restSeconds: we.rest_seconds,
          orderIndex: we.order_index,
          notes: we.notes || '',
        }))

        setFormState({
          name: editingWorkout.name,
          description: editingWorkout.description || '',
          studentId: editingWorkout.student_id,
          selectedExercises: exerciseConfigs,
          loading: false,
          error: null,
          currentStep: WorkoutCreationStep.BASIC_INFO,
        })
      } else {
        // Try to restore persisted form data
        loadPersistedFormData()
      }
      setSelectedStudent(null)
    }
  }, [visible, editingWorkout, loadPersistedFormData])

  // Update selected student when studentId changes
  useEffect(() => {
    if (formState.studentId) {
      const student = instructorStudents.find(s => s.id === formState.studentId)
      setSelectedStudent(student || null)
    } else {
      setSelectedStudent(null)
    }
  }, [formState.studentId, instructorStudents])

  const updateFormState = (updates: Partial<WorkoutFormState>) => {
    setFormState(prev => {
      const newState = { ...prev, ...updates }

      // Persist form data when it changes (but not loading/error states)
      if (
        !editingWorkout &&
        (updates.name || updates.description || updates.studentId || updates.selectedExercises)
      ) {
        // Don't await this to avoid blocking UI
        getPersistedFormData()
          .then(() => {
            // Only persist if we're not in an error state
            if (!newState.error) {
              // This would be handled by the hook's internal persistence
            }
          })
          .catch(console.warn)
      }

      return newState
    })
  }

  const handleStudentSelect = (studentId: string) => {
    updateFormState({ studentId })
    // Provide haptic feedback for selection
    Haptics.selectionAsync()
  }

  const validateCurrentStep = (): boolean => {
    switch (formState.currentStep) {
      case WorkoutCreationStep.BASIC_INFO:
        return !!(formState.name.trim() && formState.studentId)

      case WorkoutCreationStep.EXERCISE_SELECTION:
        return formState.selectedExercises.length > 0

      case WorkoutCreationStep.EXERCISE_CONFIGURATION:
        return formState.selectedExercises.every(
          ex => ex.sets > 0 && ex.reps.trim() && ex.restSeconds >= 0
        )

      default:
        return true
    }
  }

  const handleNextStep = () => {
    if (!validateCurrentStep()) {
      const errorMessage = 'Por favor, preencha todos os campos obrigatórios.'
      updateFormState({
        error: errorMessage,
      })
      announceForAccessibility(errorMessage)
      // Provide error haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }

    const steps = Object.values(WorkoutCreationStep)
    const currentIndex = steps.indexOf(formState.currentStep)

    if (currentIndex < steps.length - 1) {
      const stepNames = ['Informações', 'Exercícios', 'Configuração', 'Revisão']
      const nextStepName = stepNames[currentIndex + 1]

      updateFormState({
        currentStep: steps[currentIndex + 1],
        error: null,
      })

      announceForAccessibility(`Avançou para: ${nextStepName}`)
      // Provide haptic feedback for step progression
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }

  const handlePreviousStep = () => {
    const steps = Object.values(WorkoutCreationStep)
    const currentIndex = steps.indexOf(formState.currentStep)

    if (currentIndex > 0) {
      updateFormState({
        currentStep: steps[currentIndex - 1],
        error: null,
      })
    }
  }

  const handleSaveWorkout = async () => {
    if (!user || !validateCurrentStep()) {
      updateFormState({
        error: 'Por favor, verifique todos os campos antes de salvar.',
      })
      return
    }

    clearError()
    updateFormState({ loading: true, error: null })

    try {
      const workoutData = {
        name: formState.name.trim(),
        description: formState.description.trim() || undefined,
        studentId: formState.studentId,
        exercises: formState.selectedExercises.map(ex => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          reps: ex.reps.trim(),
          restSeconds: ex.restSeconds,
          orderIndex: ex.orderIndex,
          notes: ex.notes?.trim() || undefined,
        })),
      }

      let savedWorkout: WorkoutWithExercises

      if (editingWorkout) {
        // Update existing workout
        savedWorkout = await updateWorkout(editingWorkout.id, user.id, {
          name: workoutData.name,
          description: workoutData.description,
          exercises: workoutData.exercises,
        })
      } else {
        // Create new workout
        savedWorkout = await createWorkout(user.id, workoutData)
      }

      updateFormState({ loading: false })
      await clearPersistedFormData()
      // Provide success haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onSuccess(savedWorkout)
      onClose()
    } catch (error) {
      updateFormState({ loading: false })
      // Error is handled by the hook and displayed by WorkoutFormWrapper
    }
  }

  const handleRetry = () => {
    retry()
    handleSaveWorkout()
  }

  const handleClose = () => {
    if (formState.loading) return

    // Check if there's unsaved data
    const hasUnsavedData =
      formState.name.trim() ||
      formState.description.trim() ||
      formState.studentId ||
      formState.selectedExercises.length > 0

    if (hasUnsavedData) {
      Alert.alert(
        'Descartar alterações?',
        'Você tem alterações não salvas. Deseja realmente sair?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: onClose,
          },
        ]
      )
    } else {
      onClose()
    }
  }

  const renderStepIndicator = () => {
    const steps = Object.values(WorkoutCreationStep)
    const currentIndex = steps.indexOf(formState.currentStep)
    const stepNames = ['Informações', 'Exercícios', 'Configuração', 'Revisão']

    return (
      <View
        style={styles.stepIndicator}
        {...getProgressAccessibilityProps(
          currentIndex + 1,
          steps.length,
          `Etapa ${stepNames[currentIndex]}`
        )}
      >
        {steps.map((step, index) => (
          <View key={step} style={styles.stepIndicatorItem}>
            <View
              style={[styles.stepCircle, index <= currentIndex && styles.stepCircleActive]}
              accessible={true}
              accessibilityLabel={`Etapa ${index + 1}: ${stepNames[index]}${index === currentIndex ? ' (atual)' : index < currentIndex ? ' (concluída)' : ' (pendente)'}`}
            >
              <ThemedText
                style={[styles.stepNumber, index <= currentIndex && styles.stepNumberActive]}
                accessibilityElementsHidden={true}
                importantForAccessibility="no"
              >
                {index + 1}
              </ThemedText>
            </View>
            {index < steps.length - 1 && (
              <View style={[styles.stepLine, index < currentIndex && styles.stepLineActive]} />
            )}
          </View>
        ))}
      </View>
    )
  }

  const renderBasicInfoStep = () => (
    <View style={styles.stepContent}>
      <ThemedText type="subtitle" style={styles.stepTitle}>
        Informações Básicas
      </ThemedText>
      <Input
        label="Nome do Treino"
        value={formState.name}
        onChangeText={name => updateFormState({ name })}
        placeholder="Ex: Treino de Peito e Tríceps"
        style={styles.input}
        required={true}
        accessibilityLabel="Nome do treino"
        accessibilityHint="Insira o nome do treino"
      />
      <Input
        label="Descrição (opcional)"
        value={formState.description}
        onChangeText={description => updateFormState({ description })}
        placeholder="Descreva o objetivo do treino..."
        multiline
        numberOfLines={3}
        style={styles.input}
        accessibilityLabel="Descrição do treino"
        accessibilityHint="Insira uma descrição opcional para o treino"
      />

      <ThemedText style={styles.label}>Aluno *</ThemedText>
      <ScrollView
        style={styles.studentList}
        showsVerticalScrollIndicator={false}
        accessible={true}
        accessibilityLabel="Lista de alunos"
        accessibilityHint="Selecione um aluno para criar o treino"
      >
        {instructorStudents.map((student, index) => (
          <Card
            key={student.id}
            style={[
              styles.studentCard,
              formState.studentId === student.id && styles.studentCardSelected,
            ]}
            onPress={() => handleStudentSelect(student.id)}
            {...getListItemAccessibilityProps(
              student.full_name,
              index + 1,
              instructorStudents.length,
              formState.studentId === student.id
            )}
          >
            <View style={styles.studentInfo}>
              <ThemedText type="subtitle">{student.full_name}</ThemedText>
              <ThemedText type="default" style={styles.studentEmail}>
                {student.email}
              </ThemedText>
            </View>
            {formState.studentId === student.id && <View style={styles.selectedIndicator} />}
          </Card>
        ))}
      </ScrollView>

      {instructorStudents.length === 0 && (
        <Card style={styles.emptyState}>
          <ThemedText style={styles.emptyStateText}>
            Você ainda não tem alunos cadastrados.
          </ThemedText>
          <ThemedText style={styles.emptyStateSubtext}>
            Cadastre alunos primeiro para criar treinos.
          </ThemedText>
        </Card>
      )}
    </View>
  )

  const renderCurrentStep = () => {
    switch (formState.currentStep) {
      case WorkoutCreationStep.BASIC_INFO:
        return renderBasicInfoStep()

      case WorkoutCreationStep.EXERCISE_SELECTION:
        // This will be implemented in the next task
        return (
          <View style={styles.stepContent}>
            <ThemedText type="subtitle" style={styles.stepTitle}>
              Seleção de Exercícios
            </ThemedText>
            <ThemedText>Em desenvolvimento...</ThemedText>
          </View>
        )

      case WorkoutCreationStep.EXERCISE_CONFIGURATION:
        // This will be implemented in task 5
        return (
          <View style={styles.stepContent}>
            <ThemedText type="subtitle" style={styles.stepTitle}>
              Configuração dos Exercícios
            </ThemedText>
            <ThemedText>Em desenvolvimento...</ThemedText>
          </View>
        )

      case WorkoutCreationStep.PREVIEW:
        return (
          <View style={styles.stepContent}>
            <ThemedText type="subtitle" style={styles.stepTitle}>
              Revisão do Treino
            </ThemedText>

            <Card style={styles.previewCard}>
              <ThemedText type="subtitle">{formState.name}</ThemedText>
              {formState.description && (
                <ThemedText style={styles.previewDescription}>{formState.description}</ThemedText>
              )}
              <ThemedText style={styles.previewStudent}>
                Aluno: {selectedStudent?.full_name}
              </ThemedText>
              <ThemedText style={styles.previewExercises}>
                {formState.selectedExercises.length} exercício(s)
              </ThemedText>
            </Card>
          </View>
        )

      default:
        return null
    }
  }

  const getStepTitle = () => {
    const prefix = editingWorkout ? 'Editar Treino' : 'Novo Treino'
    switch (formState.currentStep) {
      case WorkoutCreationStep.BASIC_INFO:
        return `${prefix} - Informações`
      case WorkoutCreationStep.EXERCISE_SELECTION:
        return `${prefix} - Exercícios`
      case WorkoutCreationStep.EXERCISE_CONFIGURATION:
        return `${prefix} - Configuração`
      case WorkoutCreationStep.PREVIEW:
        return `${prefix} - Revisão`
      default:
        return prefix
    }
  }

  const isFirstStep = formState.currentStep === WorkoutCreationStep.BASIC_INFO
  const isLastStep = formState.currentStep === WorkoutCreationStep.PREVIEW
  const canProceed = validateCurrentStep()

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      {...getModalAccessibilityProps(
        editingWorkout ? 'Editar treino' : 'Criar novo treino',
        'Modal para criação e edição de treinos'
      )}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <Button
            title="Cancelar"
            variant="text"
            onPress={handleClose}
            disabled={operationLoading}
            accessibilityLabel="Cancelar criação de treino"
          />
          <ThemedText type="subtitle" style={styles.headerTitle}>
            {getStepTitle()}
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        <WorkoutFormWrapper
          saving={operationLoading}
          error={operationError}
          onRetry={handleRetry}
          onErrorDismiss={clearError}
        >
          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {renderCurrentStep()}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {!isFirstStep && (
              <Button
                title="Voltar"
                variant="outlined"
                onPress={handlePreviousStep}
                disabled={operationLoading}
                style={styles.footerButton}
                {...getButtonAccessibilityProps(
                  'Voltar para etapa anterior',
                  false,
                  operationLoading
                )}
              />
            )}

            <Button
              title={isLastStep ? (editingWorkout ? 'Salvar Treino' : 'Criar Treino') : 'Próximo'}
              variant="contained"
              onPress={isLastStep ? handleSaveWorkout : handleNextStep}
              disabled={!canProceed || operationLoading}
              style={[styles.footerButton, styles.primaryButton]}
              {...getButtonAccessibilityProps(
                isLastStep ? (editingWorkout ? 'Salvar treino' : 'Criar treino') : 'Próxima etapa',
                operationLoading,
                !canProceed || operationLoading
              )}
            />
          </View>
        </WorkoutFormWrapper>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 80, // Same width as cancel button
    },
    stepIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      backgroundColor: theme.colors.surface,
    },
    stepIndicatorItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    stepCircle: {
      width: 44, // Increased for better touch target
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepCircleActive: {
      backgroundColor: theme.colors.primary,
    },
    stepNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    stepNumberActive: {
      color: theme.colors.onPrimary,
    },
    stepLine: {
      width: 40,
      height: 2,
      backgroundColor: theme.colors.surfaceVariant,
      marginHorizontal: 8,
    },
    stepLineActive: {
      backgroundColor: theme.colors.primary,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 32,
    },
    stepContent: {
      flex: 1,
    },
    stepTitle: {
      marginBottom: 20,
      textAlign: 'center',
    },
    input: {
      marginBottom: 16,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      color: theme.colors.onSurface,
    },
    studentList: {
      maxHeight: 200,
      marginBottom: 16,
    },
    studentCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      marginBottom: 8,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    studentCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
    },
    studentInfo: {
      flex: 1,
    },
    studentEmail: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    selectedIndicator: {
      width: 24, // Increased for better visibility
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
    },
    emptyState: {
      padding: 24,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 8,
    },
    emptyStateSubtext: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    previewCard: {
      padding: 20,
    },
    previewDescription: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
      marginBottom: 12,
    },
    previewStudent: {
      fontWeight: '600',
      marginBottom: 4,
    },
    previewExercises: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    errorCard: {
      backgroundColor: '#fee',
      borderColor: '#dc3545',
      borderWidth: 1,
      marginTop: 16,
    },
    errorText: {
      color: '#dc3545',
      textAlign: 'center',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    footerButton: {
      flex: 1,
      marginHorizontal: 8,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
    },
    loadingContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginLeft: 12,
      color: theme.colors.onSurfaceVariant,
    },
  })
