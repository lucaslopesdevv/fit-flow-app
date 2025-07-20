import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import ExerciseSelectionStep from '../ExerciseSelectionStep'
import { Exercise, WorkoutExerciseConfig } from '@/types/database'

// Mock Supabase
jest.mock('@/services/supabase/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          ilike: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: mockExercises,
              error: null
            }))
          }))
        })),
        ilike: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: mockExercises,
            error: null
          }))
        })),
        order: jest.fn(() => Promise.resolve({
          data: mockExercises,
          error: null
        }))
      }))
    }))
  }
}))

const mockExercises: Exercise[] = [
  {
    id: '1',
    name: 'Supino Reto',
    muscle_group: 'Peito',
    description: 'Exercício para peitoral',
    thumbnail_url: 'https://example.com/supino.jpg',
    created_by: 'instructor-1',
    created_at: '2025-01-18T10:00:00Z'
  },
  {
    id: '2',
    name: 'Agachamento',
    muscle_group: 'Pernas',
    description: 'Exercício para pernas',
    thumbnail_url: 'https://example.com/agachamento.jpg',
    created_by: 'instructor-1',
    created_at: '2025-01-18T10:00:00Z'
  }
]

const mockSelectedExercises: WorkoutExerciseConfig[] = [
  {
    exerciseId: '1',
    exercise: mockExercises[0],
    sets: 3,
    reps: '10-12',
    restSeconds: 60,
    orderIndex: 1,
    notes: ''
  }
]

const defaultProps = {
  selectedExercises: [],
  onExerciseAdd: jest.fn(),
  onExerciseRemove: jest.fn(),
  onExerciseReorder: jest.fn()
}

describe('ExerciseSelectionStep', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly with no selected exercises', async () => {
    const { getByText, getByLabelText } = render(
      <ExerciseSelectionStep {...defaultProps} />
    )

    // Should show search input
    expect(getByLabelText('Campo de busca de exercícios')).toBeTruthy()
    
    // Should show muscle group filters
    expect(getByText('Peito')).toBeTruthy()
    expect(getByText('Costas')).toBeTruthy()
    
    // Should show exercises section
    expect(getByText('Exercícios Disponíveis')).toBeTruthy()
    
    // Wait for exercises to load
    await waitFor(() => {
      expect(getByText('Supino Reto')).toBeTruthy()
      expect(getByText('Agachamento')).toBeTruthy()
    })
  })

  it('shows selected exercises preview when exercises are selected', () => {
    const { getByText } = render(
      <ExerciseSelectionStep 
        {...defaultProps} 
        selectedExercises={mockSelectedExercises}
      />
    )

    expect(getByText('Exercícios Selecionados (1)')).toBeTruthy()
    expect(getByText('Supino Reto')).toBeTruthy()
  })

  it('calls onExerciseAdd when exercise is selected', async () => {
    const onExerciseAdd = jest.fn()
    const { getByLabelText } = render(
      <ExerciseSelectionStep 
        {...defaultProps} 
        onExerciseAdd={onExerciseAdd}
      />
    )

    await waitFor(() => {
      const exerciseButton = getByLabelText('Adicionar exercício Supino Reto')
      fireEvent.press(exerciseButton)
    })

    expect(onExerciseAdd).toHaveBeenCalledWith(mockExercises[0])
  })

  it('calls onExerciseRemove when exercise is deselected', async () => {
    const onExerciseRemove = jest.fn()
    const { getByLabelText } = render(
      <ExerciseSelectionStep 
        {...defaultProps} 
        selectedExercises={mockSelectedExercises}
        onExerciseRemove={onExerciseRemove}
      />
    )

    await waitFor(() => {
      const exerciseButton = getByLabelText('Remover exercício Supino Reto')
      fireEvent.press(exerciseButton)
    })

    expect(onExerciseRemove).toHaveBeenCalledWith('1')
  })

  it('filters exercises by search term', async () => {
    const { getByLabelText, getByText, queryByText } = render(
      <ExerciseSelectionStep {...defaultProps} />
    )

    const searchInput = getByLabelText('Campo de busca de exercícios')
    fireEvent.changeText(searchInput, 'Supino')

    // Wait for debounced search
    await waitFor(() => {
      expect(getByText('Supino Reto')).toBeTruthy()
    }, { timeout: 500 })
  })

  it('filters exercises by muscle group', async () => {
    const { getByText } = render(
      <ExerciseSelectionStep {...defaultProps} />
    )

    const peitoButton = getByText('Peito')
    fireEvent.press(peitoButton)

    // Wait for filter to apply
    await waitFor(() => {
      expect(getByText('Supino Reto')).toBeTruthy()
    })
  })

  it('handles exercise reordering', () => {
    const onExerciseReorder = jest.fn()
    const multipleSelected: WorkoutExerciseConfig[] = [
      mockSelectedExercises[0],
      {
        exerciseId: '2',
        exercise: mockExercises[1],
        sets: 3,
        reps: '12-15',
        restSeconds: 90,
        orderIndex: 2,
        notes: ''
      }
    ]

    const { getByLabelText } = render(
      <ExerciseSelectionStep 
        {...defaultProps} 
        selectedExercises={multipleSelected}
        onExerciseReorder={onExerciseReorder}
      />
    )

    const moveDownButton = getByLabelText('Mover Supino Reto para baixo')
    fireEvent.press(moveDownButton)

    expect(onExerciseReorder).toHaveBeenCalled()
  })

  it('clears filters when clear button is pressed', async () => {
    const { getByLabelText, getByText } = render(
      <ExerciseSelectionStep {...defaultProps} />
    )

    // Set search term
    const searchInput = getByLabelText('Campo de busca de exercícios')
    fireEvent.changeText(searchInput, 'Supino')

    // Select muscle group
    const peitoButton = getByText('Peito')
    fireEvent.press(peitoButton)

    // Clear filters
    await waitFor(() => {
      const clearButton = getByLabelText('Limpar filtros de busca')
      fireEvent.press(clearButton)
    })

    // Verify filters are cleared
    expect(searchInput.props.value).toBe('')
  })

  it('shows accessibility labels and hints', () => {
    const { getByLabelText } = render(
      <ExerciseSelectionStep {...defaultProps} />
    )

    expect(getByLabelText('Campo de busca de exercícios')).toBeTruthy()
    expect(getByLabelText('Filtros por grupo muscular')).toBeTruthy()
    expect(getByLabelText('Lista de exercícios disponíveis')).toBeTruthy()
  })

  it('handles loading and error states', async () => {
    // Mock error response
    const mockSupabaseError = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Network error' }
          }))
        }))
      }))
    }

    jest.doMock('@/services/supabase/supabase', () => ({
      supabase: mockSupabaseError
    }))

    const { getByText } = render(
      <ExerciseSelectionStep {...defaultProps} />
    )

    await waitFor(() => {
      expect(getByText('Network error')).toBeTruthy()
      expect(getByText('Tentar Novamente')).toBeTruthy()
    })
  })
})