import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react-native'
import WorkoutDetailsModal from '../WorkoutDetailsModal'
import { WorkoutWithExercises } from '@/types/database'

// Mock data
const mockWorkout: WorkoutWithExercises = {
  id: 'workout-1',
  name: 'Treino de Peito e Tríceps',
  description: 'Treino focado no desenvolvimento do peitoral e tríceps',
  student_id: 'student-1',
  instructor_id: 'instructor-1',
  created_at: '2025-01-18T10:00:00Z',
  updated_at: '2025-01-18T10:00:00Z',
  student: {
    id: 'student-1',
    full_name: 'João Silva',
    email: 'joao@example.com',
    phone: '(11) 99999-9999',
    avatar_url: null,
    instructor_id: 'instructor-1',
    role: 'student',
    created_at: '2025-01-18T09:00:00Z',
    updated_at: '2025-01-18T09:00:00Z',
    is_active: true
  },
  instructor: {
    id: 'instructor-1',
    full_name: 'Maria Santos',
    email: 'maria@example.com',
    phone: '(11) 88888-8888',
    avatar_url: null,
    instructor_id: null,
    role: 'instructor',
    created_at: '2025-01-18T08:00:00Z',
    updated_at: '2025-01-18T08:00:00Z',
    is_active: true
  },
  exercises: [
    {
      id: 'we-1',
      workout_id: 'workout-1',
      exercise_id: 'exercise-1',
      sets: 3,
      reps: '10-12',
      rest_seconds: 60,
      order_index: 1,
      notes: 'Foco na contração máxima',
      exercise: {
        id: 'exercise-1',
        name: 'Supino Reto',
        description: 'Exercício para peitoral',
        muscle_group: 'Peito',
        video_url: null,
        thumbnail_url: 'https://example.com/supino.jpg',
        created_by: 'instructor-1',
        created_at: '2025-01-18T07:00:00Z'
      }
    },
    {
      id: 'we-2',
      workout_id: 'workout-1',
      exercise_id: 'exercise-2',
      sets: 4,
      reps: '8-10',
      rest_seconds: 90,
      order_index: 2,
      notes: null,
      exercise: {
        id: 'exercise-2',
        name: 'Tríceps Testa',
        description: 'Exercício para tríceps',
        muscle_group: 'Tríceps',
        video_url: null,
        thumbnail_url: null,
        created_by: 'instructor-1',
        created_at: '2025-01-18T07:00:00Z'
      }
    }
  ]
}

const mockProps = {
  visible: true,
  workout: mockWorkout,
  onClose: jest.fn(),
  onStartWorkout: jest.fn()
}

describe('WorkoutDetailsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders workout details correctly', () => {
    render(<WorkoutDetailsModal {...mockProps} />)

    // Check workout name and description
    expect(screen.getByText('Treino de Peito e Tríceps')).toBeTruthy()
    expect(screen.getByText('Treino focado no desenvolvimento do peitoral e tríceps')).toBeTruthy()

    // Check instructor info
    expect(screen.getByText('Instrutor')).toBeTruthy()
    expect(screen.getByText('Maria Santos')).toBeTruthy()

    // Check student info
    expect(screen.getByText('Aluno')).toBeTruthy()
    expect(screen.getByText('João Silva')).toBeTruthy()

    // Check exercise count
    expect(screen.getByText('Exercícios (2)')).toBeTruthy()
  })

  it('renders exercise details correctly', () => {
    render(<WorkoutDetailsModal {...mockProps} />)

    // Check first exercise
    expect(screen.getByText('Supino Reto')).toBeTruthy()
    expect(screen.getByText('Peito')).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy() // sets
    expect(screen.getByText('10-12')).toBeTruthy() // reps
    expect(screen.getByText('1m')).toBeTruthy() // rest time
    expect(screen.getByText('Foco na contração máxima')).toBeTruthy() // notes

    // Check second exercise
    expect(screen.getByText('Tríceps Testa')).toBeTruthy()
    expect(screen.getByText('Tríceps')).toBeTruthy()
    expect(screen.getByText('4')).toBeTruthy() // sets
    expect(screen.getByText('8-10')).toBeTruthy() // reps
    expect(screen.getByText('1m 30s')).toBeTruthy() // rest time
  })

  it('displays workout statistics correctly', () => {
    render(<WorkoutDetailsModal {...mockProps} />)

    // Check total exercises
    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getByText('Exercícios')).toBeTruthy()

    // Check total sets (3 + 4 = 7)
    expect(screen.getByText('7')).toBeTruthy()
    expect(screen.getByText('Séries Totais')).toBeTruthy()

    // Check average rest time ((60 + 90) / 2 = 75 seconds = 1m 15s)
    expect(screen.getByText('1m 15s')).toBeTruthy()
    expect(screen.getByText('Descanso Médio')).toBeTruthy()
  })

  it('handles close button press', () => {
    render(<WorkoutDetailsModal {...mockProps} />)

    const closeButton = screen.getByText('Fechar')
    fireEvent.press(closeButton)

    expect(mockProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('handles start workout button press when provided', () => {
    render(<WorkoutDetailsModal {...mockProps} />)

    const startButton = screen.getByText('Iniciar Treino')
    fireEvent.press(startButton)

    expect(mockProps.onStartWorkout).toHaveBeenCalledTimes(1)
  })

  it('does not render start workout button when onStartWorkout is not provided', () => {
    const propsWithoutStart = {
      ...mockProps,
      onStartWorkout: undefined
    }

    render(<WorkoutDetailsModal {...propsWithoutStart} />)

    expect(screen.queryByText('Iniciar Treino')).toBeNull()
  })

  it('renders empty state when no exercises', () => {
    const workoutWithoutExercises = {
      ...mockWorkout,
      exercises: []
    }

    render(<WorkoutDetailsModal {...mockProps} workout={workoutWithoutExercises} />)

    expect(screen.getByText('Nenhum exercício encontrado neste treino.')).toBeTruthy()
    expect(screen.getByText('Exercícios (0)')).toBeTruthy()
  })

  it('does not render when workout is null', () => {
    render(<WorkoutDetailsModal {...mockProps} workout={null} />)

    expect(screen.queryByText('Detalhes do Treino')).toBeNull()
  })

  it('formats rest time correctly', () => {
    const workoutWithVariousRestTimes = {
      ...mockWorkout,
      exercises: [
        {
          ...mockWorkout.exercises[0],
          rest_seconds: 30 // 30s
        },
        {
          ...mockWorkout.exercises[1],
          rest_seconds: 120 // 2m
        },
        {
          ...mockWorkout.exercises[0],
          id: 'we-3',
          rest_seconds: 150 // 2m 30s
        }
      ]
    }

    render(<WorkoutDetailsModal {...mockProps} workout={workoutWithVariousRestTimes} />)

    expect(screen.getByText('30s')).toBeTruthy()
    expect(screen.getByText('2m')).toBeTruthy()
    expect(screen.getByText('2m 30s')).toBeTruthy()
  })

  it('renders exercise placeholder when no thumbnail', () => {
    render(<WorkoutDetailsModal {...mockProps} />)

    // Second exercise has no thumbnail, should show placeholder with first letter
    expect(screen.getByText('T')).toBeTruthy() // First letter of "Tríceps Testa"
  })

  it('renders exercise order numbers correctly', () => {
    render(<WorkoutDetailsModal {...mockProps} />)

    // Check exercise order indicators
    expect(screen.getByText('1')).toBeTruthy() // First exercise
    expect(screen.getByText('2')).toBeTruthy() // Second exercise
  })

  it('handles workout without description', () => {
    const workoutWithoutDescription = {
      ...mockWorkout,
      description: undefined
    }

    render(<WorkoutDetailsModal {...mockProps} workout={workoutWithoutDescription} />)

    expect(screen.getByText('Treino de Peito e Tríceps')).toBeTruthy()
    expect(screen.queryByText('Treino focado no desenvolvimento do peitoral e tríceps')).toBeNull()
  })

  it('handles exercises without notes', () => {
    render(<WorkoutDetailsModal {...mockProps} />)

    // First exercise has notes, second doesn't
    expect(screen.getByText('Observações:')).toBeTruthy()
    expect(screen.getByText('Foco na contração máxima')).toBeTruthy()
    
    // Should only have one "Observações:" text (for the first exercise)
    expect(screen.getAllByText('Observações:')).toHaveLength(1)
  })

  it('generates correct initials for avatars', () => {
    render(<WorkoutDetailsModal {...mockProps} />)

    // Should generate initials from names
    // "Maria Santos" -> "MS", "João Silva" -> "JS"
    expect(screen.getByText('MS')).toBeTruthy()
    expect(screen.getByText('JS')).toBeTruthy()
  })
})