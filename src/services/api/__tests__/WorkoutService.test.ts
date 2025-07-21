import { WorkoutService, WorkoutError, WorkoutErrorType } from '../WorkoutService'
import { supabase } from '../../supabase/supabase'

// Mock Supabase
jest.mock('../../supabase/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        single: jest.fn(),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('WorkoutService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createWorkout', () => {
    const mockInstructorId = 'instructor-1'
    const mockWorkoutData = {
      name: 'Test Workout',
      description: 'Test Description',
      studentId: 'student-1',
      exercises: [
        {
          exerciseId: 'exercise-1',
          sets: 3,
          reps: '10-12',
          restSeconds: 60,
          orderIndex: 1,
          notes: 'Test notes',
        },
      ],
    }

    it('should create workout successfully', async () => {
      // Mock successful workout creation
      const mockWorkout = {
        id: 'workout-1',
        name: 'Test Workout',
        description: 'Test Description',
        student_id: 'student-1',
        instructor_id: 'instructor-1',
        created_at: '2025-01-18T10:00:00Z',
        updated_at: '2025-01-18T10:00:00Z',
      }

      // Mock student verification
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: { instructor_id: mockInstructorId },
                error: null,
              })
            ),
          })),
        })),
      } as any)

      // Mock workout insertion
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: mockWorkout,
                error: null,
              })
            ),
          })),
        })),
      } as any)

      // Mock workout exercises insertion
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn(() => Promise.resolve({ error: null })),
      } as any)

      // Mock getWorkoutDetails
      const mockWorkoutWithExercises = {
        ...mockWorkout,
        exercises: [
          {
            id: 'we-1',
            workout_id: 'workout-1',
            exercise_id: 'exercise-1',
            sets: 3,
            reps: '10-12',
            rest_seconds: 60,
            order_index: 1,
            notes: 'Test notes',
            exercise: {
              id: 'exercise-1',
              name: 'Push Up',
              muscle_group: 'Peito',
              created_by: 'instructor-1',
              created_at: '2025-01-18T10:00:00Z',
            },
          },
        ],
      }

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: {
                  ...mockWorkout,
                  exercises: mockWorkoutWithExercises.exercises,
                },
                error: null,
              })
            ),
          })),
        })),
      } as any)

      const result = await WorkoutService.createWorkout(mockInstructorId, mockWorkoutData)

      expect(result).toBeDefined()
      expect(result.name).toBe('Test Workout')
      expect(result.exercises).toHaveLength(1)
    })

    it('should throw validation error for missing name', async () => {
      const invalidData = {
        ...mockWorkoutData,
        name: '',
      }

      await expect(WorkoutService.createWorkout(mockInstructorId, invalidData)).rejects.toThrow(
        WorkoutError
      )

      await expect(
        WorkoutService.createWorkout(mockInstructorId, invalidData)
      ).rejects.toMatchObject({
        type: WorkoutErrorType.VALIDATION_ERROR,
        field: 'name',
      })
    })

    it('should throw validation error for missing student', async () => {
      const invalidData = {
        ...mockWorkoutData,
        studentId: '',
      }

      await expect(WorkoutService.createWorkout(mockInstructorId, invalidData)).rejects.toThrow(
        WorkoutError
      )

      await expect(
        WorkoutService.createWorkout(mockInstructorId, invalidData)
      ).rejects.toMatchObject({
        type: WorkoutErrorType.VALIDATION_ERROR,
        field: 'studentId',
      })
    })

    it('should throw validation error for empty exercises', async () => {
      const invalidData = {
        ...mockWorkoutData,
        exercises: [],
      }

      await expect(WorkoutService.createWorkout(mockInstructorId, invalidData)).rejects.toThrow(
        WorkoutError
      )

      await expect(
        WorkoutService.createWorkout(mockInstructorId, invalidData)
      ).rejects.toMatchObject({
        type: WorkoutErrorType.VALIDATION_ERROR,
        field: 'exercises',
      })
    })

    it('should throw validation error for invalid exercise sets', async () => {
      const invalidData = {
        ...mockWorkoutData,
        exercises: [
          {
            ...mockWorkoutData.exercises[0],
            sets: 0,
          },
        ],
      }

      await expect(WorkoutService.createWorkout(mockInstructorId, invalidData)).rejects.toThrow(
        WorkoutError
      )

      await expect(
        WorkoutService.createWorkout(mockInstructorId, invalidData)
      ).rejects.toMatchObject({
        type: WorkoutErrorType.VALIDATION_ERROR,
        field: 'exercises.0.sets',
      })
    })

    it('should throw permission error for non-student', async () => {
      // Mock student verification failure
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: { instructor_id: 'other-instructor' },
                error: null,
              })
            ),
          })),
        })),
      } as any)

      await expect(WorkoutService.createWorkout(mockInstructorId, mockWorkoutData)).rejects.toThrow(
        WorkoutError
      )

      await expect(
        WorkoutService.createWorkout(mockInstructorId, mockWorkoutData)
      ).rejects.toMatchObject({
        type: WorkoutErrorType.PERMISSION_ERROR,
      })
    })
  })

  describe('getInstructorWorkouts', () => {
    it('should fetch instructor workouts successfully', async () => {
      const mockWorkouts = [
        {
          id: 'workout-1',
          name: 'Workout 1',
          instructor_id: 'instructor-1',
          student_id: 'student-1',
          created_at: '2025-01-18T10:00:00Z',
          student: {
            id: 'student-1',
            full_name: 'Student Name',
            email: 'student@test.com',
          },
          exercises: [],
        },
      ]

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() =>
              Promise.resolve({
                data: mockWorkouts,
                error: null,
              })
            ),
          })),
        })),
      } as any)

      const result = await WorkoutService.getInstructorWorkouts('instructor-1')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Workout 1')
    })

    it('should handle network error', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() =>
              Promise.resolve({
                data: null,
                error: { message: 'Network error' },
              })
            ),
          })),
        })),
      } as any)

      await expect(WorkoutService.getInstructorWorkouts('instructor-1')).rejects.toThrow(
        WorkoutError
      )

      await expect(WorkoutService.getInstructorWorkouts('instructor-1')).rejects.toMatchObject({
        type: WorkoutErrorType.NETWORK_ERROR,
      })
    })
  })

  describe('getStudentWorkouts', () => {
    it('should fetch student workouts successfully', async () => {
      const mockWorkouts = [
        {
          id: 'workout-1',
          name: 'Workout 1',
          instructor_id: 'instructor-1',
          student_id: 'student-1',
          created_at: '2025-01-18T10:00:00Z',
          instructor: {
            id: 'instructor-1',
            full_name: 'Instructor Name',
            email: 'instructor@test.com',
          },
          exercises: [],
        },
      ]

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() =>
              Promise.resolve({
                data: mockWorkouts,
                error: null,
              })
            ),
          })),
        })),
      } as any)

      const result = await WorkoutService.getStudentWorkouts('student-1')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Workout 1')
    })
  })

  describe('getWorkoutDetails', () => {
    it('should fetch workout details successfully', async () => {
      const mockWorkout = {
        id: 'workout-1',
        name: 'Workout 1',
        instructor_id: 'instructor-1',
        student_id: 'student-1',
        created_at: '2025-01-18T10:00:00Z',
        student: { id: 'student-1', full_name: 'Student' },
        instructor: { id: 'instructor-1', full_name: 'Instructor' },
        exercises: [
          {
            id: 'we-1',
            order_index: 1,
            sets: 3,
            reps: '10-12',
            exercise: { id: 'ex-1', name: 'Push Up' },
          },
        ],
      }

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: mockWorkout,
                error: null,
              })
            ),
          })),
        })),
      } as any)

      const result = await WorkoutService.getWorkoutDetails('workout-1')

      expect(result.name).toBe('Workout 1')
      expect(result.exercises).toHaveLength(1)
    })

    it('should throw not found error', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: null,
                error: { code: 'PGRST116' },
              })
            ),
          })),
        })),
      } as any)

      await expect(WorkoutService.getWorkoutDetails('non-existent')).rejects.toThrow(WorkoutError)

      await expect(WorkoutService.getWorkoutDetails('non-existent')).rejects.toMatchObject({
        type: WorkoutErrorType.NOT_FOUND_ERROR,
      })
    })
  })

  describe('deleteWorkout', () => {
    it('should delete workout successfully', async () => {
      // Mock ownership verification
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: { instructor_id: 'instructor-1' },
                error: null,
              })
            ),
          })),
        })),
      } as any)

      // Mock exercises deletion
      mockSupabase.from.mockReturnValueOnce({
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null })),
        })),
      } as any)

      // Mock workout deletion
      mockSupabase.from.mockReturnValueOnce({
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null })),
        })),
      } as any)

      await expect(WorkoutService.deleteWorkout('workout-1', 'instructor-1')).resolves.not.toThrow()
    })

    it('should throw permission error for non-owner', async () => {
      // Mock ownership verification failure
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: { instructor_id: 'other-instructor' },
                error: null,
              })
            ),
          })),
        })),
      } as any)

      await expect(WorkoutService.deleteWorkout('workout-1', 'instructor-1')).rejects.toThrow(
        WorkoutError
      )

      await expect(WorkoutService.deleteWorkout('workout-1', 'instructor-1')).rejects.toMatchObject(
        {
          type: WorkoutErrorType.PERMISSION_ERROR,
        }
      )
    })
  })
})
