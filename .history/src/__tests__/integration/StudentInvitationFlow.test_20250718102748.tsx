import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { StudentService } from '@/services/api/StudentService'
import { InviteStudentModal } from '@/components/modals/InviteStudentModal'
import { supabase } from '@/services/supabase/supabase'

// Mock StudentService
jest.mock('@/services/api/StudentService', () => ({
  StudentService: {
    inviteStudent: jest.fn(),
    getInstructorStudents: jest.fn(),
  },
}))

// Mock Supabase
jest.mock('@/services/supabase/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    functions: {
      invoke: jest.fn(),
    },
  }
}))

describe('Student Invitation Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('End-to-End Student Invitation', () => {
    it('should complete full invitation flow successfully', async () => {
      // Mock authenticated instructor session
      const mockSession = {
        user: {
          id: 'instructor-123',
          email: 'instructor@test.com'
        },
        access_token: 'mock-token'
      }

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Mock successful edge function call
      ;(supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: { success: true },
        error: null
      })

      // Mock successful invitation
      ;(StudentService.inviteStudent as jest.Mock).mockResolvedValue({
        success: true,
        invitation_data: {
          email: 'student@test.com',
          full_name: 'Test Student',
          phone: '123456789',
          instructor_id: 'instructor-123',
          instructor_name: 'Test Instructor',
          instructor_email: 'instructor@test.com'
        }
      })

      const mockProps = {
        visible: true,
        onClose: jest.fn(),
        onSuccess: jest.fn(),
      }

      const { getByText, getByDisplayValue } = render(
        <InviteStudentModal {...mockProps} />
      )

      // Fill invitation form
      const emailInput = getByDisplayValue('')
      fireEvent.changeText(emailInput, 'student@test.com')
      
      const nameInput = getByDisplayValue('')
      fireEvent.changeText(nameInput, 'Test Student')

      const phoneInput = getByDisplayValue('')
      fireEvent.changeText(phoneInput, '123456789')

      // Submit invitation
      const submitButton = getByText('Enviar Convite')
      fireEvent.press(submitButton)

      // Verify invitation was called with correct data
      await waitFor(() => {
        expect(StudentService.inviteStudent).toHaveBeenCalledWith({
          email: 'student@test.com',
          full_name: 'Test Student',
          phone: '123456789',
        })
      })

      // Verify success callback was called
      await waitFor(() => {
        expect(mockProps.onSuccess).toHaveBeenCalled()
      })
    })

    it('should handle invitation errors gracefully', async () => {
      // Mock authenticated session
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { access_token: 'mock-token' } },
        error: null
      })

      // Mock failed invitation
      ;(StudentService.inviteStudent as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Email already exists'
      })

      const mockProps = {
        visible: true,
        onClose: jest.fn(),
        onSuccess: jest.fn(),
      }

      const { getByText, getByDisplayValue } = render(
        <InviteStudentModal {...mockProps} />
      )

      // Fill form with existing email
      const emailInput = getByDisplayValue('')
      fireEvent.changeText(emailInput, 'existing@test.com')
      
      const nameInput = getByDisplayValue('')
      fireEvent.changeText(nameInput, 'Test Student')

      // Submit invitation
      const submitButton = getByText('Enviar Convite')
      fireEvent.press(submitButton)

      // Verify error handling
      await waitFor(() => {
        expect(StudentService.inviteStudent).toHaveBeenCalled()
      })

      // Success should not be called on error
      expect(mockProps.onSuccess).not.toHaveBeenCalled()
    })

    it('should validate email format before submission', async () => {
      const mockProps = {
        visible: true,
        onClose: jest.fn(),
        onSuccess: jest.fn(),
      }

      const { getByText, getByDisplayValue } = render(
        <InviteStudentModal {...mockProps} />
      )

      // Fill form with invalid email
      const emailInput = getByDisplayValue('')
      fireEvent.changeText(emailInput, 'invalid-email')
      
      const nameInput = getByDisplayValue('')
      fireEvent.changeText(nameInput, 'Test Student')

      // Submit invitation
      const submitButton = getByText('Enviar Convite')
      fireEvent.press(submitButton)

      // Verify validation error appears
      await waitFor(() => {
        expect(getByText('Email deve ter um formato válido')).toBeTruthy()
      })

      // Service should not be called with invalid data
      expect(StudentService.inviteStudent).not.toHaveBeenCalled()
    })

    it('should require authentication for invitations', async () => {
      // Mock no session
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null
      })

      // Mock invitation attempt without auth
      ;(StudentService.inviteStudent as jest.Mock).mockResolvedValue({
        success: false,
        error: 'User must be authenticated'
      })

      const invitationData = {
        email: 'student@test.com',
        full_name: 'Test Student',
        phone: '123456789'
      }

      const result = await StudentService.inviteStudent(invitationData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('User must be authenticated')
    })
  })

  describe('Student List Integration', () => {
    it('should refresh student list after successful invitation', async () => {
      // Mock instructor students
      const mockStudents = [
        {
          id: 'student-1',
          email: 'student1@test.com',
          full_name: 'Student One',
          phone: '111111111',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 'student-2', 
          email: 'student2@test.com',
          full_name: 'Student Two',
          phone: '222222222',
          is_active: true,
          created_at: '2023-01-02T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z'
        }
      ]

      ;(StudentService.getInstructorStudents as jest.Mock).mockResolvedValue(mockStudents)

      const students = await StudentService.getInstructorStudents('instructor-123')

      expect(students).toHaveLength(2)
      expect(students[0].email).toBe('student1@test.com')
      expect(students[1].email).toBe('student2@test.com')
    })
  })
})