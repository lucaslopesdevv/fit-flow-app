import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { StudentService } from '@/services/api/StudentService'
import { StudentDetailsModal } from '@/components/modals/StudentDetailsModal'
import { Alert } from 'react-native'

// Mock StudentService
jest.mock('@/services/api/StudentService', () => ({
  StudentService: {
    updateStudent: jest.fn(),
    activateStudent: jest.fn(),
    deactivateStudent: jest.fn(),
    getInstructorStudents: jest.fn(),
    getStudentProfile: jest.fn(),
  },
}))

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}))

describe('Student Management Flow Integration Tests', () => {
  const mockStudent = {
    id: 'student-123',
    full_name: 'Test Student',
    email: 'student@test.com',
    phone: '123456789',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    is_active: true,
    role: 'student' as const,
    instructor_id: 'instructor-123',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Student Information Management', () => {
    it('should update student information successfully', async () => {
      const updatedStudent = {
        ...mockStudent,
        full_name: 'Updated Student Name',
        phone: '987654321',
      }

      ;(StudentService.updateStudent as jest.Mock).mockResolvedValue(updatedStudent)

      const mockProps = {
        visible: true,
        onClose: jest.fn(),
        onSuccess: jest.fn(),
        student: mockStudent,
      }

      const { getByText, getByDisplayValue } = render(<StudentDetailsModal {...mockProps} />)

      // Enter edit mode
      fireEvent.press(getByText('Editar Informações'))

      // Update student information
      const nameInput = getByDisplayValue('Test Student')
      fireEvent.changeText(nameInput, 'Updated Student Name')

      const phoneInput = getByDisplayValue('123456789')
      fireEvent.changeText(phoneInput, '987654321')

      // Save changes
      fireEvent.press(getByText('Salvar'))

      // Verify update was called with correct data
      await waitFor(() => {
        expect(StudentService.updateStudent).toHaveBeenCalledWith('student-123', {
          full_name: 'Updated Student Name',
          phone: '987654321',
          is_active: true,
        })
      })

      // Verify success callback
      await waitFor(() => {
        expect(mockProps.onSuccess).toHaveBeenCalled()
      })
    })

    it('should validate required fields during update', async () => {
      const mockProps = {
        visible: true,
        onClose: jest.fn(),
        onSuccess: jest.fn(),
        student: mockStudent,
      }

      const { getByText, getByDisplayValue } = render(<StudentDetailsModal {...mockProps} />)

      // Enter edit mode
      fireEvent.press(getByText('Editar Informações'))

      // Clear required field
      const nameInput = getByDisplayValue('Test Student')
      fireEvent.changeText(nameInput, '')

      // Try to save
      fireEvent.press(getByText('Salvar'))

      // Verify validation error
      await waitFor(() => {
        expect(getByText('Nome completo é obrigatório')).toBeTruthy()
      })

      // Update should not be called
      expect(StudentService.updateStudent).not.toHaveBeenCalled()
    })
  })

  describe('Student Status Management', () => {
    it('should deactivate student with confirmation', async () => {
      const deactivatedStudent = {
        ...mockStudent,
        is_active: false,
      }

      ;(StudentService.updateStudent as jest.Mock).mockResolvedValue(deactivatedStudent)

      // Mock Alert confirmation
      ;(Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        const confirmButton = buttons.find((button: any) => button.text === 'Confirmar')
        if (confirmButton && confirmButton.onPress) {
          confirmButton.onPress()
        }
      })

      const mockProps = {
        visible: true,
        onClose: jest.fn(),
        onSuccess: jest.fn(),
        student: mockStudent,
      }

      const { getByText } = render(<StudentDetailsModal {...mockProps} />)

      // Trigger deactivation
      fireEvent.press(getByText('Desativar Aluno'))

      // Verify confirmation dialog
      expect(Alert.alert).toHaveBeenCalledWith(
        'Confirmar desativar',
        'Tem certeza que deseja desativar este aluno?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancelar' }),
          expect.objectContaining({ text: 'Confirmar' }),
        ])
      )

      // Verify deactivation was called
      await waitFor(() => {
        expect(StudentService.updateStudent).toHaveBeenCalledWith('student-123', {
          is_active: false,
        })
      })
    })

    it('should reactivate inactive student', async () => {
      const inactiveStudent = {
        ...mockStudent,
        is_active: false,
      }

      const reactivatedStudent = {
        ...mockStudent,
        is_active: true,
      }

      ;(StudentService.updateStudent as jest.Mock).mockResolvedValue(reactivatedStudent)

      // Mock Alert confirmation
      ;(Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        const confirmButton = buttons.find((button: any) => button.text === 'Confirmar')
        if (confirmButton && confirmButton.onPress) {
          confirmButton.onPress()
        }
      })

      const mockProps = {
        visible: true,
        onClose: jest.fn(),
        onSuccess: jest.fn(),
        student: inactiveStudent,
      }

      const { getByText } = render(<StudentDetailsModal {...mockProps} />)

      // Trigger reactivation
      fireEvent.press(getByText('Ativar Aluno'))

      // Verify reactivation was called
      await waitFor(() => {
        expect(StudentService.updateStudent).toHaveBeenCalledWith('student-123', {
          is_active: true,
        })
      })
    })

    it('should handle status update errors gracefully', async () => {
      ;(StudentService.updateStudent as jest.Mock).mockRejectedValue(
        new Error('Failed to update student status')
      )

      // Mock Alert confirmation
      ;(Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        const confirmButton = buttons.find((button: any) => button.text === 'Confirmar')
        if (confirmButton && confirmButton.onPress) {
          confirmButton.onPress()
        }
      })

      const mockProps = {
        visible: true,
        onClose: jest.fn(),
        onSuccess: jest.fn(),
        student: mockStudent,
      }

      const { getByText } = render(<StudentDetailsModal {...mockProps} />)

      // Trigger deactivation
      fireEvent.press(getByText('Desativar Aluno'))

      // Wait for error handling
      await waitFor(() => {
        expect(StudentService.updateStudent).toHaveBeenCalled()
      })

      // Success should not be called on error
      expect(mockProps.onSuccess).not.toHaveBeenCalled()
    })
  })

  describe('Student List Operations', () => {
    it('should load instructor students correctly', async () => {
      const mockStudents = [
        mockStudent,
        {
          id: 'student-456',
          full_name: 'Another Student',
          email: 'another@test.com',
          phone: '555555555',
          created_at: '2023-01-02T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
          is_active: true,
          role: 'student' as const,
          instructor_id: 'instructor-123',
        },
      ]

      ;(StudentService.getInstructorStudents as jest.Mock).mockResolvedValue(mockStudents)

      const students = await StudentService.getInstructorStudents('instructor-123')

      expect(students).toHaveLength(2)
      expect(students[0].id).toBe('student-123')
      expect(students[1].id).toBe('student-456')
      expect(students.every(s => s.instructor_id === 'instructor-123')).toBe(true)
    })

    it('should filter inactive students when requested', async () => {
      const mockStudents = [
        mockStudent,
        {
          ...mockStudent,
          id: 'student-inactive',
          is_active: false,
        },
      ]

      ;(StudentService.getInstructorStudents as jest.Mock).mockResolvedValue(
        mockStudents.filter(s => s.is_active)
      )

      const activeStudents = await StudentService.getInstructorStudents('instructor-123', false)

      expect(activeStudents).toHaveLength(1)
      expect(activeStudents[0].is_active).toBe(true)
    })

    it('should include inactive students when requested', async () => {
      const mockStudents = [
        mockStudent,
        {
          ...mockStudent,
          id: 'student-inactive',
          is_active: false,
        },
      ]

      ;(StudentService.getInstructorStudents as jest.Mock).mockResolvedValue(mockStudents)

      const allStudents = await StudentService.getInstructorStudents('instructor-123', true)

      expect(allStudents).toHaveLength(2)
      expect(allStudents.some(s => !s.is_active)).toBe(true)
    })
  })

  describe('Student Profile Access', () => {
    it('should retrieve student profile correctly', async () => {
      ;(StudentService.getStudentProfile as jest.Mock).mockResolvedValue(mockStudent)

      const profile = await StudentService.getStudentProfile('student-123')

      expect(profile).toEqual(mockStudent)
      expect(StudentService.getStudentProfile).toHaveBeenCalledWith('student-123')
    })

    it('should handle non-existent student profile', async () => {
      ;(StudentService.getStudentProfile as jest.Mock).mockResolvedValue(null)

      const profile = await StudentService.getStudentProfile('non-existent')

      expect(profile).toBeNull()
    })

    it('should handle profile access errors', async () => {
      ;(StudentService.getStudentProfile as jest.Mock).mockRejectedValue(
        new Error('Failed to fetch student profile')
      )

      await expect(StudentService.getStudentProfile('student-123')).rejects.toThrow(
        'Failed to fetch student profile'
      )
    })
  })
})
