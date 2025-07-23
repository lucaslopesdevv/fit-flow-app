import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'
import { Alert } from 'react-native'
import CreateWorkoutModal from '@/components/modals/CreateWorkoutModal'
import WorkoutDetailsModal from '@/components/modals/WorkoutDetailsModal'
import WorkoutListScreen from '@/screens/student/WorkoutListScreen'
import { WorkoutService, WorkoutError, WorkoutErrorType } from '@/services/api/WorkoutService'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/context/ThemeContext'

// Mock dependencies
jest.mock('@/services/api/WorkoutService')
jest.mock('@/hooks/useAuth')
jest.mock('@/context/ThemeContext')
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native')
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  }
})

const mockWorkoutService = WorkoutService as jest.Mocked<typeof WorkoutService>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>

describe('Workout Error Handling Tests', () => {
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
      role: 'student',
      instructor_id: 'instructor-123',
    },
  ]

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

  describe('Validation Error Handling', () => {
    it('should handle empty workout name validation', async () => {
      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={mockStudents}
        />
      )

      // Try to proceed without workout name
      const nextButton = screen.getByText('Próximo')
      fireEvent.press(nextButton)

      await waitFor(() => {
        expect(screen.getByText('Por favor, preencha todos os campos obrigatórios.')).toBeTruthy()
      })

      // Error should be displayed prominently
      const errorMessage = screen.getByText('Por favor, preencha todos os campos obrigatórios.')
      expect(errorMessage.props.accessibilityLiveRegion).toBe('assertive')
    })

    it('should handle missing student selection validation', async () => {
      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={mockStudents}
        />
      )

      // Fill name but don't select student
      const nameInput = screen.getByPlaceholderText('Nome do treino')
      fireEvent.changeText(nameInput, 'Test Workout')

      const nextButton = screen.getByText('Próximo')
      fireEvent.press(nextButton)

      await waitFor(() => {
        expect(screen.getByText('Por favor, preencha todos os campos obrigatórios.')).toBeTruthy()
      })
    })

    it('should handle invalid exercise configuration', async () => {
      mockWorkoutService.createWorkout.mockRejectedValue(
        new WorkoutError(
          WorkoutErrorType.VALIDATION_ERROR,
          'Exercise 1: Number of sets must be at least 1',
          'exercises.0.sets'
        )
      )

      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={mockStudents}
        />
      )

      // Fill form and attempt creation
      const nameInput = screen.getByPlaceholderText('Nome do treino')
      fireEvent.changeText(nameInput, 'Test Workout')

      const studentOption = screen.getByText('Student One')
      fireEvent.press(studentOption)

      const nextButton = screen.getByText('Próximo')
      fireEvent.press(nextButton)

      // Skip to creation step
      await waitFor(() => {
        const createButton = screen.getByText('Criar Treino')
        fireEvent.press(createButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Exercise 1: Number of sets must be at least 1')).toBeTruthy()
      })

      // Should highlight the specific field with error
      const errorField = screen.getByTestId('exercise-sets-error-0')
      expect(errorField).toBeTruthy()
    })

    it('should handle workout name length validation', async () => {
      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={mockStudents}
        />
      )

      // Enter extremely long workout name
      const longName = 'A'.repeat(256)
      const nameInput = screen.getByPlaceholderText('Nome do treino')
      fireEvent.changeText(nameInput, longName)

      await waitFor(() => {
        expect(screen.getByText('Nome do treino deve ter no máximo 255 caracteres')).toBeTruthy()
      })
    })
  })

  describe('Network Error Handling', () => {
    it('should handle network timeout errors', async () => {
      mockWorkoutService.createWorkout.mockRejectedValue(
        new WorkoutError(
          WorkoutErrorType.NETWORK_ERROR,
          'Tempo limite para criar treino excedido. Tente novamente.'
        )
      )

      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={mockStudents}
        />
      )

      // Fill form and attempt creation
      const nameInput = screen.getByPlaceholderText('Nome do treino')
      fireEvent.changeText(nameInput, 'Test Workout')

      const studentOption = screen.getByText('Student One')
      fireEvent.press(studentOption)

      const nextButton = screen.getByText('Próximo')
      fireEvent.press(nextButton)

      await waitFor(() => {
        const createButton = screen.getByText('Criar Treino')
        fireEvent.press(createButton)
      })

      await waitFor(() => {
        expect(
          screen.getByText('Tempo limite para criar treino excedido. Tente novamente.')
        ).toBeTruthy()
      })

      // Should show retry button
      expect(screen.getByText('Tentar Novamente')).toBeTruthy()
    })

    it('should handle connection errors gracefully', async () => {
      mockWorkoutService.getStudentWorkouts.mockRejectedValue(new Error('Network request failed'))

      render(<WorkoutListScreen />)

      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar treinos')).toBeTruthy()
      })

      // Should show retry option
      expect(screen.getByText('Tentar Novamente')).toBeTruthy()

      // Should show offline message
      expect(screen.getByText('Verifique sua conexão com a internet')).toBeTruthy()
    })

    it('should handle server errors with proper user feedback', async () => {
      mockWorkoutService.createWorkout.mockRejectedValue(
        new WorkoutError(
          WorkoutErrorType.NETWORK_ERROR,
          'Erro interno do servidor. Tente novamente mais tarde.'
        )
      )

      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={mockStudents}
        />
      )

      // Fill form and attempt creation
      const nameInput = screen.getByPlaceholderText('Nome do treino')
      fireEvent.changeText(nameInput, 'Test Workout')

      const studentOption = screen.getByText('Student One')
      fireEvent.press(studentOption)

      const nextButton = screen.getByText('Próximo')
      fireEvent.press(nextButton)

      await waitFor(() => {
        const createButton = screen.getByText('Criar Treino')
        fireEvent.press(createButton)
      })

      await waitFor(() => {
        expect(
          screen.getByText('Erro interno do servidor. Tente novamente mais tarde.')
        ).toBeTruthy()
      })

      // Should provide helpful guidance
      expect(
        screen.getByText('Se o problema persistir, entre em contato com o suporte')
      ).toBeTruthy()
    })

    it('should handle retry functionality correctly', async () => {
      let attemptCount = 0
      mockWorkoutService.createWorkout.mockImplementation(() => {
        attemptCount++
        if (attemptCount === 1) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          id: 'workout-123',
          name: 'Test Workout',
          exercises: [],
        } as any)
      })

      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={mockStudents}
        />
      )

      // Fill form and attempt creation
      const nameInput = screen.getByPlaceholderText('Nome do treino')
      fireEvent.changeText(nameInput, 'Test Workout')

      const studentOption = screen.getByText('Student One')
      fireEvent.press(studentOption)

      const nextButton = screen.getByText('Próximo')
      fireEvent.press(nextButton)

      await waitFor(() => {
        const createButton = screen.getByText('Criar Treino')
        fireEvent.press(createButton)
      })

      // Should show error first
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeTruthy()
      })

      // Retry should work
      const retryButton = screen.getByText('Tentar Novamente')
      fireEvent.press(retryButton)

      await waitFor(() => {
        expect(attemptCount).toBe(2)
        expect(screen.getByText('Treino criado com sucesso!')).toBeTruthy()
      })
    })
  })

  describe('Permission Error Handling', () => {
    it('should handle unauthorized access errors', async () => {
      mockWorkoutService.createWorkout.mockRejectedValue(
        new WorkoutError(
          WorkoutErrorType.PERMISSION_ERROR,
          'You can only create workouts for your own students'
        )
      )

      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={mockStudents}
        />
      )

      // Fill form and attempt creation
      const nameInput = screen.getByPlaceholderText('Nome do treino')
      fireEvent.changeText(nameInput, 'Test Workout')

      const studentOption = screen.getByText('Student One')
      fireEvent.press(studentOption)

      const nextButton = screen.getByText('Próximo')
      fireEvent.press(nextButton)

      await waitFor(() => {
        const createButton = screen.getByText('Criar Treino')
        fireEvent.press(createButton)
      })

      await waitFor(() => {
        expect(screen.getByText('You can only create workouts for your own students')).toBeTruthy()
      })

      // Should not show retry for permission errors
      expect(screen.queryByText('Tentar Novamente')).toBeNull()
    })

    it('should handle session expiration gracefully', async () => {
      mockWorkoutService.getStudentWorkouts.mockRejectedValue(
        new WorkoutError(WorkoutErrorType.PERMISSION_ERROR, 'Session expired. Please log in again.')
      )

      render(<WorkoutListScreen />)

      await waitFor(() => {
        expect(screen.getByText('Session expired. Please log in again.')).toBeTruthy()
      })

      // Should show login button
      expect(screen.getByText('Fazer Login')).toBeTruthy()
    })
  })

  describe('Data Not Found Error Handling', () => {
    it('should handle workout not found errors', async () => {
      mockWorkoutService.getWorkoutDetails.mockRejectedValue(
        new WorkoutError(WorkoutErrorType.NOT_FOUND_ERROR, 'Workout not found')
      )

      render(<WorkoutDetailsModal visible={true} workout={null} onClose={jest.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Treino não encontrado')).toBeTruthy()
      })

      // Should show helpful message
      expect(
        screen.getByText(
          'Este treino pode ter sido removido ou você não tem permissão para visualizá-lo'
        )
      ).toBeTruthy()
    })

    it('should handle student not found errors', async () => {
      mockWorkoutService.createWorkout.mockRejectedValue(
        new WorkoutError(WorkoutErrorType.NOT_FOUND_ERROR, 'Student not found')
      )

      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={mockStudents}
        />
      )

      // Fill form and attempt creation
      const nameInput = screen.getByPlaceholderText('Nome do treino')
      fireEvent.changeText(nameInput, 'Test Workout')

      const studentOption = screen.getByText('Student One')
      fireEvent.press(studentOption)

      const nextButton = screen.getByText('Próximo')
      fireEvent.press(nextButton)

      await waitFor(() => {
        const createButton = screen.getByText('Criar Treino')
        fireEvent.press(createButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Student not found')).toBeTruthy()
      })

      // Should suggest refreshing student list
      expect(screen.getByText('Atualizar Lista de Alunos')).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty student list gracefully', () => {
      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={[]}
        />
      )

      expect(screen.getByText('Nenhum aluno encontrado')).toBeTruthy()
      expect(
        screen.getByText('Você precisa ter alunos cadastrados para criar treinos')
      ).toBeTruthy()

      // Next button should be disabled
      const nextButton = screen.getByText('Próximo')
      expect(nextButton.props.disabled).toBe(true)
    })

    it('should handle malformed workout data', () => {
      const malformedWorkout = {
        id: 'workout-123',
        name: null, // Invalid data
        exercises: [
          {
            id: 'we-1',
            sets: 'invalid', // Invalid data type
            exercise: null, // Missing exercise data
          },
        ],
      }

      render(
        <WorkoutDetailsModal visible={true} workout={malformedWorkout as any} onClose={jest.fn()} />
      )

      // Should not crash and show fallback content
      expect(screen.getByText('Dados do treino inválidos')).toBeTruthy()
      expect(screen.getByText('Alguns dados deste treino estão corrompidos')).toBeTruthy()
    })

    it('should handle extremely large workout names', () => {
      const workoutWithLongName = {
        id: 'workout-123',
        name: 'A'.repeat(1000),
        description: 'Normal description',
        exercises: [],
      }

      render(
        <WorkoutDetailsModal
          visible={true}
          workout={workoutWithLongName as any}
          onClose={jest.fn()}
        />
      )

      // Should truncate long names gracefully
      const truncatedName = screen.getByTestId('workout-name-truncated')
      expect(truncatedName).toBeTruthy()
    })

    it('should handle workout with no exercises', () => {
      const emptyWorkout = {
        id: 'workout-123',
        name: 'Empty Workout',
        description: 'Workout with no exercises',
        exercises: [],
        student: { full_name: 'Test Student' },
        instructor: { full_name: 'Test Instructor' },
      }

      render(
        <WorkoutDetailsModal visible={true} workout={emptyWorkout as any} onClose={jest.fn()} />
      )

      expect(screen.getByText('Nenhum exercício adicionado a este treino.')).toBeTruthy()
      expect(
        screen.getByText('Entre em contato com seu instrutor para adicionar exercícios')
      ).toBeTruthy()
    })

    it('should handle concurrent modal operations', async () => {
      const onClose = jest.fn()
      const onSuccess = jest.fn()

      const { rerender } = render(
        <CreateWorkoutModal
          visible={true}
          onClose={onClose}
          onSuccess={onSuccess}
          instructorStudents={mockStudents}
        />
      )

      // Simulate rapid open/close operations
      rerender(
        <CreateWorkoutModal
          visible={false}
          onClose={onClose}
          onSuccess={onSuccess}
          instructorStudents={mockStudents}
        />
      )

      rerender(
        <CreateWorkoutModal
          visible={true}
          onClose={onClose}
          onSuccess={onSuccess}
          instructorStudents={mockStudents}
        />
      )

      // Should handle state changes gracefully
      expect(screen.getByText('Criar Treino')).toBeTruthy()
    })
  })

  describe('Form State Persistence', () => {
    it('should preserve form data during errors', async () => {
      mockWorkoutService.createWorkout.mockRejectedValue(new Error('Network error'))

      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={mockStudents}
        />
      )

      // Fill form
      const nameInput = screen.getByPlaceholderText('Nome do treino')
      fireEvent.changeText(nameInput, 'Test Workout')

      const descriptionInput = screen.getByPlaceholderText('Descrição (opcional)')
      fireEvent.changeText(descriptionInput, 'Test Description')

      const studentOption = screen.getByText('Student One')
      fireEvent.press(studentOption)

      const nextButton = screen.getByText('Próximo')
      fireEvent.press(nextButton)

      // Attempt creation (will fail)
      await waitFor(() => {
        const createButton = screen.getByText('Criar Treino')
        fireEvent.press(createButton)
      })

      // Should show error but preserve form data
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeTruthy()
      })

      // Form data should still be there
      expect(screen.getByDisplayValue('Test Workout')).toBeTruthy()
      expect(screen.getByDisplayValue('Test Description')).toBeTruthy()
    })

    it('should clear form data after successful creation', async () => {
      mockWorkoutService.createWorkout.mockResolvedValue({
        id: 'workout-123',
        name: 'Test Workout',
        exercises: [],
      } as any)

      const onSuccess = jest.fn()

      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={onSuccess}
          instructorStudents={mockStudents}
        />
      )

      // Fill form
      const nameInput = screen.getByPlaceholderText('Nome do treino')
      fireEvent.changeText(nameInput, 'Test Workout')

      const studentOption = screen.getByText('Student One')
      fireEvent.press(studentOption)

      const nextButton = screen.getByText('Próximo')
      fireEvent.press(nextButton)

      // Create workout successfully
      await waitFor(() => {
        const createButton = screen.getByText('Criar Treino')
        fireEvent.press(createButton)
      })

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })

      // Form should be cleared
      expect(screen.getByPlaceholderText('Nome do treino').props.value).toBe('')
    })
  })

  describe('Accessibility Error Handling', () => {
    it('should announce errors to screen readers', async () => {
      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={mockStudents}
        />
      )

      // Trigger validation error
      const nextButton = screen.getByText('Próximo')
      fireEvent.press(nextButton)

      await waitFor(() => {
        const errorMessage = screen.getByText('Por favor, preencha todos os campos obrigatórios.')
        expect(errorMessage.props.accessibilityLiveRegion).toBe('assertive')
        expect(errorMessage.props.accessibilityRole).toBe('alert')
      })
    })

    it('should provide proper error context for form fields', async () => {
      mockWorkoutService.createWorkout.mockRejectedValue(
        new WorkoutError(WorkoutErrorType.VALIDATION_ERROR, 'Workout name is required', 'name')
      )

      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={mockStudents}
        />
      )

      const nameInput = screen.getByPlaceholderText('Nome do treino')
      const nextButton = screen.getByText('Próximo')
      fireEvent.press(nextButton)

      await waitFor(() => {
        expect(nameInput.props.accessibilityInvalid).toBe(true)
        expect(nameInput.props.accessibilityErrorMessage).toBe('Workout name is required')
      })
    })
  })

  describe('Error Recovery', () => {
    it('should allow users to recover from errors by correcting input', async () => {
      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={mockStudents}
        />
      )

      // Trigger validation error
      const nextButton = screen.getByText('Próximo')
      fireEvent.press(nextButton)

      await waitFor(() => {
        expect(screen.getByText('Por favor, preencha todos os campos obrigatórios.')).toBeTruthy()
      })

      // Correct the error
      const nameInput = screen.getByPlaceholderText('Nome do treino')
      fireEvent.changeText(nameInput, 'Test Workout')

      const studentOption = screen.getByText('Student One')
      fireEvent.press(studentOption)

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Por favor, preencha todos os campos obrigatórios.')).toBeNull()
      })

      // Should be able to proceed
      fireEvent.press(nextButton)

      await waitFor(() => {
        expect(screen.getByText('Selecionar Exercícios')).toBeTruthy()
      })
    })
  })
})
