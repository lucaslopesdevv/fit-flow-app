import React from "react"
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  AccessibilityInfo
} from "react-native"
import { IconButton, Menu, Divider } from "react-native-paper"
import { Card } from "@/components/common/Card"
import { ThemedText } from "@/components/ThemedText"
import { Avatar } from "@/components/common/Avatar"
import { WorkoutCardProps, WorkoutWithExercises, Workout } from "@/types/database"

interface WorkoutCardState {
  loading: boolean
  error: string | null
  menuVisible: boolean
}

export function WorkoutCard({
  workout,
  onPress,
  showStudent = false,
  showInstructor = false,
  onEdit,
  onDelete,
  onDuplicate,
}: WorkoutCardProps) {
  const [state, setState] = React.useState<WorkoutCardState>({
    loading: false,
    error: null,
    menuVisible: false
  })

  // Type guard to check if workout has exercises
  const workoutWithExercises = workout as WorkoutWithExercises
  const hasExercises = workoutWithExercises.exercises && Array.isArray(workoutWithExercises.exercises)
  const exercises = hasExercises ? workoutWithExercises.exercises : []

  const getWorkoutStatus = (workout: Workout) => {
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(workout.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysSinceCreated <= 1) return 'new'
    return 'pending'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#28a745'
      case 'completed': return '#6c757d'
      case 'in_progress': return '#ffc107'
      default: return '#007bff'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Novo'
      case 'completed': return 'Concluído'
      case 'in_progress': return 'Em andamento'
      default: return 'Pendente'
    }
  }

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const handleMenuToggle = () => {
    setState(prev => ({ ...prev, menuVisible: !prev.menuVisible }))
  }

  const handleMenuDismiss = () => {
    setState(prev => ({ ...prev, menuVisible: false }))
  }

  const handleEdit = () => {
    handleMenuDismiss()
    if (onEdit) {
      onEdit(workout)
    }
  }

  const handleDuplicate = () => {
    handleMenuDismiss()
    if (onDuplicate) {
      onDuplicate(workout)
    }
  }

  const handleDelete = () => {
    handleMenuDismiss()
    if (onDelete) {
      Alert.alert(
        'Excluir Treino',
        `Tem certeza que deseja excluir o treino "${workout.name}"? Esta ação não pode ser desfeita.`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: () => onDelete(workout),
          },
        ],
        { cancelable: true }
      )
    }
  }

  const handleCardPress = () => {
    if (state.loading) return
    
    // Announce to screen readers
    AccessibilityInfo.announceForAccessibility(
      `Abrindo detalhes do treino ${workout.name}`
    )
    
    onPress()
  }

  const status = getWorkoutStatus(workout)
  const statusColor = getStatusColor(status)
  const statusText = getStatusText(status)

  // Show actions menu for instructor view
  const showActions = onEdit || onDelete || onDuplicate

  return (
    <TouchableOpacity
      onPress={handleCardPress}
      disabled={state.loading}
      accessibilityLabel={`Treino ${workout.name}, ${exercises.length} exercícios`}
      accessibilityHint="Toque para ver detalhes do treino"
      accessibilityRole="button"
      style={[styles.touchable, state.loading && styles.touchableDisabled]}
    >
      <Card 
        style={[
          styles.workoutCard,
          state.loading && styles.cardLoading,
          state.error && styles.cardError
        ]} 
        variant="elevated" 
        padding="medium"
      >
        {state.error && (
          <View style={styles.errorBanner}>
            <ThemedText style={styles.errorText}>
              {state.error}
            </ThemedText>
          </View>
        )}

        <View style={styles.cardHeader}>
          <View style={styles.workoutInfo}>
            <ThemedText type="subtitle" style={styles.workoutName}>
              {workout.name}
            </ThemedText>
            
            {workout.description && (
              <ThemedText style={styles.workoutDescription} numberOfLines={2}>
                {workout.description}
              </ThemedText>
            )}

            <View style={styles.workoutMeta}>
              {/* Show instructor info for student view */}
              {showInstructor && workoutWithExercises.instructor && (
                <View style={styles.personInfo}>
                  <Avatar.Text
                    label={getInitials(workoutWithExercises.instructor.full_name)}
                    size="small"
                    style={styles.personAvatar}
                  />
                  <ThemedText style={styles.personName}>
                    Instrutor: {workoutWithExercises.instructor.full_name}
                  </ThemedText>
                </View>
              )}

              {/* Show student info for instructor view */}
              {showStudent && workoutWithExercises.student && (
                <View style={styles.personInfo}>
                  <Avatar.Text
                    label={getInitials(workoutWithExercises.student.full_name)}
                    size="small"
                    style={styles.personAvatar}
                  />
                  <ThemedText style={styles.personName}>
                    Aluno: {workoutWithExercises.student.full_name}
                  </ThemedText>
                </View>
              )}

              <View style={styles.workoutStats}>
                <ThemedText style={styles.statText}>
                  {exercises.length} {exercises.length === 1 ? 'exercício' : 'exercícios'}
                </ThemedText>
                <ThemedText style={styles.separator}>•</ThemedText>
                <ThemedText style={styles.statText}>
                  {formatDate(workout.created_at)}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.cardRight}>
            <View style={styles.topRow}>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <ThemedText style={styles.statusText}>
                  {statusText}
                </ThemedText>
              </View>

              {/* Actions menu for instructor */}
              {showActions && (
                <Menu
                  visible={state.menuVisible}
                  onDismiss={handleMenuDismiss}
                  anchor={
                    <IconButton
                      icon="dots-vertical"
                      size={20}
                      onPress={handleMenuToggle}
                      accessibilityLabel="Mais opções"
                      accessibilityHint="Abrir menu de ações do treino"
                      style={styles.menuButton}
                    />
                  }
                  contentStyle={styles.menuContent}
                >
                  {onEdit && (
                    <Menu.Item
                      onPress={handleEdit}
                      title="Editar"
                      leadingIcon="pencil"
                      titleStyle={styles.menuItemTitle}
                    />
                  )}
                  {onDuplicate && (
                    <Menu.Item
                      onPress={handleDuplicate}
                      title="Duplicar"
                      leadingIcon="content-copy"
                      titleStyle={styles.menuItemTitle}
                    />
                  )}
                  {(onEdit || onDuplicate) && onDelete && <Divider />}
                  {onDelete && (
                    <Menu.Item
                      onPress={handleDelete}
                      title="Excluir"
                      leadingIcon="delete"
                      titleStyle={[styles.menuItemTitle, styles.menuItemDanger]}
                    />
                  )}
                </Menu>
              )}
            </View>

            {/* Exercise preview thumbnails */}
            {exercises.length > 0 && (
              <View style={styles.exercisePreview}>
                {exercises.slice(0, 3).map((exerciseData, index) => (
                  <View key={exerciseData.exercise.id} style={styles.exerciseThumbnailContainer}>
                    {exerciseData.exercise.thumbnail_url ? (
                      <Image
                        source={{ uri: exerciseData.exercise.thumbnail_url }}
                        style={[
                          styles.exerciseThumbnail,
                          { zIndex: 3 - index, marginLeft: index * -8 }
                        ]}
                        resizeMode="cover"
                        accessibilityLabel={`Exercício ${exerciseData.exercise.name}`}
                      />
                    ) : (
                      <View style={[
                        styles.exercisePlaceholder,
                        { zIndex: 3 - index, marginLeft: index * -8 }
                      ]}>
                        <ThemedText style={styles.exercisePlaceholderText}>
                          {exerciseData.exercise.name.charAt(0).toUpperCase()}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                ))}
                
                {exercises.length > 3 && (
                  <View style={[styles.moreExercises, { marginLeft: 3 * -8 + 16 }]}>
                    <ThemedText style={styles.moreExercisesText}>
                      +{exercises.length - 3}
                    </ThemedText>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Loading overlay */}
        {state.loading && (
          <View style={styles.loadingOverlay}>
            <ThemedText style={styles.loadingText}>Carregando...</ThemedText>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  touchable: {
    marginBottom: 16,
  },
  touchableDisabled: {
    opacity: 0.6,
  },
  workoutCard: {
    position: 'relative',
  },
  cardLoading: {
    opacity: 0.8,
  },
  cardError: {
    borderColor: '#dc3545',
    borderWidth: 1,
  },
  errorBanner: {
    backgroundColor: '#f8d7da',
    padding: 8,
    marginBottom: 12,
    borderRadius: 4,
    borderColor: '#f5c6cb',
    borderWidth: 1,
  },
  errorText: {
    color: '#721c24',
    fontSize: 12,
    textAlign: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  workoutInfo: {
    flex: 1,
    marginRight: 12,
  },
  workoutName: {
    marginBottom: 4,
    fontSize: 18,
    fontWeight: '600',
  },
  workoutDescription: {
    color: '#6c757d',
    marginBottom: 12,
    lineHeight: 18,
  },
  workoutMeta: {
    gap: 8,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  personAvatar: {
    backgroundColor: '#2563eb',
  },
  personName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
  workoutStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 12,
    color: '#6c757d',
  },
  separator: {
    fontSize: 12,
    color: '#6c757d',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  menuButton: {
    margin: 0,
    width: 32,
    height: 32,
  },
  menuContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 4,
  },
  menuItemTitle: {
    fontSize: 14,
  },
  menuItemDanger: {
    color: '#dc3545',
  },
  exercisePreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseThumbnailContainer: {
    position: 'relative',
  },
  exerciseThumbnail: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  exercisePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exercisePlaceholderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6c757d',
  },
  moreExercises: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6c757d',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreExercisesText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  loadingText: {
    color: '#6c757d',
    fontSize: 14,
  },
})