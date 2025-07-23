import React from 'react'
import { render, fireEvent, waitFor, screen, Platform } from '@testing-library/react-native'
import { Alert } from 'react-native'
import CreateWorkoutModal from '../CreateWorkoutModal'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/context/ThemeContext'
import { useWorkoutOperations } from '../../workout'
import { WorkoutError, WorkoutErrorType } from '@/services/api/WorkoutService'
import * as Haptics from 'expo-haptics'

// Mock dependencies
jest.mock('@/hooks/useAuth')
jest.mock('@/context/ThemeContext')
jest.mock('../../workout')
jest.mock('expo-haptics')
jest.mock('@/utils/accessibility', () => ({
  announceForAccessibility: jest.fn(),
  getFieldAccessibilityProps: jest.fn(() => ({})),
  getButtonAccessibilityProps: jest.fn(() => ({})),
  getModalAccessibilityProps: jest.fn(() => ({})),
  getProgressAccessibilityProps: jest.fn(() => ({})),
  getListItemAccessibilityProps: jest.fn(() => ({})),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>
const mockUseWorkoutOperations = useWorkoutOperations as jest.MockedFunction<
  typeof useWorkoutOperations
>
const mockHaptics = Haptics as jest.Mocked<typeof Haptics>

describe('CreateWorkoutModal', () => {
  const mockUser = {
    id: 'instructor-123',
    email: 'instructor@test.com',
    role: 'instructor' as const,
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

  const mockInstructorStudents = [
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
    {
      id: 'student-2',
      full_name: 'Student Two',
      email: 'student2@test.com',
      role: 'student' as const,
      instructor_id: 'instructor-123',
      created_at: '2025-01-18T08:00:00Z',
      updated_at: '2025-01-18T08:00:00Z',
      is_active: true,
      avatar_url: null,
      phone: undefined,
    },
  ]

  const mockWorkoutOperations = {
    createWorkout: jest.fn(),
    updateWorkout: jest.fn(),
    deleteWorkout: jest.fn(),
    getInstructorWorkouts: jest.fn(),
    getStudentWorkouts: jest.fn(),
    getWorkoutDetails: jest.fn(),
    searchInstructorWorkouts: jest.fn(),
    duplicateWorkout: jest.fn(),
    loading: false,
    error: null as WorkoutError | null,
    retryCount: 0,
    canRetry: true,
    getPersistedFormData: jest.fn(),
    clearPersistedFormData: jest.fn(),
    persistFormData: jest.fn(),
    retry: jest.fn(),
    clearError: jest.fn(),
  }

  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
    instructorStudents: mockInstructorStudents,
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
    })

    mockUseTheme.mockReturnValue({
      theme: mockTheme as any,
      isDark: false,
      toggleTheme: jest.fn(),
    })

    mockUseWorkoutOperations.mockReturnValue(mockWorkoutOperations)

    // Mock Haptics
    mockHaptics.selectionAsync.mockResolvedValue()
    mockHaptics.notificationAsync.mockResolvedValue()
  })

  describe('Rendering', () => {
    it('should render modal when visible', () => {
      render(<CreateWorkoutModal {...defaultProps} />)

      expect(screen.getByText('Criar Treino')).toBeTruthy()
      expect(screen.getByPlaceholderText('Nome do treino')).toBeTruthy()
      expect(screen.getByPlaceholderText('Descrição (opcional)')).toBeTruthy()
    })

    it('should not render modal when not visible', () => {
      render(<CreateWorkoutModal {...defaultProps} visible={false} />)

      expect(screen.queryByText('Criar Treino')).toBeNull()
    })

    it('should render student selection options', () => {
      render(<CreateWorkoutModal {...defaultProps} />)

      expect(screen.getByText('Student One')).toBeTruthy()
      expect(screen.getByText('Student Two')).toBeTruthy()
    })
  })

  describe('Form Validation', () => {
    it('should show error when workout name is empty', async () => {
      render(<CreateWorkoutModal {...defaultProps} />)

      const nextButton = screen.getByText('Próximo')
      fireEvent.press(nextButton)

      await waitFor(() => {
        expect(screen.getByText('Por favor, preencha todos os campos obrigatórios.')).toBeTruthy()
      })
    })

    it('should show error when no student is selected', async () => {
      render(<CreateWorkoutModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('Nome do treino')
      fireEvent.changeText(nameInput, 'Test Workout')

      const nextButton = screen.getByText('Próximo')
      fireEvent.press(nextButton)

      await waitFor(() => {
        expect(screen.getByText('Por favor, preencha todos os campos obrigatórios.')).toBeTruthy()
      })
    })

    it('should proceed to next step when form is valid', async () => {
      render(<CreateWorkoutModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('Nome do treino')
      fireEvent.changeText(nameInput, 'Test Workout')

      const studentOption = screen.getByText('Student One')
      fireEvent.press(studentOption)

      const nextButton = screen.getByText('Próximo')
      fireEvent.press(nextButton)

      await waitFor(() => {
        expect(screen.getByText('Selecionar Exercícios')).toBeTruthy()
      })
    })
  })

  describe('Student Selection', () => {
    it('should select student when pressed', async () => {
      render(<CreateWorkoutModal {...defaultProps} />)

      const studentOption = screen.getByText('Student One')
      fireEvent.press(studentOption)

      await waitFor(() => {
        expect(mockHaptics.selectionAsync).toHaveBeenCalled()
      })
    })
  })

  describe('Workout Creation', () => {
    it('should create workout successfully', async () => {
      const mockCreatedWorkout = {
        id: 'workout-123',
        name: 'Test Workout',
        student_id: 'student-1',
        exercises: [],
      }

      mockWorkoutOperations.createWorkout.mockResolvedValue(mockCreatedWorkout as any)

      render(<CreateWorkoutModal {...defaultProps} />)

      // Fill form
      const nameInput = screen.getByPlaceholderText('Nome do treino')
      fireEvent.changeText(nameInput, 'Test Workout')

      const studentOption = screen.getByText('Student One')
      fireEvent.press(studentOption)

      // Navigate through steps and create workout
      const nextButton = screen.getByText('Próximo')
      fireEvent.press(nextButton)

      await waitFor(() => {
        expect(screen.getByText('Selecionar Exercícios')).toBeTruthy()
      })

      // Create workout
      const createButton = screen.getByText('Criar Treino')
      fireEvent.press(createButton)

      await waitFor(() => {
        expect(mockWorkoutOperations.createWorkout).toHaveBeenCalledWith(
          'instructor-123',
          expect.objectContaining({
            name: 'Test Workout',
            studentId: 'student-1',
          })
        )
        expect(defaultProps.onSuccess).toHaveBeenCalledWith(mockCreatedWorkout)
      })
    })
  })

  describe('Error Handling', () => {
    it('should display operation errors', () => {
      const error = new WorkoutError(WorkoutErrorType.NETWORK_ERROR, 'Something went wrong')
      mockUseWorkoutOperations.mockReturnValue({
        ...mockWorkoutOperations,
        error,
      })

      render(<CreateWorkoutModal {...defaultProps} />)

      expect(screen.getByText('Something went wrong')).toBeTruthy()
    })

    it('should provide retry functionality', () => {
      const error = new WorkoutError(WorkoutErrorType.NETWORK_ERROR, 'Network error')
      mockUseWorkoutOperations.mockReturnValue({
        ...mockWorkoutOperations,
        error,
      })

      render(<CreateWorkoutModal {...defaultProps} />)

      const retryButton = screen.getByText('Tentar Novamente')
      fireEvent.press(retryButton)

      expect(mockWorkoutOperations.retry).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      render(<CreateWorkoutModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('Nome do treino')
      expect(nameInput.props.accessibilityLabel).toBeDefined()

      const nextButton = screen.getByText('Próximo')
      expect(nextButton.props.accessibilityRole).toBe('button')
    })

    it('should provide haptic feedback for interactions', async () => {
      render(<CreateWorkoutModal {...defaultProps} />)

      const studentOption = screen.getByText('Student One')
      fireEvent.press(studentOption)

      await waitFor(() => {
        expect(mockHaptics.selectionAsync).toHaveBeenCalled()
      })
    })
  })

  describe('Modal Behavior', () => {
    it('should close modal when close button is pressed', () => {
      render(<CreateWorkoutModal {...defaultProps} />)

      const closeButton = screen.getByText('Cancelar')
      fireEvent.press(closeButton)

      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('should handle keyboard avoiding view on iOS', () => {
      const originalPlatform = Platform.OS
      Platform.OS = 'ios'

      render(<CreateWorkoutModal {...defaultProps} />)

      expect(screen.getByTestId('keyboard-avoiding-view')).toBeTruthy()

      Platform.OS = originalPlatform
    })
  })
})
