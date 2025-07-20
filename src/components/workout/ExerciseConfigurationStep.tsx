import React, { useState, useEffect, useCallback, useMemo, memo } from "react"
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native"
import { Card } from "../common/Card"
import { Input } from "../common/Input"
import { Button } from "../common/Button"
import { ThemedText } from "../ThemedText"
import { ThemedView } from "../ThemedView"
import { ExerciseConfigurationStepProps, WorkoutExerciseConfig } from "../../types/database"

interface ExerciseValidationState {
  [exerciseId: string]: {
    sets: boolean
    reps: boolean
    restSeconds: boolean
  }
}

interface ExerciseConfigurationErrors {
  [exerciseId: string]: {
    sets?: string
    reps?: string
    restSeconds?: string
  }
}

const ExerciseConfigurationStep = memo(({
  exercises,
  onExerciseUpdate,
  onValidationChange,
}: ExerciseConfigurationStepProps) => {
  const [validationState, setValidationState] = useState<ExerciseValidationState>({})
  const [errors, setErrors] = useState<ExerciseConfigurationErrors>({})
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)

  // Initialize validation state for all exercises
  useEffect(() => {
    const initialValidation: ExerciseValidationState = {}
    exercises.forEach(exercise => {
      initialValidation[exercise.exerciseId] = {
        sets: exercise.sets > 0,
        reps: exercise.reps.trim().length > 0,
        restSeconds: exercise.restSeconds >= 0,
      }
    })
    setValidationState(initialValidation)
  }, [exercises])

  // Check overall validation and notify parent
  useEffect(() => {
    const isValid = exercises.length > 0 && Object.values(validationState).every(
      validation => validation.sets && validation.reps && validation.restSeconds
    )
    onValidationChange(isValid)
  }, [validationState, exercises.length, onValidationChange])

  const validateField = useCallback((
    exerciseId: string,
    field: keyof ExerciseValidationState[string],
    value: string | number
  ): { isValid: boolean; error?: string } => {
    switch (field) {
      case 'sets':
        const setsNum = typeof value === 'string' ? parseInt(value) : value
        if (isNaN(setsNum) || setsNum < 1) {
          return { isValid: false, error: 'Séries deve ser um número maior que 0' }
        }
        if (setsNum > 20) {
          return { isValid: false, error: 'Máximo de 20 séries permitidas' }
        }
        return { isValid: true }

      case 'reps':
        const repsStr = typeof value === 'number' ? value.toString() : value
        if (!repsStr.trim()) {
          return { isValid: false, error: 'Repetições é obrigatório' }
        }
        if (repsStr.length > 20) {
          return { isValid: false, error: 'Máximo de 20 caracteres' }
        }
        return { isValid: true }

      case 'restSeconds':
        const restNum = typeof value === 'string' ? parseInt(value) : value
        if (isNaN(restNum) || restNum < 0) {
          return { isValid: false, error: 'Descanso deve ser um número maior ou igual a 0' }
        }
        if (restNum > 600) {
          return { isValid: false, error: 'Máximo de 10 minutos (600 segundos)' }
        }
        return { isValid: true }

      default:
        return { isValid: true }
    }
  }, [])

  const handleFieldChange = useCallback((
    exerciseId: string,
    field: keyof WorkoutExerciseConfig,
    value: string | number
  ) => {
    // Update the exercise configuration
    const updateData: Partial<WorkoutExerciseConfig> = { [field]: value }
    onExerciseUpdate(exerciseId, updateData)

    // Validate the field if it's a required field
    if (field === 'sets' || field === 'reps' || field === 'restSeconds') {
      const validation = validateField(exerciseId, field as keyof ExerciseValidationState[string], value)
      
      // Update validation state
      setValidationState(prev => ({
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          [field]: validation.isValid
        }
      }))

      // Update errors
      setErrors(prev => ({
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          [field]: validation.error
        }
      }))
    }
  }, [onExerciseUpdate, validateField])

  const handleReorderExercise = useCallback((exerciseId: string, direction: 'up' | 'down') => {
    const currentIndex = exercises.findIndex(ex => ex.exerciseId === exerciseId)
    if (currentIndex === -1) return

    const newExercises = [...exercises]
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (targetIndex < 0 || targetIndex >= newExercises.length) return

    // Swap exercises
    [newExercises[currentIndex], newExercises[targetIndex]] = 
    [newExercises[targetIndex], newExercises[currentIndex]]

    // Update order indices for all exercises
    newExercises.forEach((exercise, index) => {
      const updatedOrderIndex = index + 1
      if (exercise.orderIndex !== updatedOrderIndex) {
        onExerciseUpdate(exercise.exerciseId, { orderIndex: updatedOrderIndex })
      }
    })
  }, [exercises, onExerciseUpdate])

  const formatRestTime = useCallback((seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }, [])

  // Optimization functions for FlatList performance
  const keyExtractor = useCallback((item: WorkoutExerciseConfig) => item.exerciseId, [])
  
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: 200, // Approximate height when collapsed
    offset: 200 * index,
    index,
  }), [])

  const renderExerciseConfiguration = useCallback(({ item, index }: { item: WorkoutExerciseConfig, index: number }) => {
    const isExpanded = expandedExercise === item.exerciseId
    const exerciseErrors = errors[item.exerciseId] || {}
    const exerciseValidation = validationState[item.exerciseId] || { sets: false, reps: false, restSeconds: false }

    return (
      <Card style={styles.exerciseCard} variant="outlined">
        {/* Exercise Header */}
        <TouchableOpacity
          onPress={() => setExpandedExercise(isExpanded ? null : item.exerciseId)}
          style={styles.exerciseHeader}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`${isExpanded ? 'Recolher' : 'Expandir'} configuração do exercício ${item.exercise.name}`}
          accessibilityHint="Toque para expandir ou recolher as opções de configuração"
        >
          <View style={styles.exerciseHeaderContent}>
            {item.exercise.thumbnail_url && (
              <Image
                source={{ uri: item.exercise.thumbnail_url }}
                style={styles.exerciseThumbnail}
                accessibilityLabel={`Imagem do exercício ${item.exercise.name}`}
              />
            )}
            <View style={styles.exerciseInfo}>
              <ThemedText type="subtitle" style={styles.exerciseName}>
                {index + 1}. {item.exercise.name}
              </ThemedText>
              <ThemedText style={styles.muscleGroup}>
                {item.exercise.muscle_group}
              </ThemedText>
              
              {/* Quick Preview */}
              <View style={styles.quickPreview}>
                <ThemedText style={styles.previewText}>
                  {item.sets > 0 ? `${item.sets} séries` : 'Séries: -'}
                  {' • '}
                  {item.reps ? `${item.reps} reps` : 'Reps: -'}
                  {' • '}
                  {item.restSeconds >= 0 ? formatRestTime(item.restSeconds) : 'Descanso: -'}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.headerActions}>
              {/* Validation Indicator */}
              <View style={[
                styles.validationIndicator,
                (exerciseValidation.sets && exerciseValidation.reps && exerciseValidation.restSeconds) 
                  ? styles.validIndicator 
                  : styles.invalidIndicator
              ]}>
                <ThemedText style={[
                  styles.validationText,
                  (exerciseValidation.sets && exerciseValidation.reps && exerciseValidation.restSeconds) 
                    ? styles.validText 
                    : styles.invalidText
                ]}>
                  {(exerciseValidation.sets && exerciseValidation.reps && exerciseValidation.restSeconds) ? '✓' : '!'}
                </ThemedText>
              </View>
              
              {/* Expand/Collapse Icon */}
              <ThemedText style={styles.expandIcon}>
                {isExpanded ? '▼' : '▶'}
              </ThemedText>
            </View>
          </View>
        </TouchableOpacity>

        {/* Exercise Configuration Form */}
        {isExpanded && (
          <View style={styles.configurationForm}>
            {/* Reorder Buttons */}
            <View style={styles.reorderSection}>
              <ThemedText style={styles.sectionLabel}>Posição no Treino</ThemedText>
              <View style={styles.reorderButtons}>
                <Button
                  title="↑ Subir"
                  variant="outlined"
                  size="small"
                  onPress={() => handleReorderExercise(item.exerciseId, 'up')}
                  disabled={index === 0}
                  style={[styles.reorderButton, index === 0 && styles.disabledButton]}
                  accessibilityLabel={`Mover ${item.exercise.name} para cima na ordem`}
                  accessibilityHint="Move o exercício uma posição acima na lista do treino"
                />
                <Button
                  title="↓ Descer"
                  variant="outlined"
                  size="small"
                  onPress={() => handleReorderExercise(item.exerciseId, 'down')}
                  disabled={index === exercises.length - 1}
                  style={[styles.reorderButton, index === exercises.length - 1 && styles.disabledButton]}
                  accessibilityLabel={`Mover ${item.exercise.name} para baixo na ordem`}
                  accessibilityHint="Move o exercício uma posição abaixo na lista do treino"
                />
              </View>
            </View>

            {/* Configuration Fields */}
            <View style={styles.configFields}>
              <View style={styles.fieldRow}>
                <Input
                  label="Séries"
                  value={item.sets > 0 ? item.sets.toString() : ''}
                  onChangeText={(value) => handleFieldChange(item.exerciseId, 'sets', parseInt(value) || 0)}
                  keyboardType="numeric"
                  style={styles.setsInput}
                  errorMessage={exerciseErrors.sets}
                  required
                  accessibilityLabel={`Número de séries para ${item.exercise.name}`}
                  accessibilityHint="Digite o número de séries (1-20)"
                />
                
                <Input
                  label="Repetições"
                  value={item.reps}
                  onChangeText={(value) => handleFieldChange(item.exerciseId, 'reps', value)}
                  style={styles.repsInput}
                  errorMessage={exerciseErrors.reps}
                  placeholder="Ex: 10-12, 15, até falha"
                  required
                  accessibilityLabel={`Repetições para ${item.exercise.name}`}
                  accessibilityHint="Digite o número ou faixa de repetições"
                />
              </View>

              <Input
                label="Descanso (segundos)"
                value={item.restSeconds >= 0 ? item.restSeconds.toString() : ''}
                onChangeText={(value) => handleFieldChange(item.exerciseId, 'restSeconds', parseInt(value) || 0)}
                keyboardType="numeric"
                style={styles.restInput}
                errorMessage={exerciseErrors.restSeconds}
                helperText={item.restSeconds > 0 ? `Equivale a ${formatRestTime(item.restSeconds)}` : undefined}
                required
                accessibilityLabel={`Tempo de descanso para ${item.exercise.name}`}
                accessibilityHint="Digite o tempo de descanso em segundos (0-600)"
              />

              <Input
                label="Notas (opcional)"
                value={item.notes || ''}
                onChangeText={(value) => handleFieldChange(item.exerciseId, 'notes', value)}
                multiline
                numberOfLines={3}
                style={styles.notesInput}
                placeholder="Ex: Foco na contração, usar peso moderado..."
                accessibilityLabel={`Notas adicionais para ${item.exercise.name}`}
                accessibilityHint="Campo opcional para instruções específicas"
              />
            </View>

            {/* Configuration Preview */}
            <View style={styles.previewSection}>
              <ThemedText style={styles.sectionLabel}>Preview da Configuração</ThemedText>
              <Card style={styles.previewCard} variant="contained">
                <View style={styles.previewContent}>
                  <ThemedText style={styles.previewTitle}>{item.exercise.name}</ThemedText>
                  <View style={styles.previewDetails}>
                    <ThemedText style={styles.previewDetail}>
                      📊 {item.sets > 0 ? `${item.sets} séries` : 'Séries não definidas'}
                    </ThemedText>
                    <ThemedText style={styles.previewDetail}>
                      🔢 {item.reps ? `${item.reps} repetições` : 'Repetições não definidas'}
                    </ThemedText>
                    <ThemedText style={styles.previewDetail}>
                      ⏱️ {item.restSeconds >= 0 ? `${formatRestTime(item.restSeconds)} de descanso` : 'Descanso não definido'}
                    </ThemedText>
                    {item.notes && (
                      <ThemedText style={styles.previewDetail}>
                        📝 {item.notes}
                      </ThemedText>
                    )}
                  </View>
                </View>
              </Card>
            </View>
          </View>
        )}
      </Card>
    )
  }, [expandedExercise, errors, validationState, formatRestTime, exercises.length, handleReorderExercise, handleFieldChange])

  if (exercises.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyTitle}>Nenhum exercício selecionado</ThemedText>
          <ThemedText style={styles.emptyText}>
            Volte para a etapa anterior para selecionar exercícios para o treino.
          </ThemedText>
        </View>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Configurar Exercícios
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Configure séries, repetições e tempo de descanso para cada exercício
        </ThemedText>
        
        {/* Overall Progress */}
        <View style={styles.progressSection}>
          <ThemedText style={styles.progressText}>
            Progresso: {Object.values(validationState).filter(v => v.sets && v.reps && v.restSeconds).length} de {exercises.length} exercícios configurados
          </ThemedText>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${(Object.values(validationState).filter(v => v.sets && v.reps && v.restSeconds).length / exercises.length) * 100}%` 
                }
              ]} 
            />
          </View>
        </View>
      </View>

      <FlatList
        data={exercises}
        keyExtractor={keyExtractor}
        renderItem={renderExerciseConfiguration}
        style={styles.exerciseList}
        showsVerticalScrollIndicator={false}
        accessibilityLabel="Lista de exercícios para configuração"
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        initialNumToRender={5}
        windowSize={8}
      />
    </ThemedView>
  )
})

ExerciseConfigurationStep.displayName = 'ExerciseConfigurationStep'

export default ExerciseConfigurationStep

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 2,
  },
  exerciseList: {
    flex: 1,
  },
  exerciseCard: {
    marginBottom: 16,
    padding: 0,
  },
  exerciseHeader: {
    padding: 16,
  },
  exerciseHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    marginBottom: 4,
    fontWeight: '600',
  },
  muscleGroup: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  quickPreview: {
    marginTop: 4,
  },
  previewText: {
    fontSize: 12,
    opacity: 0.8,
    fontStyle: 'italic',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  validationIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  validIndicator: {
    backgroundColor: '#4caf50',
  },
  invalidIndicator: {
    backgroundColor: '#ff9800',
  },
  validationText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  validText: {
    color: 'white',
  },
  invalidText: {
    color: 'white',
  },
  expandIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
  configurationForm: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 16,
  },
  reorderSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  reorderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  reorderButton: {
    flex: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
  configFields: {
    marginBottom: 24,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  setsInput: {
    flex: 1,
  },
  repsInput: {
    flex: 2,
  },
  restInput: {
    marginBottom: 16,
  },
  notesInput: {
    marginBottom: 0,
  },
  previewSection: {
    marginTop: 8,
  },
  previewCard: {
    backgroundColor: '#f5f5f5',
  },
  previewContent: {
    padding: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewDetails: {
    gap: 6,
  },
  previewDetail: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
  },
})