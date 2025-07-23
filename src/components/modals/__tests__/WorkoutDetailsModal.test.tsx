import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react-native'
import WorkoutDetailsModal from '../WorkoutDetailsModal'
import { useTheme } from '@/context/ThemeContext'

// Mock dependencies
jest.mock('@/context/ThemeContext')
jest.mock('@/utils/accessibility', () => ({
  announceForAccessibility: jest.fn(),
  getModalAccessibilityProps: jest.fn(() => ({})),
  getButtonAccessibilityProps: jest.fn(() => ({})),
  getListItemAccessibilityProps: jest.fn(() => ({})),
}))

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>

describe('WorkoutDetailsModal', () => {
  const mockTheme = {
    colors: {
      primary: '#007AFF',
      background: '#FFFFFF',
      surface: '#F2F2F7',
      text: '#000000',
      textSecondary: '#8E8E93',
      border: '#C6C6C8',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    dark: false,
    roundness: 4,
    animation: {
      scale: 1.0,
    },
  }

  const mockWorkout = {
    id: 'workout-123',
    name: 'Treino de Peito',
    description: 'Treino focado em desenvolvimento do peitoral',
    student_id: 'student-123',
    instructor_id: 'instructor-123',
    created_at: '2025-01-18T10:00:00Z',
    updated_at: '2025-01-18T10:00:00Z',
    exercises: [
      {
        id: 'we-1',
        workout_id: 'workout-123',
        exercise_id: 'exercise-1',
        sets: 3,
        reps: '10-12',
        rest_seconds: 60,
        order_index: 1,
        notes: 'Foco na contração',
        exercise: {
          id: 'exercise-1',
          name: 'Supino Reto',
          muscle_group: 'chest',
          thumbnail_url: 'https://example.com/supino.jpg',
          description: 'Exercício para peitoral',
          instructions: 'Deite no banco e empurre a barra',
          created_by: 'instructor-123',
          created_at: '2025-01-18T09:00:00Z',
          updated_at: '2025-01-18T09:00:00Z',
        },
      },
      {
        id: 'we-2',
        workout_id: 'workout-123',
        exercise_id: 'exercise-2',
        sets: 4,
        reps: '8-10',
        rest_seconds: 90,
        order_index: 2,
        notes: null,
        exercise: {
          id: 'exercise-2',
          name: 'Flexão de Braço',
          muscle_group: 'chest',
          thumbnail_url: null,
          description: 'Exercício com peso corporal',
          instructions: 'Posição de prancha e flexione os braços',
          created_by: 'instructor-123',
          created_at: '2025-01-18T09:00:00Z',
          updated_at: '2025-01-18T09:00:00Z',
        },
      },
    ],
    student: {
      id: 'student-123',
      full_name: 'João Silva',
      email: 'joao@example.com',
      avatar_url: 'https://example.com/avatar.jpg',
      phone: null,
      instructor_id: 'instructor-123',
      role: 'student' as const,
      created_at: '2025-01-18T08:00:00Z',
      updated_at: '2025-01-18T08:00:00Z',
      is_active: true,
    },
    instructor: {
      id: 'instructor-123',
      full_name: 'Maria Santos',
      email: 'maria@example.com',
      avatar_url: null,
      phone: null,
      instructor_id: null,
      role: 'instructor' as const,
      created_at: '2025-01-18T07:00:00Z',
      updated_at: '2025-01-18T07:00:00Z',
      is_active: true,
    },
  }

  const defaultProps = {
    visible: true,
    workout: mockWorkout,
    onClose: jest.fn(),
    onStartWorkout: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseTheme.mockReturnValue({
      theme: mockTheme as any,
      isDark: false,
      toggleTheme: jest.fn(),
    })
  })

  describe('Rendering', () => {
    it('should render modal when visible', () => {
      render(<WorkoutDetailsModal {...defaultProps} />)

      expect(screen.getByText('Detalhes do Treino')).toBeTruthy()
      expect(screen.getByText('Treino de Peito')).toBeTruthy()
      expect(screen.getByText('Treino focado em desenvolvimento do peitoral')).toBeTruthy()
    })

    it('should not render modal when not visible', () => {
      render(<WorkoutDetailsModal {...defaultProps} visible={false} />)

      expect(screen.queryByText('Detalhes do Treino')).toBeNull()
    })

    it('should not render when workout is null', () => {
      render(<WorkoutDetailsModal {...defaultProps} workout={null} />)

      expect(screen.queryByText('Detalhes do Treino')).toBeNull()
    })

    it('should render workout information correctly', () => {
      render(<WorkoutDetailsModal {...defaultProps} />)

      expect(screen.getByText('Treino de Peito')).toBeTruthy()
      expect(screen.getByText('Treino focado em desenvolvimento do peitoral')).toBeTruthy()
      expect(screen.getByText('Instrutor: Maria Santos')).toBeTruthy()
      expect(screen.getByText('Aluno: João Silva')).toBeTruthy()
    })

    it('should render exercises list', () => {
      render(<WorkoutDetailsModal {...defaultProps} />)

      expect(screen.getByText('Exercícios (2)')).toBeTruthy()
      expect(screen.getByText('Supino Reto')).toBeTruthy()
      expect(screen.getByText('Flexão de Braço')).toBeTruthy()
    })

    it('should render exercise details correctly', () => {
      render(<WorkoutDetailsModal {...defaultProps} />)

      // First exercise details
      expect(screen.getByText('3 séries')).toBeTruthy()
      expect(screen.getByText('10-12 repetições')).toBeTruthy()
      expect(screen.getByText('60s descanso')).toBeTruthy()
      expect(screen.getByText('Foco na contração')).toBeTruthy()

      // Second exercise details
      expect(screen.getByText('4 séries')).toBeTruthy()
      expect(screen.getByText('8-10 repetições')).toBeTruthy()
      expect(screen.getByText('90s descanso')).toBeTruthy()
    })
  })

  describe('User Interactions', () => {
    it('should close modal when close button is pressed', () => {
      render(<WorkoutDetailsModal {...defaultProps} />)

      const closeButton = screen.getByText('Fechar')
      fireEvent.press(closeButton)

      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('should call onStartWorkout when start button is pressed', () => {
      render(<WorkoutDetailsModal {...defaultProps} />)

      const startButton = screen.getByText('Iniciar Treino')
      fireEvent.press(startButton)

      expect(defaultProps.onStartWorkout).toHaveBeenCalled()
    })

    it('should not render start button when onStartWorkout is not provided', () => {
      render(<WorkoutDetailsModal {...defaultProps} onStartWorkout={undefined} />)

      expect(screen.queryByText('Iniciar Treino')).toBeNull()
    })
  })

  describe('Empty States', () => {
    it('should handle workout without exercises', () => {
      const workoutWithoutExercises = {
        ...mockWorkout,
        exercises: [],
      }

      render(<WorkoutDetailsModal {...defaultProps} workout={workoutWithoutExercises} />)

      expect(screen.getByText('Exercícios (0)')).toBeTruthy()
      expect(screen.getByText('Nenhum exercício adicionado a este treino.')).toBeTruthy()
    })

    it('should handle workout without description', () => {
      const workoutWithoutDescription = {
        ...mockWorkout,
        description: null,
      }

      render(<WorkoutDetailsModal {...defaultProps} workout={workoutWithoutDescription} />)

      expect(screen.queryByText('Treino focado em desenvolvimento do peitoral')).toBeNull()
    })
  })

  describe('Accessibility', () => {
    it('should have proper accessibility labels for modal', () => {
      render(<WorkoutDetailsModal {...defaultProps} />)

      const modal = screen.getByTestId('workout-details-modal')
      expect(modal.props.accessibilityLabel).toBeDefined()
    })

    it('should have proper accessibility labels for buttons', () => {
      render(<WorkoutDetailsModal {...defaultProps} />)

      const closeButton = screen.getByText('Fechar')
      expect(closeButton.props.accessibilityRole).toBe('button')

      const startButton = screen.getByText('Iniciar Treino')
      expect(startButton.props.accessibilityRole).toBe('button')
    })
  })

  describe('Theme Integration', () => {
    it('should apply dark theme colors', () => {
      const darkTheme = {
        ...mockTheme,
        colors: {
          ...mockTheme.colors,
          background: '#000000',
          text: '#FFFFFF',
        },
        dark: true,
      }

      mockUseTheme.mockReturnValue({
        theme: darkTheme as any,
        isDark: true,
        toggleTheme: jest.fn(),
      })

      render(<WorkoutDetailsModal {...defaultProps} />)

      const modal = screen.getByTestId('workout-details-modal')
      expect(modal.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: '#000000',
        })
      )
    })
  })
})
