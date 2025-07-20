import React, { useEffect, useState, useCallback, useMemo, memo } from "react"
import { 
  View, 
  FlatList, 
  StyleSheet, 
  RefreshControl, 
  TouchableOpacity,
  Dimensions
} from "react-native"
import { useAuth } from "@/hooks/useAuth"
import { WorkoutWithExercises, WorkoutListState } from "@/types/database"
import { Card } from "@/components/common/Card"
import { ThemedText } from "@/components/ThemedText"
import { Loading } from "@/components/common/Loading"
import { Avatar } from "@/components/common/Avatar"
import LazyImage, { ImagePlaceholder } from "@/components/common/LazyImage"
import WorkoutDetailsModal from "@/components/modals/WorkoutDetailsModal"
import { WorkoutListWrapper } from "@/components/workout/WorkoutOperationWrapper"
import { useWorkoutOperations } from "@/hooks/useWorkoutOperations"
import { workoutCache, cacheUtils } from "@/utils/cache"
import { getOptimalBatchSize } from "@/utils/virtualScrolling"

const WorkoutListScreen = memo(() => {
  const { user, loading: loadingAuth } = useAuth()
  const [state, setState] = useState<WorkoutListState>({
    workouts: [],
    loading: false,
    error: null,
    refreshing: false,
    selectedWorkout: null,
    showDetails: false
  })

  const { 
    getStudentWorkouts, 
    loading: operationLoading, 
    error: operationError, 
    retry, 
    clearError 
  } = useWorkoutOperations()

  const fetchWorkouts = useCallback(async (isRefresh = false) => {
    if (!user || user.role !== "student") return
    
    setState(prev => ({ 
      ...prev, 
      refreshing: isRefresh
    }))

    // Check cache first (only if not refreshing)
    if (!isRefresh) {
      const cacheKey = cacheUtils.getWorkoutQueryKey(user.id, 'student')
      const cachedWorkouts = workoutCache.get<WorkoutWithExercises[]>(cacheKey)
      if (cachedWorkouts) {
        setState(prev => ({ 
          ...prev, 
          workouts: cachedWorkouts,
          refreshing: false,
          error: null
        }))
        return
      }
    }

    try {
      clearError()
      const workouts = await getStudentWorkouts(user.id)
      
      // Cache the results
      const cacheKey = cacheUtils.getWorkoutQueryKey(user.id, 'student')
      workoutCache.set(cacheKey, workouts, 5 * 60 * 1000) // 5 minutes
      
      setState(prev => ({ 
        ...prev, 
        workouts,
        refreshing: false,
        error: null
      }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        refreshing: false
      }))
    }
  }, [user, getStudentWorkouts, clearError])

  useEffect(() => {
    fetchWorkouts()
  }, [fetchWorkouts])

  const handleRefresh = useCallback(() => {
    fetchWorkouts(true)
  }, [fetchWorkouts])

  const handleRetry = useCallback(() => {
    retry()
    fetchWorkouts()
  }, [retry, fetchWorkouts])

  const handleWorkoutPress = useCallback((workout: WorkoutWithExercises) => {
    setState(prev => ({
      ...prev,
      selectedWorkout: workout,
      showDetails: true
    }))
  }, [])

  const handleCloseDetails = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedWorkout: null,
      showDetails: false
    }))
  }, [])

  const handleStartWorkout = useCallback(() => {
    // Future implementation - placeholder for now
    console.log('Starting workout:', state.selectedWorkout?.name)
    handleCloseDetails()
  }, [state.selectedWorkout, handleCloseDetails])

  const getWorkoutStatus = (workout: WorkoutWithExercises) => {
    // Future implementation - for now return 'new'
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

  const getInitials = useCallback((name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }, [])

  // Optimization functions for FlatList performance
  const keyExtractor = useCallback((item: WorkoutWithExercises) => item.id, [])
  
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: 140, // Approximate height of workout card
    offset: 140 * index,
    index,
  }), [])

  // Get optimal batch sizes for performance
  const batchConfig = useMemo(() => getOptimalBatchSize(), [])

  const renderWorkoutCard = useCallback(({ item: workout }: { item: WorkoutWithExercises }) => {
    const status = getWorkoutStatus(workout)
    return (
      <WorkoutCard
        workout={workout}
        onPress={handleWorkoutPress}
        getInitials={getInitials}
      />
    )
  }, [handleWorkoutPress, getInitials])



  if (loadingAuth) return <Loading />

  if (!user || user.role !== "student") {
    return (
      <View style={styles.container}>
        <ThemedText>Acesso restrito a alunos</ThemedText>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <WorkoutListWrapper
        loading={operationLoading && !state.refreshing}
        error={operationError}
        workouts={state.workouts}
        onRetry={handleRetry}
        userRole="student"
      >
        <FlatList
          data={state.workouts}
          keyExtractor={keyExtractor}
          renderItem={renderWorkoutCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          getItemLayout={getItemLayout}
          removeClippedSubviews={true}
          maxToRenderPerBatch={batchConfig.maxToRenderPerBatch}
          updateCellsBatchingPeriod={batchConfig.updateCellsBatchingPeriod}
          initialNumToRender={batchConfig.initialNumToRender}
          windowSize={batchConfig.windowSize}
          refreshControl={
            <RefreshControl
              refreshing={state.refreshing}
              onRefresh={handleRefresh}
              tintColor="#007bff"
              title="Atualizando treinos..."
            />
          }
        />
      </WorkoutListWrapper>

      <WorkoutDetailsModal
        visible={state.showDetails}
        workout={state.selectedWorkout}
        onClose={handleCloseDetails}
        onStartWorkout={handleStartWorkout}
      />
    </View>
  )
})

WorkoutListScreen.displayName = 'WorkoutListScreen'

// Memoized WorkoutCard component for better performance
const WorkoutCard = memo(({ workout, onPress, getInitials }: {
  workout: WorkoutWithExercises
  onPress: (workout: WorkoutWithExercises) => void
  getInitials: (name: string) => string
}) => {
  const getWorkoutStatus = (workout: WorkoutWithExercises) => {
    // Future implementation - for now return 'new'
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

  const status = getWorkoutStatus(workout)
  const statusColor = getStatusColor(status)
  const statusText = getStatusText(status)

  return (
    <TouchableOpacity
      onPress={() => onPress(workout)}
      accessibilityLabel={`Treino ${workout.name}, ${workout.exercises.length} exercícios`}
      accessibilityHint="Toque para ver detalhes do treino"
    >
      <Card style={styles.workoutCard} variant="elevated" padding="medium">
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
              {workout.instructor && (
                <View style={styles.instructorInfo}>
                  <Avatar.Text
                    label={getInitials(workout.instructor.full_name)}
                    size="small"
                    style={styles.instructorAvatar}
                  />
                  <ThemedText style={styles.instructorName}>
                    {workout.instructor.full_name}
                  </ThemedText>
                </View>
              )}

              <View style={styles.workoutStats}>
                <ThemedText style={styles.statText}>
                  {workout.exercises.length} {workout.exercises.length === 1 ? 'exercício' : 'exercícios'}
                </ThemedText>
                <ThemedText style={styles.separator}>•</ThemedText>
                <ThemedText style={styles.statText}>
                  {new Date(workout.created_at).toLocaleDateString('pt-BR')}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.cardRight}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <ThemedText style={styles.statusText}>
                {statusText}
              </ThemedText>
            </View>

            {workout.exercises.length > 0 && (
              <View style={styles.exercisePreview}>
                {workout.exercises.slice(0, 3).map((exerciseData, index) => (
                  <View key={exerciseData.exercise.id} style={[
                    styles.exerciseThumbnailContainer,
                    { zIndex: 3 - index, marginLeft: index * -8 }
                  ]}>
                    {exerciseData.exercise.thumbnail_url ? (
                      <LazyImage
                        source={{ uri: exerciseData.exercise.thumbnail_url }}
                        style={styles.exerciseThumbnail}
                        placeholder={<ImagePlaceholder style={styles.exerciseThumbnail} />}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.exercisePlaceholder}>
                        <ThemedText style={styles.exercisePlaceholderText}>
                          {exerciseData.exercise.name.charAt(0).toUpperCase()}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                ))}
                
                {workout.exercises.length > 3 && (
                  <View style={[styles.moreExercises, { marginLeft: 3 * -8 + 16 }]}>
                    <ThemedText style={styles.moreExercisesText}>
                      +{workout.exercises.length - 3}
                    </ThemedText>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  )
})

WorkoutCard.displayName = 'WorkoutCard'

export default WorkoutListScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  workoutCard: {
    marginBottom: 16,
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
  instructorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructorAvatar: {
    backgroundColor: '#2563eb',
  },
  instructorName: {
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

})
