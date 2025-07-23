import React from 'react'
import { render } from '@testing-library/react-native'
import { AccessibilityInfo } from 'react-native'
import CreateWorkoutModal from '../CreateWorkoutModal'
import WorkoutDetailsModal from '../WorkoutDetailsModal'
import {
  announceForAccessibility,
  isScreenReaderEnabled,
  getFieldAccessibilityProps,
  getButtonAccessibilityProps,
  meetsContrastRequirements,
  MIN_TOUCH_TARGET_SIZE,
} from '@/utils/accessibility'

// Mock AccessibilityInfo
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  AccessibilityInfo: {
    announceForAccessibility: jest.fn(),
    isScreenReaderEnabled: jest.fn(),
    isReduceMotionEnabled: jest.fn(),
  },
}))

// Mock workout operations
jest.mock('@/hooks/useWorkoutOperations', () => ({
  useWorkoutOperations: () => ({
    createWorkout: jest.fn(),
    updateWorkout: jest.fn(),
    getWorkoutDetails: jest.fn(),
    loading: false,
    error: null,
    retry: jest.fn(),
    clearError: jest.fn(),
    getPersistedFormData: jest.fn(),
    clearPersistedFormData: jest.fn(),
  }),
}))

// Mock auth
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'instructor-1', role: 'instructor' },
  }),
}))

describe('Accessibility Tests', () => {
  const mockInstructorStudents = [
    {
      id: 'student-1',
      full_name: 'João Silva',
      email: 'joao@example.com',
      phone: '(11) 99999-9999',
      avatar_url: undefined,
      instructor_id: 'instructor-1',
      role: 'student' as const,
      created_at: '2025-01-18T09:00:00Z',
      updated_at: '2025-01-18T09:00:00Z',
      is_active: true,
    },
  ]

  const mockWorkout = {
    id: 'workout-1',
    name: 'Treino de Peito',
    description: 'Treino focado em peitoral',
    student_id: 'student-1',
    instructor_id: 'instructor-1',
    created_at: '2025-01-18T10:00:00Z',
    updated_at: '2025-01-18T10:00:00Z',
    exercises: [
      {
        id: 'we-1',
        workout_id: 'workout-1',
        exercise_id: 'exercise-1',
        sets: 3,
        reps: '10-12',
        rest_seconds: 60,
        order_index: 1,
        notes: 'Foco na contração',
        exercise: {
          id: 'exercise-1',
          name: 'Supino Reto',
          description: 'Exercício para peitoral',
          muscle_group: 'Peito',
          video_url: undefined,
          thumbnail_url: 'https://example.com/supino.jpg',
          created_by: 'instructor-1',
          created_at: '2025-01-18T07:00:00Z',
        },
      },
    ],
    student: mockInstructorStudents[0],
    instructor: {
      id: 'instructor-1',
      full_name: 'Maria Santos',
      email: 'maria@example.com',
      phone: '(11) 88888-8888',
      avatar_url: undefined,
      instructor_id: undefined,
      role: 'instructor' as const,
      created_at: '2025-01-18T08:00:00Z',
      updated_at: '2025-01-18T08:00:00Z',
      is_active: true,
    },
  }

  describe('CreateWorkoutModal Accessibility', () => {
    const defaultProps = {
      visible: true,
      onClose: jest.fn(),
      onSuccess: jest.fn(),
      instructorStudents: mockInstructorStudents,
    }

    it('should have proper modal accessibility attributes', () => {
      const { getByLabelText } = render(<CreateWorkoutModal {...defaultProps} />)

      // Modal should be accessible and have proper role
      expect(() => getByLabelText(/criar novo treino/i)).not.toThrow()
    })

    it('should have accessible form fields', () => {
      const { getByLabelText } = render(<CreateWorkoutModal {...defaultProps} />)

      // Required field should be properly labeled
      expect(() => getByLabelText(/nome do treino.*obrigatório/i)).not.toThrow()

      // Optional field should be properly labeled
      expect(() => getByLabelText(/descrição do treino/i)).not.toThrow()
    })

    it('should have accessible student selection', () => {
      const { getByLabelText } = render(<CreateWorkoutModal {...defaultProps} />)

      // Student cards should be accessible
      expect(() => getByLabelText(/joão silva.*1 de 1/i)).not.toThrow()
    })

    it('should have accessible navigation buttons', () => {
      const { getByLabelText } = render(<CreateWorkoutModal {...defaultProps} />)

      // Next button should be accessible
      expect(() => getByLabelText(/próxima etapa/i)).not.toThrow()
    })
  })

  describe('WorkoutDetailsModal Accessibility', () => {
    const defaultProps = {
      visible: true,
      workout: mockWorkout,
      onClose: jest.fn(),
    }

    it('should have proper modal accessibility attributes', () => {
      const { getByLabelText } = render(<WorkoutDetailsModal {...defaultProps} />)

      // Modal should be accessible
      expect(() => getByLabelText(/detalhes do treino/i)).not.toThrow()
    })

    it('should have accessible exercise information', () => {
      const { getByLabelText } = render(<WorkoutDetailsModal {...defaultProps} />)

      // Exercise cards should be accessible with full information
      expect(() =>
        getByLabelText(/exercício 1.*supino reto.*3 séries.*10-12 repetições/i)
      ).not.toThrow()
    })

    it('should have accessible exercise images', () => {
      const { getByLabelText } = render(<WorkoutDetailsModal {...defaultProps} />)

      // Exercise images should have proper alt text
      expect(() => getByLabelText(/imagem demonstrativa do exercício supino reto/i)).not.toThrow()
    })
  })

  describe('Accessibility Utilities', () => {
    it('should announce messages for screen readers', () => {
      const message = 'Treino criado com sucesso'
      announceForAccessibility(message)

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(message)
    })

    it('should check screen reader status', async () => {
      ;(AccessibilityInfo.isScreenReaderEnabled as jest.Mock).mockResolvedValue(true)

      const isEnabled = await isScreenReaderEnabled()
      expect(isEnabled).toBe(true)
    })

    it('should generate proper field accessibility props', () => {
      const props = getFieldAccessibilityProps('Nome', true, false)

      expect(props.accessibilityLabel).toBe('Nome, obrigatório')
      expect(props.accessibilityHint).toBe('Campo obrigatório')
      expect(props.accessibilityState.invalid).toBe(false)
    })

    it('should generate proper field accessibility props with error', () => {
      const props = getFieldAccessibilityProps('Nome', true, true, 'Campo obrigatório')

      expect(props.accessibilityLabel).toBe('Nome, obrigatório')
      expect(props.accessibilityHint).toBe('Erro: Campo obrigatório')
      expect(props.accessibilityState.invalid).toBe(true)
    })

    it('should generate proper button accessibility props', () => {
      const props = getButtonAccessibilityProps('Salvar', false, false)

      expect(props.accessibilityLabel).toBe('Salvar')
      expect(props.accessibilityState.disabled).toBe(false)
      expect(props.accessibilityState.busy).toBe(false)
    })

    it('should generate proper button accessibility props when loading', () => {
      const props = getButtonAccessibilityProps('Salvar', true, false)

      expect(props.accessibilityLabel).toBe('Salvar, carregando')
      expect(props.accessibilityHint).toBe('Aguarde, processando')
      expect(props.accessibilityState.busy).toBe(true)
    })

    it('should check color contrast requirements', () => {
      // High contrast (should pass AA)
      expect(meetsContrastRequirements('#000000', '#FFFFFF', 'AA')).toBe(true)

      // Low contrast (should fail AA)
      expect(meetsContrastRequirements('#888888', '#999999', 'AA')).toBe(false)
    })

    it('should define minimum touch target size', () => {
      expect(MIN_TOUCH_TARGET_SIZE).toBeGreaterThanOrEqual(44)
    })
  })

  describe('Error Handling', () => {
    it('should handle screen reader check errors gracefully', async () => {
      ;(AccessibilityInfo.isScreenReaderEnabled as jest.Mock).mockRejectedValue(
        new Error('Test error')
      )

      const isEnabled = await isScreenReaderEnabled()
      expect(isEnabled).toBe(false)
    })
  })
})
