import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'
import { NavigationContainer } from '@react-navigation/native'
import InstructorHomeScreen from '@/screens/instructor/InstructorHomeScreen'
import WorkoutListScreen from '@/screens/student/WorkoutListScreen'
import { WorkoutService } from '@/services/api/WorkoutService'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/context/ThemeContext'

// Mock dependencies
jest.mock('@/services/api/WorkoutService')
jest.mock('@/hooks/useAuth')
jest.mock('@/context/ThemeContext')
jest.mock('@/utils/accessibility', () => ({
  announceForAccessibility: jest.fn(),
  getFieldAccessibilityProps: jest.fn(() => ({})),
  getButtonAccessibilityProps: jest.fn(() => ({})),
  getModalAccessibilityProps: jest.fn(() => ({})),
  getListItemAccessibilityProps: jest.fn(() => ({})),
}))

const mockWorkoutService = WorkoutService as jest.Mocked<typeof WorkoutService>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>

describe('Workout Creation Flow Integration', () => {
  const mockInstructor = {
    id: 'instructor-123',
    email: 'instructor@test.com',
    role: 'instructor',
    full_name: 'Test Instructor',
  }

  const mockStudent = {
    id: 'student-123',
    email: 'student@test.com',
    role: 'student',
    full_name: 'Test Student',
    instructor_id: 'instructor-123',
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
    {
      id: 'student-2',
      full_name: 'Student Two',
      email: 'student2@test.com',
      role: 'student',
      instructor_id: 'instructor-123',
    },
  ]

  const mockExercises = [
    {
      id: 'exercise-1',
      name: 'Push Up',
      muscle_group: 'chest',
      thumbnail_url: 'https://example.com/pushup.jpg',
      description: 'Basic push up exercise',
      instructions: 'Get in plank position and push up',
    },
    {
      id: 'exercise-2',
      name: 'Squat',
      muscle_group: 'legs',
      thumbnail_url: 'https://example.com/squat.jpg',
      description: 'Basic squat exercise',
      instructions: 'Stand and squat down',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseAuth.mockReturnValue({
      user: mockInstructor,
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

    // Mock WorkoutService methods
    mockWorkoutService.getInstructorWorkouts.mockResolvedValue([])
    mockWorkoutService.getInstructorWorkoutStats.mockResolvedValue({
      totalWorkouts: 0,
      totalStudents: 2,
      recentWorkouts: 0,
    })
    mockWorkoutService.createWorkout.mockResolvedValue({
      id: 'workout-123',
      name: 'Test Workout',
      description: 'Test Description',
      student_id: 'student-1',
      instructor_id: 'instructor-123',
      exercises: [],
      created_at: '2025-01-18T10:00:00Z',
      updated_at: '2025-01-18T10:00:00Z',
    } as any)
  })

  const renderWithNavigation = (component: React.ReactElement) => {
    return render(<NavigationContainer>{component}</NavigationContainer>)
  }

  describe('Complete Workout Creation Flow', () => {
    it('should create workout from instructor home screen', async () => {
      renderWithNavigation(<InstructorHomeScreen />)

      // Wait for screen to load
      await waitFor(() => {
        expect(screen.getByText('Bem-vindo, Test Instructor')).toBeTruthy()
      })

      // Click create workout button
      const createButton = screen.getByText('Criar Treino')
      fireEvent.press(createButton)

      // Modal should open
      await waitFor(() => {
        expect(screen.getByText('Criar Treino')).toBeTruthy()
      })

      // Fill workout name
      const nameInput = screen.getByPlaceholderText('Nome do treino')
      fireEvent.changeText(nameInput, 'Treino de Peito')

      // Fill description
      const descriptionInput = screen.getByPlaceholderText('Descrição (opcional)')
      fireEvent.changeText(descriptionInput, 'Treino focado em peitoral')

      // Select student
      const studentOption = screen.getByText('Student One')
      fireEvent.press(studentOption)

      // Go to next step
      const nextButton = screen.getByText('Próximo')
      fireEvent.press(nextButton)

      // Should be on exercise selection step
      await waitFor(() => {
        expect(screen.getByText('Selecionar Exercícios')).toBeTruthy()
      })

      // Select exercises (mock exercise selection)
      const exerciseItem = screen.getByText('Push Up')
      fireEvent.press(exerciseItem)

      // Go to configuration step
      const nextButton2 = screen.getByText('Próximo')
      fireEvent.press(nextButton2)

      // Should be on exercise configuration step
      await waitFor(() => {
        expect(screen.getByText('Configurar Exercícios')).toBeTruthy()
      })

      // Configure exercise
      const setsInput = screen.getByPlaceholderText('Séries')
      fireEvent.changeText(setsInput, '3')

      const repsInput = screen.getByPlaceholderText('Repetições')
      fireEvent.changeText(repsInput, '10-12')

      const restInput = screen.getByPlaceholderText('Descanso (segundos)')
      fireEvent.changeText(restInput, '60')

      // Create workout
      const createWorkoutButton = screen.getByText('Criar Treino')
      fireEvent.press(createWorkoutButton)

      // Verify workout creation
      await waitFor(() => {
        expect(mockWorkoutService.createWorkout).toHaveBeenCalledWith(
          'instructor-123',
          expect.objectContaining({
            name: 'Treino de Peito',
            description: 'Treino focado em peitoral',
            studentId: 'student-1',
            exercises: expect.arrayContaining([
              expect.objectContaining({
                exerciseId: 'exercise-1',
                sets: 3,
                reps: '10-12',
                restSeconds: 60,
              }),
            ]),
          })
        )
      })

      // Modal should close and show success message
      await waitFor(() => {
        expect(screen.getByText('Treino criado com sucesso!')).toBeTruthy()
      })
    })

    it('should handle workout creation errors gracefully', async () => {
      // Mock service to throw error
      mockWorkoutService.createWorkout.mockRejectedValue(new Error('Failed to create workout'))

      renderWithNavigation(<InstructorHomeScreen />)

      // Open create workout modal
      const createButton = screen.getByText('Criar Treino')
      fireEvent.press(createButton)

      // Fill required fields
      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Nome do treino')
        fireEvent.changeText(nameInput, 'Test Workout')
      })

      const studentOption = screen.getByText('Student One')
      fireEvent.press(studentOption)

      // Skip to final step and attempt creation
      const nextButton = screen.getByText('Próximo')
      fireEvent.press(nextButton)

      await waitFor(() => {
        const createWorkoutButton = screen.getByText('Criar Treino')
        fireEvent.press(createWorkoutButton)
      })

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Failed to create workout')).toBeTruthy()
      })

      // Should show retry button
      expect(screen.getByText('Tentar Novamente')).toBeTruthy()
    })

    it('should validate required fields before creation', async () => {
      renderWithNavigation(<InstructorHomeScreen />)

      // Open create workout modal
      const createButton = screen.getByText('Criar Treino')
      fireEvent.press(createButton)

      // Try to proceed without filling required fields
      const nextButton = screen.getByText('Próximo')
      fireEvent.press(nextButton)

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('Por favor, preencha todos os campos obrigatórios.')).toBeTruthy()
      })

      // Should not proceed to next step
      expect(screen.getByText('Informações Básicas')).toBeTruthy()
    })
  })

  describe('Student Workout Viewing Flow', () => {
    it('should display workouts for student', async () => {
      // Mock student user
      mockUseAuth.mockReturnValue({
        user: mockStudent,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn(),
      })

      const mockWorkouts = [
        {
          id: 'workout-1',
          name: 'Treino de Peito',
          description: 'Treino focado em peitoral',
          student_id: 'student-123',
          instructor_id: 'instructor-123',
          exercises: [
            {
              id: 'we-1',
              exercise_id: 'exercise-1',
              sets: 3,
              reps: '10-12',
              rest_seconds: 60,
              order_index: 1,
              exercise: mockExercises[0],
            },
          ],
          instructor: mockInstructor,
          created_at: '2025-01-18T10:00:00Z',
          updated_at: '2025-01-18T10:00:00Z',
        },
      ]

      mockWorkoutService.getStudentWorkouts.mockResolvedValue(mockWorkouts as any)

      renderWithNavigation(<WorkoutListScreen />)

      // Should load and display workouts
      await waitFor(() => {
        expect(screen.getByText('Treino de Peito')).toBeTruthy()
      })

      expect(screen.getByText('Instrutor: Test Instructor')).toBeTruthy()
      expect(screen.getByText('1 exercício')).toBeTruthy()
    })

    it('should open workout details when workout is pressed', async () => {
      mockUseAuth.mockReturnValue({
        user: mockStudent,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn(),
      })

      const mockWorkout = {
        id: 'workout-1',
        name: 'Treino de Peito',
        description: 'Treino focado em peitoral',
        student_id: 'student-123',
        instructor_id: 'instructor-123',
        exercises: [
          {
            id: 'we-1',
            exercise_id: 'exercise-1',
            sets: 3,
            reps: '10-12',
            rest_seconds: 60,
            order_index: 1,
            exercise: mockExercises[0],
          },
        ],
        instructor: mockInstructor,
        created_at: '2025-01-18T10:00:00Z',
        updated_at: '2025-01-18T10:00:00Z',
      }

      mockWorkoutService.getStudentWorkouts.mockResolvedValue([mockWorkout] as any)
      mockWorkoutService.getWorkoutDetails.mockResolvedValue(mockWorkout as any)

      renderWithNavigation(<WorkoutListScreen />)

      // Wait for workouts to load
      await waitFor(() => {
        expect(screen.getByText('Treino de Peito')).toBeTruthy()
      })

      // Press on workout to open details
      const workoutCard = screen.getByText('Treino de Peito')
      fireEvent.press(workoutCard)

      // Should open workout details modal
      await waitFor(() => {
        expect(screen.getByText('Detalhes do Treino')).toBeTruthy()
      })

      expect(screen.getByText('Push Up')).toBeTruthy()
      expect(screen.getByText('3 séries')).toBeTruthy()
      expect(screen.getByText('10-12 repetições')).toBeTruthy()
    })

    it('should handle empty workout list', async () => {
      mockUseAuth.mockReturnValue({
        user: mockStudent,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn(),
      })

      mockWorkoutService.getStudentWorkouts.mockResolvedValue([])

      renderWithNavigation(<WorkoutListScreen />)

      // Should show empty state
      await waitFor(() => {
        expect(screen.getByText('Nenhum treino encontrado')).toBeTruthy()
      })

      expect(
        screen.getByText('Você ainda não possui treinos criados pelo seu instrutor.')
      ).toBeTruthy()
    })
  })

  describe('Workout Management Flow', () => {
    it('should allow instructor to edit existing workout', async () => {
      const mockExistingWorkout = {
        id: 'workout-123',
        name: 'Treino Original',
        description: 'Descrição original',
        student_id: 'student-1',
        instructor_id: 'instructor-123',
        exercises: [],
        created_at: '2025-01-18T10:00:00Z',
        updated_at: '2025-01-18T10:00:00Z',
      }

      mockWorkoutService.getInstructorWorkouts.mockResolvedValue([mockExistingWorkout] as any)
      mockWorkoutService.updateWorkout.mockResolvedValue({
        ...mockExistingWorkout,
        name: 'Treino Atualizado',
      } as any)

      renderWithNavigation(<InstructorHomeScreen />)

      // Wait for workouts to load
      await waitFor(() => {
        expect(screen.getByText('Treino Original')).toBeTruthy()
      })

      // Press edit button
      const editButton = screen.getByTestId('edit-workout-workout-123')
      fireEvent.press(editButton)

      // Should open edit modal
      await waitFor(() => {
        expect(screen.getByText('Editar Treino')).toBeTruthy()
      })

      // Update workout name
      const nameInput = screen.getByDisplayValue('Treino Original')
      fireEvent.changeText(nameInput, 'Treino Atualizado')

      // Save changes
      const saveButton = screen.getByText('Salvar Alterações')
      fireEvent.press(saveButton)

      // Verify update call
      await waitFor(() => {
        expect(mockWorkoutService.updateWorkout).toHaveBeenCalledWith(
          'workout-123',
          'instructor-123',
          expect.objectContaining({
            name: 'Treino Atualizado',
          })
        )
      })
    })

    it('should allow instructor to delete workout', async () => {
      const mockExistingWorkout = {
        id: 'workout-123',
        name: 'Treino para Deletar',
        student_id: 'student-1',
        instructor_id: 'instructor-123',
        exercises: [],
        created_at: '2025-01-18T10:00:00Z',
        updated_at: '2025-01-18T10:00:00Z',
      }

      mockWorkoutService.getInstructorWorkouts.mockResolvedValue([mockExistingWorkout] as any)
      mockWorkoutService.deleteWorkout.mockResolvedValue()

      renderWithNavigation(<InstructorHomeScreen />)

      // Wait for workouts to load
      await waitFor(() => {
        expect(screen.getByText('Treino para Deletar')).toBeTruthy()
      })

      // Press delete button
      const deleteButton = screen.getByTestId('delete-workout-workout-123')
      fireEvent.press(deleteButton)

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText('Confirmar Exclusão')).toBeTruthy()
      })

      // Confirm deletion
      const confirmButton = screen.getByText('Excluir')
      fireEvent.press(confirmButton)

      // Verify delete call
      await waitFor(() => {
        expect(mockWorkoutService.deleteWorkout).toHaveBeenCalledWith(
          'workout-123',
          'instructor-123'
        )
      })
    })

    it('should allow instructor to duplicate workout', async () => {
      const mockExistingWorkout = {
        id: 'workout-123',
        name: 'Treino Original',
        student_id: 'student-1',
        instructor_id: 'instructor-123',
        exercises: [
          {
            exercise_id: 'exercise-1',
            sets: 3,
            reps: '10',
            rest_seconds: 60,
            order_index: 1,
          },
        ],
        created_at: '2025-01-18T10:00:00Z',
        updated_at: '2025-01-18T10:00:00Z',
      }

      const mockDuplicatedWorkout = {
        id: 'workout-456',
        name: 'Treino Original (Cópia)',
        student_id: 'student-2',
        instructor_id: 'instructor-123',
        exercises: mockExistingWorkout.exercises,
        created_at: '2025-01-18T11:00:00Z',
        updated_at: '2025-01-18T11:00:00Z',
      }

      mockWorkoutService.getInstructorWorkouts.mockResolvedValue([mockExistingWorkout] as any)
      mockWorkoutService.duplicateWorkout.mockResolvedValue(mockDuplicatedWorkout as any)

      renderWithNavigation(<InstructorHomeScreen />)

      // Wait for workouts to load
      await waitFor(() => {
        expect(screen.getByText('Treino Original')).toBeTruthy()
      })

      // Press duplicate button
      const duplicateButton = screen.getByTestId('duplicate-workout-workout-123')
      fireEvent.press(duplicateButton)

      // Should show duplicate options
      await waitFor(() => {
        expect(screen.getByText('Duplicar Treino')).toBeTruthy()
      })

      // Select different student
      const studentOption = screen.getByText('Student Two')
      fireEvent.press(studentOption)

      // Confirm duplication
      const duplicateConfirmButton = screen.getByText('Duplicar')
      fireEvent.press(duplicateConfirmButton)

      // Verify duplicate call
      await waitFor(() => {
        expect(mockWorkoutService.duplicateWorkout).toHaveBeenCalledWith(
          'workout-123',
          'instructor-123',
          'student-2',
          undefined
        )
      })
    })
  })

  describe('Performance and Loading States', () => {
    it('should show loading states during workout operations', async () => {
      // Mock slow service response
      mockWorkoutService.createWorkout.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )

      renderWithNavigation(<InstructorHomeScreen />)

      // Open create workout modal and fill form
      const createButton = screen.getByText('Criar Treino')
      fireEvent.press(createButton)

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Nome do treino')
        fireEvent.changeText(nameInput, 'Test Workout')
      })

      const studentOption = screen.getByText('Student One')
      fireEvent.press(studentOption)

      // Attempt to create workout
      const nextButton = screen.getByText('Próximo')
      fireEvent.press(nextButton)

      await waitFor(() => {
        const createWorkoutButton = screen.getByText('Criar Treino')
        fireEvent.press(createWorkoutButton)
      })

      // Should show loading indicator
      expect(screen.getByTestId('loading-indicator')).toBeTruthy()

      // Form should be disabled during loading
      const nameInput = screen.getByPlaceholderText('Nome do treino')
      expect(nameInput.props.editable).toBe(false)
    })

    it('should handle network errors gracefully', async () => {
      mockWorkoutService.getInstructorWorkouts.mockRejectedValue(new Error('Network error'))

      renderWithNavigation(<InstructorHomeScreen />)

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar treinos')).toBeTruthy()
      })

      // Should show retry button
      expect(screen.getByText('Tentar Novamente')).toBeTruthy()
    })
  })

  describe('Search and Filter Functionality', () => {
    it('should filter workouts by search term', async () => {
      const mockWorkouts = [
        {
          id: 'workout-1',
          name: 'Treino de Peito',
          student_id: 'student-1',
          instructor_id: 'instructor-123',
          exercises: [],
        },
        {
          id: 'workout-2',
          name: 'Treino de Pernas',
          student_id: 'student-2',
          instructor_id: 'instructor-123',
          exercises: [],
        },
      ]

      mockWorkoutService.getInstructorWorkouts.mockResolvedValue(mockWorkouts as any)
      mockWorkoutService.searchInstructorWorkouts.mockResolvedValue([mockWorkouts[0]] as any)

      renderWithNavigation(<InstructorHomeScreen />)

      // Wait for workouts to load
      await waitFor(() => {
        expect(screen.getByText('Treino de Peito')).toBeTruthy()
        expect(screen.getByText('Treino de Pernas')).toBeTruthy()
      })

      // Search for specific workout
      const searchInput = screen.getByPlaceholderText('Buscar treinos...')
      fireEvent.changeText(searchInput, 'Peito')

      // Should filter results
      await waitFor(() => {
        expect(screen.getByText('Treino de Peito')).toBeTruthy()
        expect(screen.queryByText('Treino de Pernas')).toBeNull()
      })
    })

    it('should filter workouts by student', async () => {
      const mockWorkouts = [
        {
          id: 'workout-1',
          name: 'Treino 1',
          student_id: 'student-1',
          instructor_id: 'instructor-123',
          exercises: [],
          student: mockStudents[0],
        },
        {
          id: 'workout-2',
          name: 'Treino 2',
          student_id: 'student-2',
          instructor_id: 'instructor-123',
          exercises: [],
          student: mockStudents[1],
        },
      ]

      mockWorkoutService.getInstructorWorkouts.mockResolvedValue(mockWorkouts as any)
      mockWorkoutService.searchInstructorWorkouts.mockResolvedValue([mockWorkouts[0]] as any)

      renderWithNavigation(<InstructorHomeScreen />)

      // Wait for workouts to load
      await waitFor(() => {
        expect(screen.getByText('Treino 1')).toBeTruthy()
        expect(screen.getByText('Treino 2')).toBeTruthy()
      })

      // Filter by student
      const studentFilter = screen.getByText('Todos os Alunos')
      fireEvent.press(studentFilter)

      const studentOption = screen.getByText('Student One')
      fireEvent.press(studentOption)

      // Should filter results
      await waitFor(() => {
        expect(screen.getByText('Treino 1')).toBeTruthy()
        expect(screen.queryByText('Treino 2')).toBeNull()
      })
    })
  })
})
