import React, { useState, useEffect } from 'react'
import { View, Modal, ScrollView, StyleSheet, Image } from 'react-native'
import { ThemedText } from '@/components/ThemedText'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Avatar } from '@/components/common/Avatar'
import { WorkoutDetailsModalProps } from '@/types/database'
import { WorkoutOperationWrapper } from '../workout/WorkoutOperationWrapper'
import { WorkoutDetailsLoading } from '../workout/WorkoutLoadingStates'
import { useWorkoutOperations } from '@/hooks/useWorkoutOperations'
import { useTheme } from '@/context/ThemeContext'

export default function WorkoutDetailsModal({
  visible,
  workout: initialWorkout,
  workoutId,
  onClose,
  onStartWorkout,
}: WorkoutDetailsModalProps) {
  const { theme } = useTheme()
  const [workout, setWorkout] = useState(initialWorkout)
  const { getWorkoutDetails, loading, error, retry, clearError } = useWorkoutOperations()

  // Create dynamic styles based on theme
  const styles = React.useMemo(() => createStyles(theme), [theme])

  useEffect(() => {
    if (visible && workoutId && !initialWorkout) {
      loadWorkoutDetails()
    }
  }, [visible, workoutId, initialWorkout])

  const loadWorkoutDetails = async () => {
    try {
      const details = await getWorkoutDetails(workoutId!)
      setWorkout(details)
    } catch (err) {
      // Error is handled by the hook
    }
  }

  const handleRetry = () => {
    clearError()
    loadWorkoutDetails()
  }

  if (!visible) {
    return null
  }

  if (!workout && !loading && !error) {
    return null
  }

  const formatRestTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const renderExerciseItem = (exerciseData: any, index: number) => {
    const { exercise, sets, reps, rest_seconds, notes } = exerciseData

    return (
      <Card
        key={`${exercise.id}-${index}`}
        style={styles.exerciseCard}
        variant="outlined"
        padding="medium"
        accessible={true}
        accessibilityLabel={`Exercício ${index + 1}: ${exercise.name}`}
        accessibilityHint={`${sets} séries de ${reps} repetições, ${formatRestTime(rest_seconds)} de descanso${notes ? '. Observações: ' + notes : ''}`}
        accessibilityRole="summary"
      >
        <View style={styles.exerciseHeader}>
          <View style={styles.exerciseImageContainer}>
            {exercise.thumbnail_url ? (
              <Image
                source={{ uri: exercise.thumbnail_url }}
                style={styles.exerciseThumbnail}
                resizeMode="cover"
                accessible={true}
                accessibilityLabel={`Imagem demonstrativa do exercício ${exercise.name}`}
                accessibilityRole="image"
              />
            ) : (
              <View
                style={styles.exercisePlaceholder}
                accessible={true}
                accessibilityLabel={`Ícone do exercício ${exercise.name}`}
                accessibilityRole="image"
              >
                <ThemedText
                  style={styles.exercisePlaceholderText}
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no"
                >
                  {exercise.name.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
            )}
          </View>

          <View style={styles.exerciseInfo}>
            <ThemedText type="subtitle" style={styles.exerciseName}>
              {exercise.name}
            </ThemedText>
            <ThemedText style={styles.exerciseMuscleGroup}>{exercise.muscle_group}</ThemedText>
          </View>

          <View
            style={styles.exerciseOrder}
            accessible={true}
            accessibilityLabel={`Exercício número ${index + 1}`}
            accessibilityRole="text"
          >
            <ThemedText
              style={styles.exerciseOrderText}
              accessibilityElementsHidden={true}
              importantForAccessibility="no"
            >
              {index + 1}
            </ThemedText>
          </View>
        </View>

        <View style={styles.exerciseConfig}>
          <View style={styles.configRow}>
            <View style={styles.configItem}>
              <ThemedText style={styles.configLabel}>Séries</ThemedText>
              <ThemedText style={styles.configValue}>{sets}</ThemedText>
            </View>

            <View style={styles.configItem}>
              <ThemedText style={styles.configLabel}>Repetições</ThemedText>
              <ThemedText style={styles.configValue}>{reps}</ThemedText>
            </View>

            <View style={styles.configItem}>
              <ThemedText style={styles.configLabel}>Descanso</ThemedText>
              <ThemedText style={styles.configValue}>{formatRestTime(rest_seconds)}</ThemedText>
            </View>
          </View>

          {notes && (
            <View style={styles.notesContainer}>
              <ThemedText style={styles.notesLabel}>Observações:</ThemedText>
              <ThemedText style={styles.notesText}>{notes}</ThemedText>
            </View>
          )}
        </View>
      </Card>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      accessible={true}
      accessibilityViewIsModal={true}
      accessibilityLabel="Detalhes do treino"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Button
            title="Fechar"
            variant="text"
            onPress={onClose}
            accessibilityLabel="Fechar detalhes do treino"
          />
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Detalhes do Treino
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <WorkoutOperationWrapper
          loading={loading}
          error={error}
          onRetry={handleRetry}
          loadingMessage="Carregando detalhes do treino..."
          fallbackMessage="Não foi possível carregar os detalhes do treino."
        >
          {workout && (
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Workout Info */}
              <Card style={styles.workoutInfoCard} variant="elevated" padding="large">
                <ThemedText type="title" style={styles.workoutName}>
                  {workout.name}
                </ThemedText>

                {workout.description && (
                  <ThemedText style={styles.workoutDescription}>{workout.description}</ThemedText>
                )}

                <View style={styles.workoutMeta}>
                  {/* Instructor Info */}
                  {workout.instructor && (
                    <View style={styles.metaRow}>
                      <Avatar.Text
                        label={getInitials(workout.instructor.full_name)}
                        size="small"
                        style={styles.avatar}
                      />
                      <View style={styles.metaInfo}>
                        <ThemedText style={styles.metaLabel}>Instrutor</ThemedText>
                        <ThemedText style={styles.metaValue}>
                          {workout.instructor.full_name}
                        </ThemedText>
                      </View>
                    </View>
                  )}

                  {/* Student Info (for instructor view) */}
                  {workout.student && (
                    <View style={styles.metaRow}>
                      <Avatar.Text
                        label={getInitials(workout.student.full_name)}
                        size="small"
                        style={styles.avatar}
                      />
                      <View style={styles.metaInfo}>
                        <ThemedText style={styles.metaLabel}>Aluno</ThemedText>
                        <ThemedText style={styles.metaValue}>
                          {workout.student.full_name}
                        </ThemedText>
                      </View>
                    </View>
                  )}

                  {/* Workout Stats */}
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <ThemedText style={styles.statValue}>{workout.exercises.length}</ThemedText>
                      <ThemedText style={styles.statLabel}>
                        {workout.exercises.length === 1 ? 'Exercício' : 'Exercícios'}
                      </ThemedText>
                    </View>

                    <View style={styles.statItem}>
                      <ThemedText style={styles.statValue}>
                        {workout.exercises.reduce((total, ex) => total + ex.sets, 0)}
                      </ThemedText>
                      <ThemedText style={styles.statLabel}>Séries Totais</ThemedText>
                    </View>

                    <View style={styles.statItem}>
                      <ThemedText style={styles.statValue}>
                        {formatRestTime(
                          Math.round(
                            workout.exercises.reduce((total, ex) => total + ex.rest_seconds, 0) /
                              workout.exercises.length
                          )
                        )}
                      </ThemedText>
                      <ThemedText style={styles.statLabel}>Descanso Médio</ThemedText>
                    </View>
                  </View>
                </View>
              </Card>

              {/* Exercises List */}
              <View style={styles.exercisesSection}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Exercícios ({workout.exercises.length})
                </ThemedText>

                {workout.exercises.length > 0 ? (
                  workout.exercises.map((exerciseData, index) =>
                    renderExerciseItem(exerciseData, index)
                  )
                ) : (
                  <Card style={styles.emptyState} variant="outlined" padding="large">
                    <ThemedText style={styles.emptyStateText}>
                      Nenhum exercício encontrado neste treino.
                    </ThemedText>
                  </Card>
                )}
              </View>
            </ScrollView>
          )}
        </WorkoutOperationWrapper>

        {/* Footer with Start Workout Button */}
        {onStartWorkout && workout && !loading && !error && (
          <View style={styles.footer}>
            <Button
              title="Iniciar Treino"
              variant="contained"
              onPress={onStartWorkout}
              style={styles.startButton}
              fullWidth
              accessibilityLabel="Iniciar execução do treino"
            />
          </View>
        )}
      </View>
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
      width: 80, // Same width as close button
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 32,
    },
    workoutInfoCard: {
      marginBottom: 24,
    },
    workoutName: {
      marginBottom: 8,
      textAlign: 'center',
    },
    workoutDescription: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 20,
    },
    workoutMeta: {
      gap: 16,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      backgroundColor: theme.colors.primary,
    },
    metaInfo: {
      flex: 1,
    },
    metaLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    metaValue: {
      fontSize: 16,
      fontWeight: '600',
      marginTop: 2,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
      textAlign: 'center',
    },
    exercisesSection: {
      flex: 1,
    },
    sectionTitle: {
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    exerciseCard: {
      marginBottom: 12,
    },
    exerciseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    exerciseImageContainer: {
      marginRight: 12,
    },
    exerciseThumbnail: {
      width: 60,
      height: 60,
      borderRadius: 8,
      backgroundColor: theme.colors.surfaceVariant,
    },
    exercisePlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 8,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    exercisePlaceholderText: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.onSurfaceVariant,
    },
    exerciseInfo: {
      flex: 1,
    },
    exerciseName: {
      marginBottom: 4,
    },
    exerciseMuscleGroup: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textTransform: 'capitalize',
    },
    exerciseOrder: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    exerciseOrderText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    exerciseConfig: {
      gap: 12,
    },
    configRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
    },
    configItem: {
      alignItems: 'center',
      flex: 1,
    },
    configLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      fontWeight: '600',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    configValue: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    notesContainer: {
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    notesLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      fontWeight: '600',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    notesText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      lineHeight: 20,
      fontStyle: 'italic',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyStateText: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      fontSize: 16,
    },
    footer: {
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    startButton: {
      minHeight: 48,
      backgroundColor: '#28a745',
    },
  })
