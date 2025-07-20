import { useState, useCallback, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { WorkoutService, WorkoutError, WorkoutErrorType, CreateWorkoutRequest, UpdateWorkoutRequest, WorkoutWithExercises } from '@/services/api/WorkoutService'

interface UseWorkoutOperationsOptions {
  maxRetries?: number
  retryDelay?: number
  timeout?: number
  persistFormData?: boolean
  formStorageKey?: string
}

interface WorkoutOperationState {
  loading: boolean
  error: WorkoutError | null
  retryCount: number
  lastOperation: string | null
}

export function useWorkoutOperations(options: UseWorkoutOperationsOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 30000,
    persistFormData = true,
    formStorageKey = 'workout_form_data'
  } = options

  const [state, setState] = useState<WorkoutOperationState>({
    loading: false,
    error: null,
    retryCount: 0,
    lastOperation: null
  })

  const timeoutRef = useRef<NodeJS.Timeout>()
  const abortControllerRef = useRef<AbortController>()

  // Helper function to handle operation with retry logic
  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    shouldRetry: (error: WorkoutError) => boolean = (error) => 
      error.type === WorkoutErrorType.NETWORK_ERROR
  ): Promise<T> => {
    let lastError: WorkoutError | null = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setState(prev => ({
          ...prev,
          loading: true,
          error: null,
          retryCount: attempt,
          lastOperation: operationName
        }))

        // Set up timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutRef.current = setTimeout(() => {
            reject(new WorkoutError(
              WorkoutErrorType.NETWORK_ERROR,
              'Operação expirou. Tente novamente.'
            ))
          }, timeout)
        })

        // Set up abort controller for cancellation
        abortControllerRef.current = new AbortController()

        const result = await Promise.race([
          operation(),
          timeoutPromise
        ])

        // Clear timeout on success
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        setState(prev => ({
          ...prev,
          loading: false,
          error: null,
          retryCount: 0,
          lastOperation: null
        }))

        return result
      } catch (error) {
        // Clear timeout on error
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        const workoutError = error instanceof WorkoutError 
          ? error 
          : new WorkoutError(WorkoutErrorType.NETWORK_ERROR, `Erro inesperado: ${error}`)

        lastError = workoutError

        // Don't retry if it's the last attempt or if error shouldn't be retried
        if (attempt === maxRetries || !shouldRetry(workoutError)) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: workoutError,
            retryCount: attempt,
            lastOperation: operationName
          }))
          throw workoutError
        }

        // Wait before retry with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }, [maxRetries, retryDelay, timeout])

  // Form persistence helpers
  const persistFormData = useCallback(async (data: any) => {
    if (!persistFormData) return
    
    try {
      await AsyncStorage.setItem(formStorageKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.warn('Failed to persist form data:', error)
    }
  }, [persistFormData, formStorageKey])

  const getPersistedFormData = useCallback(async (): Promise<any | null> => {
    if (!persistFormData) return null

    try {
      const stored = await AsyncStorage.getItem(formStorageKey)
      if (!stored) return null

      const { data, timestamp } = JSON.parse(stored)
      
      // Check if data is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000
      if (Date.now() - timestamp > maxAge) {
        await AsyncStorage.removeItem(formStorageKey)
        return null
      }

      return data
    } catch (error) {
      console.warn('Failed to get persisted form data:', error)
      return null
    }
  }, [persistFormData, formStorageKey])

  const clearPersistedFormData = useCallback(async () => {
    if (!persistFormData) return

    try {
      await AsyncStorage.removeItem(formStorageKey)
    } catch (error) {
      console.warn('Failed to clear persisted form data:', error)
    }
  }, [persistFormData, formStorageKey])

  // Workout operations with retry logic
  const createWorkout = useCallback(async (
    instructorId: string,
    workoutData: CreateWorkoutRequest
  ): Promise<WorkoutWithExercises> => {
    // Persist form data before attempting to save
    await persistFormData(workoutData)

    const result = await executeWithRetry(
      () => WorkoutService.createWorkout(instructorId, workoutData),
      'Criando treino'
    )

    // Clear persisted data on success
    await clearPersistedFormData()
    
    return result
  }, [executeWithRetry, persistFormData, clearPersistedFormData])

  const updateWorkout = useCallback(async (
    workoutId: string,
    instructorId: string,
    updateData: UpdateWorkoutRequest
  ): Promise<WorkoutWithExercises> => {
    // Persist form data before attempting to save
    await persistFormData(updateData)

    const result = await executeWithRetry(
      () => WorkoutService.updateWorkout(workoutId, instructorId, updateData),
      'Atualizando treino'
    )

    // Clear persisted data on success
    await clearPersistedFormData()
    
    return result
  }, [executeWithRetry, persistFormData, clearPersistedFormData])

  const deleteWorkout = useCallback(async (
    workoutId: string,
    instructorId: string
  ): Promise<void> => {
    return executeWithRetry(
      () => WorkoutService.deleteWorkout(workoutId, instructorId),
      'Excluindo treino',
      // Don't retry delete operations on validation/permission errors
      (error) => error.type === WorkoutErrorType.NETWORK_ERROR
    )
  }, [executeWithRetry])

  const getInstructorWorkouts = useCallback(async (
    instructorId: string
  ): Promise<WorkoutWithExercises[]> => {
    return executeWithRetry(
      () => WorkoutService.getInstructorWorkouts(instructorId),
      'Carregando treinos do instrutor'
    )
  }, [executeWithRetry])

  const getStudentWorkouts = useCallback(async (
    studentId: string
  ): Promise<WorkoutWithExercises[]> => {
    return executeWithRetry(
      () => WorkoutService.getStudentWorkouts(studentId),
      'Carregando treinos do aluno'
    )
  }, [executeWithRetry])

  const getWorkoutDetails = useCallback(async (
    workoutId: string
  ): Promise<WorkoutWithExercises> => {
    return executeWithRetry(
      () => WorkoutService.getWorkoutDetails(workoutId),
      'Carregando detalhes do treino'
    )
  }, [executeWithRetry])

  const duplicateWorkout = useCallback(async (
    workoutId: string,
    instructorId: string,
    newStudentId?: string,
    newName?: string
  ): Promise<WorkoutWithExercises> => {
    return executeWithRetry(
      () => WorkoutService.duplicateWorkout(workoutId, instructorId, newStudentId, newName),
      'Duplicando treino'
    )
  }, [executeWithRetry])

  const searchInstructorWorkouts = useCallback(async (
    instructorId: string,
    options: Parameters<typeof WorkoutService.searchInstructorWorkouts>[1] = {}
  ): Promise<WorkoutWithExercises[]> => {
    return executeWithRetry(
      () => WorkoutService.searchInstructorWorkouts(instructorId, options),
      'Pesquisando treinos'
    )
  }, [executeWithRetry])

  // Manual retry function
  const retry = useCallback(async () => {
    if (!state.lastOperation) return

    // Reset error state and retry the last operation
    setState(prev => ({
      ...prev,
      error: null,
      retryCount: 0
    }))

    // Note: This is a simplified retry - in a real implementation,
    // you'd need to store the operation parameters and retry with them
    console.log(`Retrying last operation: ${state.lastOperation}`)
  }, [state.lastOperation])

  // Cancel current operation
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setState(prev => ({
      ...prev,
      loading: false,
      error: null,
      lastOperation: null
    }))
  }, [])

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }))
  }, [])

  return {
    // State
    loading: state.loading,
    error: state.error,
    retryCount: state.retryCount,
    canRetry: state.error?.type === WorkoutErrorType.NETWORK_ERROR,
    
    // Operations
    createWorkout,
    updateWorkout,
    deleteWorkout,
    getInstructorWorkouts,
    getStudentWorkouts,
    getWorkoutDetails,
    duplicateWorkout,
    searchInstructorWorkouts,
    
    // Form persistence
    getPersistedFormData,
    clearPersistedFormData,
    
    // Control
    retry,
    cancel,
    clearError
  }
}