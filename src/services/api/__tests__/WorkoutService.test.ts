import { WorkoutService, WorkoutError, WorkoutErrorType } from '../WorkoutService'
import { supabase } from '../../supabase/supabase'
import { TimeoutError } from '@/utils/timeoutHandler'

// Mock the supabase client
jest.mock('../../supabase/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

// Mock timeout handler
jest.mock('@/utils/timeoutHandler', () => ({
  withTimeout: jest.fn(promise => promise),
  TimeoutError: class TimeoutError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'TimeoutError'
    }
  },
}))

describe('WorkoutService', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset console.log and console.warn mocks
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('createWorkout', () => {
    const mockInstructorId = 'instructor-123'
    const mockWorkoutData = {
      name: 'Test Workout',
      description: 'Test Description',
      studentId: 'student-123',
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
      const mockWorkout = {
        id: 'workout-123',
        name: 'Test Workout',
        description: 'Test Description',
        student_id: 'student-123',
        instructor_id: 'instructor-123',
        created_at: '2025-01-18T10:00:00Z',
        updated_at: '2025-01-18T10:00:00Z',
      }

      const mockStudent = {
        id: 'student-123',
        instructor_id: 'instructor-123',
        role: 'student',
        full_name: 'Test Student',
        email: 'student@test.com',
      }

      // Mock student verification
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockStudent,
              error: null,
            }),
          }),
        }),
      } as any)

      // Mock workout creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockWorkout,
              error: null,
            }),
          }),
        }),
      } as any)

      // Mock workout exercises creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          error: null,
        }),
      } as any)

      // Mock getWorkoutDetails call
      const mockWorkoutWithExercises = {
        ...mockWorkout,
        exercises: [
          {
            id: 'we-1',
            workout_id: 'workout-123',
            exercise_id: 'exercise-1',
            sets: 3,
            reps: '10-12',
            rest_seconds: 60,
            order_index: 1,
            notes: 'Test notes',
            exercise: {
              id: 'exercise-1',
              name: 'Push Up',
              muscle_group: 'chest',
            },
          },
        ],
        student: mockStudent,
        instructor: null,
      }

      // Mock the getWorkoutDetails method
      const mockWorkoutWithExercisesComplete = {
        ...mockWorkout,
        exercises: [
          {
            id: 'we-1',
            workout_id: 'workout-123',
            exercise_id: 'exercise-1',
            sets: 3,
            reps: '10-12',
            rest_seconds: 60,
            order_index: 1,
            notes: 'Test notes',
            exercise: {
              id: 'exercise-1',
              name: 'Push Up',
              muscle_group: 'chest',
              created_by: 'instructor-123',
              created_at: '2025-01-18T09:00:00Z',
              updated_at: '2025-01-18T09:00:00Z',
              description: 'Basic push up',
              instructions: 'Get in plank position',
              thumbnail_url: null,
            },
          },
        ],
        student: mockStudent,
        instructor: null,
      }
      jest
        .spyOn(WorkoutService, 'getWorkoutDetails')
        .mockResolvedValue(mockWorkoutWithExercisesComplete)

      const result = await WorkoutService.createWorkout(mockInstructorId, mockWorkoutData)

      expect(result).toEqual(mockWorkoutWithExercisesComplete)
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabase.from).toHaveBeenCalledWith('workouts')
      expect(mockSupabase.from).toHaveBeenCalledWith('workout_exercises')
    })

    it('should throw validation error for missing name', async () => {
      const invalidData = {
        ...mockWorkoutData,
        name: '',
      }

      await expect(WorkoutService.createWorkout(mockInstructorId, invalidData)).rejects.toThrow(
        WorkoutError
      )

      await expect(WorkoutService.createWorkout(mockInstructorId, invalidData)).rejects.toThrow(
        'Workout name is required'
      )
    })

    it('should throw validation error for missing student', async () => {
      const invalidData = {
        ...mockWorkoutData,
        studentId: '',
      }

      await expect(WorkoutService.createWorkout(mockInstructorId, invalidData)).rejects.toThrow(
        WorkoutError
      )

      await expect(WorkoutService.createWorkout(mockInstructorId, invalidData)).rejects.toThrow(
        'Student selection is required'
      )
    })

    it('should throw validation error for empty exercises', async () => {
      const invalidData = {
        ...mockWorkoutData,
        exercises: [],
      }

      await expect(WorkoutService.createWorkout(mockInstructorId, invalidData)).rejects.toThrow(
        WorkoutError
      )

      await expect(WorkoutService.createWorkout(mockInstructorId, invalidData)).rejects.toThrow(
        'At least one exercise is required'
      )
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

      await expect(WorkoutService.createWorkout(mockInstructorId, invalidData)).rejects.toThrow(
        'Number of sets must be at least 1'
      )
    })

    it('should throw permission error for non-student', async () => {
      const mockNonStudent = {
        id: 'user-123',
        instructor_id: 'instructor-123',
        role: 'instructor',
      }

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockNonStudent,
              error: null,
            }),
          }),
        }),
      } as any)

      await expect(WorkoutService.createWorkout(mockInstructorId, mockWorkoutData)).rejects.toThrow(
        WorkoutError
      )

      await expect(WorkoutService.createWorkout(mockInstructorId, mockWorkoutData)).rejects.toThrow(
        'You can only create workouts for students'
      )
    })

    it("should throw permission error for other instructor's student", async () => {
      const mockOtherStudent = {
        id: 'student-123',
        instructor_id: 'other-instructor',
        role: 'student',
      }

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockOtherStudent,
              error: null,
            }),
          }),
        }),
      } as any)

      await expect(WorkoutService.createWorkout(mockInstructorId, mockWorkoutData)).rejects.toThrow(
        WorkoutError
      )

      await expect(WorkoutService.createWorkout(mockInstructorId, mockWorkoutData)).rejects.toThrow(
        'You can only create workouts for your own students'
      )
    })

    it('should rollback workout creation if exercises fail', async () => {
      const mockWorkout = {
        id: 'workout-123',
        name: 'Test Workout',
      }

      const mockStudent = {
        id: 'student-123',
        instructor_id: 'instructor-123',
        role: 'student',
      }

      // Mock student verification
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockStudent,
              error: null,
            }),
          }),
        }),
      } as any)

      // Mock workout creation success
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockWorkout,
              error: null,
            }),
          }),
        }),
      } as any)

      // Mock workout exercises creation failure
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          error: { message: 'Exercise creation failed' },
        }),
      } as any)

      // Mock workout deletion for rollback
      mockSupabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({}),
        }),
      } as any)

      await expect(WorkoutService.createWorkout(mockInstructorId, mockWorkoutData)).rejects.toThrow(
        WorkoutError
      )

      await expect(WorkoutService.createWorkout(mockInstructorId, mockWorkoutData)).rejects.toThrow(
        'Failed to create workout exercises'
      )
    })
  })

  describe('getInstructorWorkouts', () => {
    const mockInstructorId = 'instructor-123'

    it('should return instructor workouts successfully', async () => {
      const mockWorkouts = [
        {
          id: 'workout-1',
          name: 'Workout 1',
          student_id: 'student-1',
          instructor_id: 'instructor-123',
          created_at: '2025-01-18T10:00:00Z',
        },
      ]

      const mockStudents = [
        {
          id: 'student-1',
          full_name: 'Student 1',
          email: 'student1@test.com',
        },
      ]

      const mockExercises = [
        {
          workout_id: 'workout-1',
          exercise_id: 'exercise-1',
          sets: 3,
          reps: '10',
          rest_seconds: 60,
          order_index: 1,
          exercise: {
            id: 'exercise-1',
            name: 'Push Up',
          },
        },
      ]

      // Mock workouts query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockWorkouts,
              error: null,
            }),
          }),
        }),
      } as any)

      // Mock students query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: mockStudents,
            error: null,
          }),
        }),
      } as any)

      // Mock exercises query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockExercises,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await WorkoutService.getInstructorWorkouts(mockInstructorId)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('workout-1')
      expect(result[0].student?.full_name).toBe('Student 1')
      expect(result[0].exercises).toHaveLength(1)
    })

    it('should return empty array when no workouts found', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await WorkoutService.getInstructorWorkouts(mockInstructorId)

      expect(result).toEqual([])
    })

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      } as any)

      await expect(WorkoutService.getInstructorWorkouts(mockInstructorId)).rejects.toThrow(
        WorkoutError
      )

      await expect(WorkoutService.getInstructorWorkouts(mockInstructorId)).rejects.toThrow(
        'Failed to fetch instructor workouts'
      )
    })
  })

  describe('getStudentWorkouts', () => {
    const mockStudentId = 'student-123'

    it('should return student workouts successfully', async () => {
      const mockWorkouts = [
        {
          id: 'workout-1',
          name: 'Workout 1',
          student_id: 'student-123',
          instructor_id: 'instructor-1',
          created_at: '2025-01-18T10:00:00Z',
        },
      ]

      const mockInstructors = [
        {
          id: 'instructor-1',
          full_name: 'Instructor 1',
          email: 'instructor1@test.com',
        },
      ]

      const mockExercises = [
        {
          workout_id: 'workout-1',
          exercise_id: 'exercise-1',
          sets: 3,
          reps: '10',
          rest_seconds: 60,
          order_index: 1,
          exercise: {
            id: 'exercise-1',
            name: 'Push Up',
          },
        },
      ]

      // Mock workouts query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockWorkouts,
              error: null,
            }),
          }),
        }),
      } as any)

      // Mock instructors query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: mockInstructors,
            error: null,
          }),
        }),
      } as any)

      // Mock exercises query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockExercises,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await WorkoutService.getStudentWorkouts(mockStudentId)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('workout-1')
      expect(result[0].instructor?.full_name).toBe('Instructor 1')
      expect(result[0].exercises).toHaveLength(1)
    })
  })

  describe('getWorkoutDetails', () => {
    const mockWorkoutId = 'workout-123'

    it('should return workout details successfully', async () => {
      const mockWorkout = {
        id: 'workout-123',
        name: 'Test Workout',
        student_id: 'student-123',
        instructor_id: 'instructor-123',
      }

      const mockStudent = {
        id: 'student-123',
        full_name: 'Test Student',
      }

      const mockInstructor = {
        id: 'instructor-123',
        full_name: 'Test Instructor',
      }

      const mockExercises = [
        {
          workout_id: 'workout-123',
          exercise_id: 'exercise-1',
          sets: 3,
          reps: '10',
          rest_seconds: 60,
          order_index: 1,
          exercise: {
            id: 'exercise-1',
            name: 'Push Up',
          },
        },
      ]

      // Mock workout query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockWorkout,
              error: null,
            }),
          }),
        }),
      } as any)

      // Mock student query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockStudent,
              error: null,
            }),
          }),
        }),
      } as any)

      // Mock instructor query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockInstructor,
              error: null,
            }),
          }),
        }),
      } as any)

      // Mock exercises query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockExercises,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await WorkoutService.getWorkoutDetails(mockWorkoutId)

      expect(result.id).toBe('workout-123')
      expect(result.student?.full_name).toBe('Test Student')
      expect(result.instructor?.full_name).toBe('Test Instructor')
      expect(result.exercises).toHaveLength(1)
    })

    it('should throw not found error for non-existent workout', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      } as any)

      await expect(WorkoutService.getWorkoutDetails(mockWorkoutId)).rejects.toThrow(WorkoutError)

      await expect(WorkoutService.getWorkoutDetails(mockWorkoutId)).rejects.toThrow(
        'Workout not found'
      )
    })
  })

  describe('updateWorkout', () => {
    const mockWorkoutId = 'workout-123'
    const mockInstructorId = 'instructor-123'
    const mockUpdateData = {
      name: 'Updated Workout',
      description: 'Updated Description',
    }

    it('should update workout successfully', async () => {
      // Mock ownership verification
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { instructor_id: mockInstructorId },
              error: null,
            }),
          }),
        }),
      } as any)

      // Mock workout update
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any)

      // Mock getWorkoutDetails call
      const mockUpdatedWorkout = {
        id: mockWorkoutId,
        name: 'Updated Workout',
        description: 'Updated Description',
        exercises: [],
      }

      jest.spyOn(WorkoutService, 'getWorkoutDetails').mockResolvedValue(mockUpdatedWorkout as any)

      const result = await WorkoutService.updateWorkout(
        mockWorkoutId,
        mockInstructorId,
        mockUpdateData
      )

      expect(result.name).toBe('Updated Workout')
      expect(result.description).toBe('Updated Description')
    })

    it('should throw permission error for non-owner', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { instructor_id: 'other-instructor' },
              error: null,
            }),
          }),
        }),
      } as any)

      await expect(
        WorkoutService.updateWorkout(mockWorkoutId, mockInstructorId, mockUpdateData)
      ).rejects.toThrow(WorkoutError)

      await expect(
        WorkoutService.updateWorkout(mockWorkoutId, mockInstructorId, mockUpdateData)
      ).rejects.toThrow('You can only modify your own workouts')
    })
  })

  describe('deleteWorkout', () => {
    const mockWorkoutId = 'workout-123'
    const mockInstructorId = 'instructor-123'

    it('should delete workout successfully', async () => {
      // Mock ownership verification
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { instructor_id: mockInstructorId },
              error: null,
            }),
          }),
        }),
      } as any)

      // Mock exercises deletion
      mockSupabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any)

      // Mock workout deletion
      mockSupabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any)

      await expect(
        WorkoutService.deleteWorkout(mockWorkoutId, mockInstructorId)
      ).resolves.not.toThrow()
    })

    it('should throw permission error for non-owner', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { instructor_id: 'other-instructor' },
              error: null,
            }),
          }),
        }),
      } as any)

      await expect(WorkoutService.deleteWorkout(mockWorkoutId, mockInstructorId)).rejects.toThrow(
        WorkoutError
      )

      await expect(WorkoutService.deleteWorkout(mockWorkoutId, mockInstructorId)).rejects.toThrow(
        'You can only modify your own workouts'
      )
    })
  })

  describe('searchInstructorWorkouts', () => {
    const mockInstructorId = 'instructor-123'

    it('should search workouts with filters', async () => {
      const mockWorkouts = [
        {
          id: 'workout-1',
          name: 'Chest Workout',
          student_id: 'student-1',
          instructor_id: 'instructor-123',
        },
      ]

      // Mock workouts query with search
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                or: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: mockWorkouts,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      } as any)

      // Mock students query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      } as any)

      // Mock exercises query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await WorkoutService.searchInstructorWorkouts(mockInstructorId, {
        search: 'chest',
        studentId: 'student-1',
        limit: 10,
      })

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Chest Workout')
    })
  })

  describe('getInstructorWorkoutStats', () => {
    const mockInstructorId = 'instructor-123'

    it('should return workout statistics', async () => {
      // Mock total workouts count
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            count: 5,
          }),
        }),
      } as any)

      // Mock student IDs query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              { student_id: 'student-1' },
              { student_id: 'student-2' },
              { student_id: 'student-1' },
            ],
          }),
        }),
      } as any)

      // Mock recent workouts count
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              count: 2,
            }),
          }),
        }),
      } as any)

      // Mock workout counts for most active student
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              { student_id: 'student-1' },
              { student_id: 'student-1' },
              { student_id: 'student-2' },
            ],
          }),
        }),
      } as any)

      // Mock most active student profile
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'student-1',
                full_name: 'Most Active Student',
              },
            }),
          }),
        }),
      } as any)

      const result = await WorkoutService.getInstructorWorkoutStats(mockInstructorId)

      expect(result.totalWorkouts).toBe(5)
      expect(result.totalStudents).toBe(2)
      expect(result.recentWorkouts).toBe(2)
      expect(result.mostActiveStudent?.full_name).toBe('Most Active Student')
    })

    it('should handle errors gracefully and return default stats', async () => {
      // Mock error in first query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      } as any)

      const result = await WorkoutService.getInstructorWorkoutStats(mockInstructorId)

      expect(result.totalWorkouts).toBe(0)
      expect(result.totalStudents).toBe(0)
      expect(result.recentWorkouts).toBe(0)
      expect(result.mostActiveStudent).toBeUndefined()
    })
  })

  describe('duplicateWorkout', () => {
    const mockWorkoutId = 'workout-123'
    const mockInstructorId = 'instructor-123'

    it('should duplicate workout successfully', async () => {
      const mockOriginalWorkout = {
        id: 'workout-123',
        name: 'Original Workout',
        description: 'Original Description',
        student_id: 'student-123',
        instructor_id: 'instructor-123',
        exercises: [
          {
            exercise_id: 'exercise-1',
            sets: 3,
            reps: '10',
            rest_seconds: 60,
            order_index: 1,
            notes: 'Test notes',
          },
        ],
      }

      const mockDuplicatedWorkout = {
        id: 'workout-456',
        name: 'Original Workout (Cópia)',
        description: 'Original Description',
        student_id: 'student-123',
        instructor_id: 'instructor-123',
        exercises: mockOriginalWorkout.exercises,
      }

      // Mock getWorkoutDetails for original workout
      jest
        .spyOn(WorkoutService, 'getWorkoutDetails')
        .mockResolvedValueOnce(mockOriginalWorkout as any)

      // Mock createWorkout for duplicate
      jest
        .spyOn(WorkoutService, 'createWorkout')
        .mockResolvedValueOnce(mockDuplicatedWorkout as any)

      const result = await WorkoutService.duplicateWorkout(
        mockWorkoutId,
        mockInstructorId,
        'student-456',
        'Custom Copy Name'
      )

      expect(result.id).toBe('workout-456')
      expect(WorkoutService.createWorkout).toHaveBeenCalledWith(
        mockInstructorId,
        expect.objectContaining({
          name: 'Custom Copy Name',
          studentId: 'student-456',
          exercises: expect.any(Array),
        })
      )
    })

    it("should throw permission error when duplicating other instructor's workout", async () => {
      const mockOriginalWorkout = {
        id: 'workout-123',
        instructor_id: 'other-instructor',
        exercises: [],
      }

      jest
        .spyOn(WorkoutService, 'getWorkoutDetails')
        .mockResolvedValueOnce(mockOriginalWorkout as any)

      await expect(
        WorkoutService.duplicateWorkout(mockWorkoutId, mockInstructorId)
      ).rejects.toThrow(WorkoutError)

      await expect(
        WorkoutService.duplicateWorkout(mockWorkoutId, mockInstructorId)
      ).rejects.toThrow('You can only duplicate your own workouts')
    })
  })

  describe('Error Handling', () => {
    it('should create WorkoutError with correct type and message', () => {
      const error = new WorkoutError(
        WorkoutErrorType.VALIDATION_ERROR,
        'Test error message',
        'testField'
      )

      expect(error.type).toBe(WorkoutErrorType.VALIDATION_ERROR)
      expect(error.message).toBe('Test error message')
      expect(error.field).toBe('testField')
      expect(error.name).toBe('WorkoutError')
    })

    it('should handle timeout errors in createWorkout', async () => {
      const { withTimeout } = require('@/utils/timeoutHandler')

      // Mock withTimeout to throw TimeoutError
      withTimeout.mockRejectedValueOnce(new TimeoutError('Timeout occurred'))

      const mockWorkoutData = {
        name: 'Test Workout',
        studentId: 'student-123',
        exercises: [],
      }

      await expect(WorkoutService.createWorkout('instructor-123', mockWorkoutData)).rejects.toThrow(
        WorkoutError
      )

      await expect(WorkoutService.createWorkout('instructor-123', mockWorkoutData)).rejects.toThrow(
        'Timeout occurred'
      )
    })
  })
})
