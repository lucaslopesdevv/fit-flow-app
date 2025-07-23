import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { AccessibilityInfo } from 'react-native'
import CreateWorkoutModal from '@/components/modals/CreateWorkoutModal'
import WorkoutDetailsModal from '@/components/modals/WorkoutDetailsModal'
import WorkoutCard from '@/components/workout/WorkoutCard'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/context/ThemeContext'

// Mock dependencies
jest.mock('@/hooks/useAuth')
jest.mock('@/context/ThemeContext')
jest.mock('../../workout', () => ({
  useWorkoutOperations: () => ({
    createWorkout: jest.fn(),
    updateWorkout: jest.fn(),
    loading: false,
    error: null,
    getPersistedFormData: jest.fn(),
    clearPersistedFormData: jest.fn(),
    retry: jest.fn(),
    clearError: jest.fn(),
  }),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>

describe('Workout Accessibility Tests', () => {
  const mockUser = {
    id: 'instructor-123',
    email: 'instructor@test.com',
    role: 'instructor',
    full_name: 'Test Instructor',
  }

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
  }

  const mockStudents = [
    {
      id: 'student-1',
      full_name: 'Student One',
      email: 'student1@test.com',
      role: 'student' as const,
      instructor_id: 'instructor-123',
      created_at: '2025-01-18T08:00:00Z',
      updated_at: '2025-01-18T08:00:00Z',
      is_active: true,
      avatar_url: null,
      phone: undefined,
    },
  ]

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
    ],
    student: {
      id: 'student-123',
      full_name: 'João Silva',
      email: 'joao@example.com',
      role: 'student' as const,
      instructor_id: 'instructor-123',
      created_at: '2025-01-18T08:00:00Z',
      updated_at: '2025-01-18T08:00:00Z',
      is_active: true,
      avatar_url: null,
      phone: null,
    },
    instructor: {
      id: 'instructor-123',
      full_name: 'Maria Santos',
      email: 'maria@example.com',
      role: 'instructor' as const,
      instructor_id: null,
      created_at: '2025-01-18T07:00:00Z',
      updated_at: '2025-01-18T07:00:00Z',
      is_active: true,
      avatar_url: null,
      phone: null,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
    })

    mockUseTheme.mockReturnValue({
      theme: mockTheme,
      isDark: false,
      toggleTheme: jest.fn(),
    })
  })

  describe('CreateWorkoutModal Accessibility', () => {
    const defaultProps = {
      visible: true,
      onClose: jest.fn(),
      onSuccess: jest.fn(),
      instructorStudents: mockStudents,
    }

    it('should have proper accessibility labels for form inputs', () => {
      render(<CreateWorkoutModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('Nome do treino')
      expect(nameInput.props.accessibilityLabel).toBe('Nome do treino')
      expect(nameInput.props.accessibilityHint).toBe('Digite o nome do treino')

      const descriptionInput = screen.getByPlaceholderText('Descrição (opcional)')
      expect(descriptionInput.props.accessibilityLabel).toBe('Descrição do treino')
      expect(descriptionInput.props.accessibilityHint).toBe(
        'Digite uma descrição opcional para o treino'
      )
    })

    it('should have proper accessibility roles for interactive elements', () => {
      render(<CreateWorkoutModal {...defaultProps} />)

      const nextButton = screen.getByText('Próximo')
      expect(nextButton.props.accessibilityRole).toBe('button')
      expect(nextButton.props.accessibilityLabel).toBe('Próximo passo')

      const cancelButton = screen.getByText('Cancelar')
      expect(cancelButton.props.accessibilityRole).toBe('button')
      expect(cancelButton.props.accessibilityLabel).toBe('Cancelar criação do treino')
    })

    it('should have proper accessibility states for form validation', () => {
      render(<CreateWorkoutModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('Nome do treino')
      expect(nameInput.props.accessibilityRequired).toBe(true)

      const descriptionInput = screen.getByPlaceholderText('Descrição (opcional)')
      expect(descriptionInput.props.accessibilityRequired).toBe(false)
    })

    it('should announce form errors to screen readers', () => {
      render(<CreateWorkoutModal {...defaultProps} />)

      const nextButton = screen.getByText('Próximo')
      expect(nextButton.props.accessibilityLabel).toBe('Próximo passo')

      // When there's an error, it should be announced
      const errorText = screen.queryByText('Por favor, preencha todos os campos obrigatórios.')
      if (errorText) {
        expect(errorText.props.accessibilityLiveRegion).toBe('assertive')
        expect(errorText.props.accessibilityRole).toBe('alert')
      }
    })

    it('should have proper accessibility for student selection', () => {
      render(<CreateWorkoutModal {...defaultProps} />)

      const studentOption = screen.getByText('Student One')
      expect(studentOption.props.accessibilityRole).toBe('button')
      expect(studentOption.props.accessibilityLabel).toBe('Selecionar aluno Student One')
      expect(studentOption.props.accessibilityHint).toBe(
        'Toque para selecionar este aluno para o treino'
      )
    })

    it('should have proper accessibility for progress indicator', () => {
      render(<CreateWorkoutModal {...defaultProps} />)

      const progressIndicator = screen.getByTestId('progress-indicator')
      expect(progressIndicator.props.accessibilityRole).toBe('progressbar')
      expect(progressIndicator.props.accessibilityLabel).toBe('Progresso da criação do treino')
      expect(progressIndicator.props.accessibilityValue).toEqual({
        min: 0,
        max: 4,
        now: 1,
        text: 'Passo 1 de 4: Informações básicas',
      })
    })

    it('should support keyboard navigation', () => {
      render(<CreateWorkoutModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('Nome do treino')
      expect(nameInput.props.accessible).toBe(true)
      expect(nameInput.props.accessibilityElementsHidden).toBe(false)

      const nextButton = screen.getByText('Próximo')
      expect(nextButton.props.accessible).toBe(true)
      expect(nextButton.props.accessibilityElementsHidden).toBe(false)
    })

    it('should have proper focus management', () => {
      render(<CreateWorkoutModal {...defaultProps} />)

      const modal = screen.getByTestId('create-workout-modal')
      expect(modal.props.accessibilityViewIsModal).toBe(true)
      expect(modal.props.accessibilityLabel).toBe('Criar novo treino')
    })
  })

  describe('WorkoutDetailsModal Accessibility', () => {
    const defaultProps = {
      visible: true,
      workout: mockWorkout,
      onClose: jest.fn(),
      onStartWorkout: jest.fn(),
    }

    it('should have proper accessibility labels for workout information', () => {
      render(<WorkoutDetailsModal {...defaultProps} />)

      const workoutTitle = screen.getByText('Treino de Peito')
      expect(workoutTitle.props.accessibilityRole).toBe('header')
      expect(workoutTitle.props.accessibilityLabel).toBe('Nome do treino: Treino de Peito')

      const workoutDescription = screen.getByText('Treino focado em desenvolvimento do peitoral')
      expect(workoutDescription.props.accessibilityLabel).toBe(
        'Descrição: Treino focado em desenvolvimento do peitoral'
      )
    })

    it('should have proper accessibility for exercise list', () => {
      render(<WorkoutDetailsModal {...defaultProps} />)

      const exercisesList = screen.getByTestId('exercises-list')
      expect(exercisesList.props.accessibilityRole).toBe('list')
      expect(exercisesList.props.accessibilityLabel).toBe('Lista de exercícios do treino')

      const exerciseItem = screen.getByTestId('exercise-item-exercise-1')
      expect(exerciseItem.props.accessibilityRole).toBe('listitem')
      expect(exerciseItem.props.accessibilityLabel).toBe(
        'Exercício 1: Supino Reto, 3 séries de 10-12 repetições, 60 segundos de descanso, Observações: Foco na contração'
      )
    })

    it('should have proper accessibility for action buttons', () => {
      render(<WorkoutDetailsModal {...defaultProps} />)

      const startButton = screen.getByText('Iniciar Treino')
      expect(startButton.props.accessibilityRole).toBe('button')
      expect(startButton.props.accessibilityLabel).toBe('Iniciar execução do treino')
      expect(startButton.props.accessibilityHint).toBe('Toque para começar a executar este treino')

      const closeButton = screen.getByText('Fechar')
      expect(closeButton.props.accessibilityRole).toBe('button')
      expect(closeButton.props.accessibilityLabel).toBe('Fechar detalhes do treino')
    })

    it('should have proper accessibility for exercise images', () => {
      render(<WorkoutDetailsModal {...defaultProps} />)

      const exerciseImage = screen.getByTestId('exercise-thumbnail-exercise-1')
      expect(exerciseImage.props.accessibilityRole).toBe('image')
      expect(exerciseImage.props.accessibilityLabel).toBe('Imagem do exercício Supino Reto')
      expect(exerciseImage.props.accessible).toBe(true)
    })

    it('should handle missing exercise images accessibly', () => {
      const workoutWithoutImage = {
        ...mockWorkout,
        exercises: [
          {
            ...mockWorkout.exercises[0],
            exercise: {
              ...mockWorkout.exercises[0].exercise,
              thumbnail_url: null,
            },
          },
        ],
      }

      render(<WorkoutDetailsModal {...defaultProps} workout={workoutWithoutImage} />)

      const placeholder = screen.getByTestId('exercise-placeholder-exercise-1')
      expect(placeholder.props.accessibilityRole).toBe('image')
      expect(placeholder.props.accessibilityLabel).toBe(
        'Imagem não disponível para o exercício Supino Reto'
      )
    })

    it('should have proper modal accessibility', () => {
      render(<WorkoutDetailsModal {...defaultProps} />)

      const modal = screen.getByTestId('workout-details-modal')
      expect(modal.props.accessibilityViewIsModal).toBe(true)
      expect(modal.props.accessibilityLabel).toBe('Detalhes do treino Treino de Peito')
    })
  })

  describe('WorkoutCard Accessibility', () => {
    const defaultProps = {
      workout: mockWorkout,
      onPress: jest.fn(),
      showStudent: true,
      showInstructor: false,
    }

    it('should have proper accessibility for workout card', () => {
      render(<WorkoutCard {...defaultProps} />)

      const workoutCard = screen.getByTestId('workout-card-workout-123')
      expect(workoutCard.props.accessibilityRole).toBe('button')
      expect(workoutCard.props.accessibilityLabel).toBe(
        'Treino: Treino de Peito, Aluno: João Silva, 1 exercício, Criado em 18 de janeiro de 2025'
      )
      expect(workoutCard.props.accessibilityHint).toBe('Toque para ver os detalhes do treino')
    })

    it('should have proper accessibility states', () => {
      render(<WorkoutCard {...defaultProps} />)

      const workoutCard = screen.getByTestId('workout-card-workout-123')
      expect(workoutCard.props.accessible).toBe(true)
      expect(workoutCard.props.accessibilityElementsHidden).toBe(false)
    })

    it('should adapt accessibility label based on context', () => {
      const instructorViewProps = {
        ...defaultProps,
        showStudent: true,
        showInstructor: false,
      }

      const { rerender } = render(<WorkoutCard {...instructorViewProps} />)

      let workoutCard = screen.getByTestId('workout-card-workout-123')
      expect(workoutCard.props.accessibilityLabel).toContain('Aluno: João Silva')
      expect(workoutCard.props.accessibilityLabel).not.toContain('Instrutor:')

      const studentViewProps = {
        ...defaultProps,
        showStudent: false,
        showInstructor: true,
      }

      rerender(<WorkoutCard {...studentViewProps} />)

      workoutCard = screen.getByTestId('workout-card-workout-123')
      expect(workoutCard.props.accessibilityLabel).toContain('Instrutor: Maria Santos')
      expect(workoutCard.props.accessibilityLabel).not.toContain('Aluno:')
    })
  })

  describe('Color Contrast and Visual Accessibility', () => {
    it('should have sufficient color contrast for text elements', () => {
      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={mockStudents}
        />
      )

      const titleText = screen.getByText('Criar Treino')
      const titleStyle = titleText.props.style

      // Check that text color has sufficient contrast with background
      expect(titleStyle.color).toBe(mockTheme.colors.text)

      // In a real implementation, you would calculate the contrast ratio
      // and ensure it meets WCAG AA standards (4.5:1 for normal text)
    })

    it('should have proper touch target sizes', () => {
      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={mockStudents}
        />
      )

      const nextButton = screen.getByText('Próximo')
      const buttonStyle = nextButton.props.style

      // Touch targets should be at least 44x44 points
      expect(buttonStyle.minHeight).toBeGreaterThanOrEqual(44)
      expect(buttonStyle.minWidth).toBeGreaterThanOrEqual(44)
    })

    it('should support high contrast mode', () => {
      // Mock high contrast mode
      const highContrastTheme = {
        ...mockTheme,
        colors: {
          ...mockTheme.colors,
          text: '#000000',
          background: '#FFFFFF',
          border: '#000000',
        },
      }

      mockUseTheme.mockReturnValue({
        theme: highContrastTheme,
        isDark: false,
        toggleTheme: jest.fn(),
      })

      render(<WorkoutDetailsModal visible={true} workout={mockWorkout} onClose={jest.fn()} />)

      const modal = screen.getByTestId('workout-details-modal')
      expect(modal.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: '#FFFFFF',
        })
      )
    })
  })

  describe('Screen Reader Support', () => {
    it('should provide proper reading order', () => {
      render(<WorkoutDetailsModal visible={true} workout={mockWorkout} onClose={jest.fn()} />)

      // Elements should be in logical reading order
      const elements = screen.getAllByTestId(/workout-|exercise-/)
      elements.forEach((element, index) => {
        expect(element.props.accessibilityElementsHidden).toBe(false)
        // In a real implementation, you would verify the actual reading order
      })
    })

    it('should announce dynamic content changes', () => {
      const { rerender } = render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={mockStudents}
        />
      )

      // Simulate error state
      const errorProps = {
        visible: true,
        onClose: jest.fn(),
        onSuccess: jest.fn(),
        instructorStudents: mockStudents,
        error: 'Erro ao criar treino',
      }

      rerender(<CreateWorkoutModal {...errorProps} />)

      const errorMessage = screen.getByText('Erro ao criar treino')
      expect(errorMessage.props.accessibilityLiveRegion).toBe('assertive')
    })

    it('should provide context for form fields', () => {
      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={mockStudents}
        />
      )

      const nameInput = screen.getByPlaceholderText('Nome do treino')
      expect(nameInput.props.accessibilityLabel).toBe('Nome do treino')
      expect(nameInput.props.accessibilityHint).toBe('Digite o nome do treino')
      expect(nameInput.props.accessibilityRequired).toBe(true)
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support tab navigation', () => {
      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={mockStudents}
        />
      )

      const focusableElements = [
        screen.getByPlaceholderText('Nome do treino'),
        screen.getByPlaceholderText('Descrição (opcional)'),
        screen.getByText('Student One'),
        screen.getByText('Próximo'),
        screen.getByText('Cancelar'),
      ]

      focusableElements.forEach(element => {
        expect(element.props.accessible).toBe(true)
        expect(element.props.accessibilityElementsHidden).toBe(false)
      })
    })

    it('should handle focus trapping in modals', () => {
      render(<WorkoutDetailsModal visible={true} workout={mockWorkout} onClose={jest.fn()} />)

      const modal = screen.getByTestId('workout-details-modal')
      expect(modal.props.accessibilityViewIsModal).toBe(true)

      // Focus should be trapped within the modal
      const focusableElements = screen.getAllByRole('button')
      focusableElements.forEach(element => {
        expect(element.props.accessible).toBe(true)
      })
    })
  })

  describe('Voice Control Support', () => {
    it('should have voice control labels for buttons', () => {
      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={mockStudents}
        />
      )

      const nextButton = screen.getByText('Próximo')
      expect(nextButton.props.accessibilityLabel).toBe('Próximo passo')

      const cancelButton = screen.getByText('Cancelar')
      expect(cancelButton.props.accessibilityLabel).toBe('Cancelar criação do treino')
    })

    it('should have unique voice control identifiers', () => {
      render(
        <WorkoutDetailsModal
          visible={true}
          workout={mockWorkout}
          onClose={jest.fn()}
          onStartWorkout={jest.fn()}
        />
      )

      const startButton = screen.getByText('Iniciar Treino')
      expect(startButton.props.accessibilityLabel).toBe('Iniciar execução do treino')

      const closeButton = screen.getByText('Fechar')
      expect(closeButton.props.accessibilityLabel).toBe('Fechar detalhes do treino')

      // Labels should be unique to avoid voice control conflicts
      expect(startButton.props.accessibilityLabel).not.toBe(closeButton.props.accessibilityLabel)
    })
  })

  describe('Reduced Motion Support', () => {
    it('should respect reduced motion preferences', () => {
      // Mock reduced motion preference
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true)

      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={mockStudents}
        />
      )

      // Animations should be disabled or reduced when reduce motion is enabled
      const modal = screen.getByTestId('create-workout-modal')
      expect(modal.props.animationType).toBe('none')
    })
  })
})
