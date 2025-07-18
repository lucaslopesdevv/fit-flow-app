import { StudentService } from '../StudentService'
import { supabase } from '@/services/supabase/supabase'

// Mock the supabase client
jest.mock('@/services/supabase/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            limit: jest.fn()
          })),
          limit: jest.fn()
        })),
        gte: jest.fn(() => ({
          order: jest.fn()
        })),
        order: jest.fn()
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    })),
    functions: {
      invoke: jest.fn()
    },
    auth: {
      getSession: jest.fn()
    }
  }
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('StudentService Database Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getInstructorStudents', () => {
    it('should call the get_instructor_students RPC function', async () => {
      const mockStudents = [
        {
          id: '123',
          full_name: 'John Doe',
          email: 'john@example.com',
          instructor_id: 'instructor-123',
          role: 'student',
          is_active: true,
          created_at: '2023-01-01',
          updated_at: '2023-01-01'
        }
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: mockStudents,
        error: null
      })

      const result = await StudentService.getInstructorStudents('instructor-123', false)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_instructor_students', {
        p_instructor_id: 'instructor-123',
        p_include_inactive: false
      })
      expect(result).toEqual(mockStudents)
    })

    it('should handle errors from the RPC function', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      await expect(StudentService.getInstructorStudents('instructor-123'))
        .rejects.toThrow('Failed to fetch students')
    })
  })

  describe('updateStudent', () => {
    it('should call the update_student_profile RPC function', async () => {
      const mockUpdatedStudent = {
        id: '123',
        full_name: 'John Updated',
        email: 'john@example.com',
        phone: '123-456-7890',
        instructor_id: 'instructor-123',
        role: 'student',
        is_active: true,
        created_at: '2023-01-01',
        updated_at: '2023-01-02'
      }

      mockSupabase.rpc.mockResolvedValue({
        data: mockUpdatedStudent,
        error: null
      })

      const updates = {
        full_name: 'John Updated',
        phone: '123-456-7890'
      }

      const result = await StudentService.updateStudent('123', updates)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_student_profile', {
        p_student_id: '123',
        p_full_name: 'John Updated',
        p_phone: '123-456-7890',
        p_avatar_url: null
      })
      expect(result).toEqual(mockUpdatedStudent)
    })
  })

  describe('activateStudent', () => {
    it('should call the update_student_status RPC function with is_active true', async () => {
      const mockActivatedStudent = {
        id: '123',
        full_name: 'John Doe',
        email: 'john@example.com',
        instructor_id: 'instructor-123',
        role: 'student',
        is_active: true,
        created_at: '2023-01-01',
        updated_at: '2023-01-02'
      }

      mockSupabase.rpc.mockResolvedValue({
        data: mockActivatedStudent,
        error: null
      })

      const result = await StudentService.activateStudent('123')

      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_student_status', {
        p_student_id: '123',
        p_is_active: true
      })
      expect(result).toEqual(mockActivatedStudent)
    })
  })

  describe('deactivateStudent', () => {
    it('should call the update_student_status RPC function with is_active false', async () => {
      const mockDeactivatedStudent = {
        id: '123',
        full_name: 'John Doe',
        email: 'john@example.com',
        instructor_id: 'instructor-123',
        role: 'student',
        is_active: false,
        created_at: '2023-01-01',
        updated_at: '2023-01-02'
      }

      mockSupabase.rpc.mockResolvedValue({
        data: mockDeactivatedStudent,
        error: null
      })

      const result = await StudentService.deactivateStudent('123')

      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_student_status', {
        p_student_id: '123',
        p_is_active: false
      })
      expect(result).toEqual(mockDeactivatedStudent)
    })
  })

  describe('inviteStudent', () => {
    it('should call the invite-student edge function', async () => {
      const mockSession = {
        access_token: 'mock-token',
        user: { id: 'instructor-123', email: 'instructor@example.com' }
      }

      const mockInvitationResponse = {
        success: true,
        user_id: 'new-student-123',
        message: 'Invitation sent successfully'
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockInvitationResponse,
        error: null
      })

      const invitation = {
        email: 'student@example.com',
        full_name: 'New Student',
        phone: '123-456-7890'
      }

      const result = await StudentService.inviteStudent(invitation)

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('invite-student', {
        body: {
          email: 'student@example.com',
          full_name: 'New Student',
          phone: '123-456-7890'
        },
        headers: {
          Authorization: 'Bearer mock-token'
        }
      })
      expect(result.success).toBe(true)
    })
  })
})