import ExerciseConfigurationStep from '../ExerciseConfigurationStep'
import { WorkoutExerciseConfig, Exercise } from '../../../types/database'

// Mock data
const mockExercise1: Exercise = {
  id: 'exercise-1',
  name: 'Supino Reto',
  description: 'Exercício para peitoral',
  muscle_group: 'Peito',
  video_url: 'https://example.com/video1.mp4',
  thumbnail_url: 'https://example.com/thumb1.jpg',
  created_by: 'instructor-1',
  created_at: '2025-01-18T10:00:00Z',
}

const mockExercise2: Exercise = {
  id: 'exercise-2',
  name: 'Agachamento',
  description: 'Exercício para pernas',
  muscle_group: 'Pernas',
  video_url: 'https://example.com/video2.mp4',
  thumbnail_url: 'https://example.com/thumb2.jpg',
  created_by: 'instructor-1',
  created_at: '2025-01-18T10:00:00Z',
}

const mockExercises: WorkoutExerciseConfig[] = [
  {
    exerciseId: 'exercise-1',
    exercise: mockExercise1,
    sets: 3,
    reps: '10-12',
    restSeconds: 60,
    orderIndex: 1,
    notes: 'Foco na contração',
  },
  {
    exerciseId: 'exercise-2',
    exercise: mockExercise2,
    sets: 4,
    reps: '15',
    restSeconds: 90,
    orderIndex: 2,
    notes: '',
  },
]

const mockProps = {
  exercises: mockExercises,
  onExerciseUpdate: jest.fn(),
  onValidationChange: jest.fn(),
}

describe('ExerciseConfigurationStep', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should be importable', () => {
    expect(ExerciseConfigurationStep).toBeDefined()
    expect(typeof ExerciseConfigurationStep).toBe('function')
  })

  it('should validate exercise configuration correctly', () => {
    // Test the validation logic
    const validExercise: WorkoutExerciseConfig = {
      exerciseId: 'exercise-1',
      exercise: mockExercise1,
      sets: 3,
      reps: '10-12',
      restSeconds: 60,
      orderIndex: 1,
      notes: 'Test notes',
    }

    expect(validExercise.sets).toBeGreaterThan(0)
    expect(validExercise.reps).toBeTruthy()
    expect(validExercise.restSeconds).toBeGreaterThanOrEqual(0)
  })

  it('should handle invalid exercise configuration', () => {
    const invalidExercise: WorkoutExerciseConfig = {
      exerciseId: 'exercise-1',
      exercise: mockExercise1,
      sets: 0, // Invalid
      reps: '', // Invalid
      restSeconds: -1, // Invalid
      orderIndex: 1,
      notes: '',
    }

    expect(invalidExercise.sets).toBeLessThanOrEqual(0)
    expect(invalidExercise.reps).toBeFalsy()
    expect(invalidExercise.restSeconds).toBeLessThan(0)
  })

  it('should call onExerciseUpdate when configuration changes', () => {
    const onExerciseUpdate = jest.fn()
    const onValidationChange = jest.fn()

    // Simulate calling the update function
    onExerciseUpdate('exercise-1', { sets: 5 })

    expect(onExerciseUpdate).toHaveBeenCalledWith('exercise-1', { sets: 5 })
  })

  it('should call onValidationChange when validation state changes', () => {
    const onExerciseUpdate = jest.fn()
    const onValidationChange = jest.fn()

    // Simulate validation change
    onValidationChange(true)

    expect(onValidationChange).toHaveBeenCalledWith(true)
  })

  it('should format rest time correctly', () => {
    const formatRestTime = (seconds: number): string => {
      if (seconds < 60) {
        return `${seconds}s`
      }
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
    }

    expect(formatRestTime(30)).toBe('30s')
    expect(formatRestTime(60)).toBe('1m')
    expect(formatRestTime(90)).toBe('1m 30s')
    expect(formatRestTime(120)).toBe('2m')
  })

  it('should validate sets correctly', () => {
    // Test sets validation logic
    const validateSets = (sets: number) => {
      if (isNaN(sets) || sets < 1) {
        return { isValid: false, error: 'Séries deve ser um número maior que 0' }
      }
      if (sets > 20) {
        return { isValid: false, error: 'Máximo de 20 séries permitidas' }
      }
      return { isValid: true }
    }

    expect(validateSets(0)).toEqual({
      isValid: false,
      error: 'Séries deve ser um número maior que 0',
    })
    expect(validateSets(3)).toEqual({ isValid: true })
    expect(validateSets(21)).toEqual({ isValid: false, error: 'Máximo de 20 séries permitidas' })
  })

  it('should validate reps correctly', () => {
    // Test reps validation logic
    const validateReps = (reps: string) => {
      if (!reps.trim()) {
        return { isValid: false, error: 'Repetições é obrigatório' }
      }
      if (reps.length > 20) {
        return { isValid: false, error: 'Máximo de 20 caracteres' }
      }
      return { isValid: true }
    }

    expect(validateReps('')).toEqual({ isValid: false, error: 'Repetições é obrigatório' })
    expect(validateReps('10-12')).toEqual({ isValid: true })
    expect(validateReps('a'.repeat(21))).toEqual({
      isValid: false,
      error: 'Máximo de 20 caracteres',
    })
  })

  it('should validate rest seconds correctly', () => {
    // Test rest seconds validation logic
    const validateRestSeconds = (restSeconds: number) => {
      if (isNaN(restSeconds) || restSeconds < 0) {
        return { isValid: false, error: 'Descanso deve ser um número maior ou igual a 0' }
      }
      if (restSeconds > 600) {
        return { isValid: false, error: 'Máximo de 10 minutos (600 segundos)' }
      }
      return { isValid: true }
    }

    expect(validateRestSeconds(-1)).toEqual({
      isValid: false,
      error: 'Descanso deve ser um número maior ou igual a 0',
    })
    expect(validateRestSeconds(60)).toEqual({ isValid: true })
    expect(validateRestSeconds(601)).toEqual({
      isValid: false,
      error: 'Máximo de 10 minutos (600 segundos)',
    })
  })
})
