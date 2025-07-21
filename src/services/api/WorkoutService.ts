import { supabase } from '../supabase/supabase'
import { Workout, WorkoutExercise, Exercise, Profile, Database } from '@/types/database'
import { withTimeout, TimeoutOptions } from '@/utils/timeoutHandler'

// Extended types for workout operations
export interface WorkoutWithExercises extends Workout {
  exercises: WorkoutExerciseWithDetails[]
  student?: Profile
  instructor?: Profile
}

export interface WorkoutExerciseWithDetails extends WorkoutExercise {
  exercise: Exercise
}

export interface CreateWorkoutRequest {
  name: string
  description?: string
  studentId: string
  exercises: CreateWorkoutExerciseRequest[]
}

export interface CreateWorkoutExerciseRequest {
  exerciseId: string
  sets: number
  reps: string
  restSeconds: number
  orderIndex: number
  notes?: string
}

export interface UpdateWorkoutRequest {
  name?: string
  description?: string
  exercises?: CreateWorkoutExerciseRequest[]
}

// Error types for better error handling
export enum WorkoutErrorType {
  VALIDATION_ERROR = 'validation_error',
  NETWORK_ERROR = 'network_error',
  PERMISSION_ERROR = 'permission_error',
  NOT_FOUND_ERROR = 'not_found_error',
}

export class WorkoutError extends Error {
  constructor(
    public type: WorkoutErrorType,
    message: string,
    public field?: string
  ) {
    super(message)
    this.name = 'WorkoutError'
  }
}

export class WorkoutService {
  private static readonly DEFAULT_TIMEOUT = 30000 // 30 seconds

  /**
   * Creates a new workout with exercises in a transaction
   */
  static async createWorkout(
    instructorId: string,
    workoutData: CreateWorkoutRequest,
    timeoutOptions?: TimeoutOptions
  ): Promise<WorkoutWithExercises> {
    return withTimeout(this.executeCreateWorkout(instructorId, workoutData), {
      timeout: this.DEFAULT_TIMEOUT,
      timeoutMessage: 'Tempo limite para criar treino excedido. Tente novamente.',
      ...timeoutOptions,
    })
  }

  private static async executeCreateWorkout(
    instructorId: string,
    workoutData: CreateWorkoutRequest
  ): Promise<WorkoutWithExercises> {
    try {
      // Validate input data
      this.validateCreateWorkoutRequest(workoutData)

      // Verify instructor has permission to create workout for this student
      await this.verifyInstructorStudentRelation(instructorId, workoutData.studentId)

      // Start transaction by creating the workout
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          name: workoutData.name,
          description: workoutData.description,
          student_id: workoutData.studentId,
          instructor_id: instructorId,
        })
        .select()
        .single()

      if (workoutError) {
        throw new WorkoutError(
          WorkoutErrorType.NETWORK_ERROR,
          `Failed to create workout: ${workoutError.message}`
        )
      }

      // Create workout exercises
      if (workoutData.exercises.length > 0) {
        const workoutExercises = workoutData.exercises.map(exercise => ({
          workout_id: workout.id,
          exercise_id: exercise.exerciseId,
          sets: exercise.sets,
          reps: exercise.reps,
          rest_seconds: exercise.restSeconds,
          order_index: exercise.orderIndex,
          notes: exercise.notes,
        }))

        const { error: exercisesError } = await supabase
          .from('workout_exercises')
          .insert(workoutExercises)

        if (exercisesError) {
          // Rollback: delete the workout if exercises failed
          await supabase.from('workouts').delete().eq('id', workout.id)
          throw new WorkoutError(
            WorkoutErrorType.NETWORK_ERROR,
            `Failed to create workout exercises: ${exercisesError.message}`
          )
        }
      }

      // Log audit event
      await this.logAuditEvent('create', workout.id, instructorId, {
        workoutName: workoutData.name,
        studentId: workoutData.studentId,
        exerciseCount: workoutData.exercises.length,
      })

      // Return the complete workout with exercises
      return await this.getWorkoutDetails(workout.id)
    } catch (error) {
      if (error instanceof WorkoutError) {
        throw error
      }
      throw new WorkoutError(
        WorkoutErrorType.NETWORK_ERROR,
        `Unexpected error creating workout: ${error}`
      )
    }
  }

  /**
   * Gets all workouts created by an instructor
   */
  static async getInstructorWorkouts(instructorId: string): Promise<WorkoutWithExercises[]> {
    try {
      // First get the workouts
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .eq('instructor_id', instructorId)
        .order('created_at', { ascending: false })

      if (workoutsError) {
        throw new WorkoutError(
          WorkoutErrorType.NETWORK_ERROR,
          `Failed to fetch instructor workouts: ${workoutsError.message}`
        )
      }

      if (!workouts || workouts.length === 0) {
        return []
      }

      // Get student details for each workout
      const workoutIds = workouts.map(w => w.id)
      const studentIds = [...new Set(workouts.map(w => w.student_id))]

      // Fetch students
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', studentIds)

      if (studentsError) {
        console.warn('Failed to fetch student details:', studentsError.message)
      }

      // Fetch workout exercises
      const { data: workoutExercises, error: exercisesError } = await supabase
        .from('workout_exercises')
        .select(
          `
          *,
          exercise:exercises(*)
        `
        )
        .in('workout_id', workoutIds)
        .order('order_index')

      if (exercisesError) {
        console.warn('Failed to fetch workout exercises:', exercisesError.message)
      }

      // Combine the data
      const data = workouts.map(workout => ({
        ...workout,
        student: students?.find(s => s.id === workout.student_id) || null,
        exercises: (workoutExercises || [])
          .filter(we => we.workout_id === workout.id)
          .map(we => ({
            ...we,
            exercise: we.exercise,
          })),
      }))

      return data.map(this.transformWorkoutData)
    } catch (error) {
      if (error instanceof WorkoutError) {
        throw error
      }
      throw new WorkoutError(
        WorkoutErrorType.NETWORK_ERROR,
        `Unexpected error fetching instructor workouts: ${error}`
      )
    }
  }

  /**
   * Gets all workouts assigned to a student
   */
  static async getStudentWorkouts(studentId: string): Promise<WorkoutWithExercises[]> {
    try {
      // First get the workouts
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (workoutsError) {
        throw new WorkoutError(
          WorkoutErrorType.NETWORK_ERROR,
          `Failed to fetch student workouts: ${workoutsError.message}`
        )
      }

      if (!workouts || workouts.length === 0) {
        return []
      }

      // Get instructor details for each workout
      const workoutIds = workouts.map(w => w.id)
      const instructorIds = [...new Set(workouts.map(w => w.instructor_id))]

      // Fetch instructors
      const { data: instructors, error: instructorsError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', instructorIds)

      if (instructorsError) {
        console.warn('Failed to fetch instructor details:', instructorsError.message)
      }

      // Fetch workout exercises
      const { data: workoutExercises, error: exercisesError } = await supabase
        .from('workout_exercises')
        .select(
          `
          *,
          exercise:exercises(*)
        `
        )
        .in('workout_id', workoutIds)
        .order('order_index')

      if (exercisesError) {
        console.warn('Failed to fetch workout exercises:', exercisesError.message)
      }

      // Combine the data
      const data = workouts.map(workout => ({
        ...workout,
        instructor: instructors?.find(i => i.id === workout.instructor_id) || null,
        exercises: (workoutExercises || [])
          .filter(we => we.workout_id === workout.id)
          .map(we => ({
            ...we,
            exercise: we.exercise,
          })),
      }))

      return data.map(this.transformWorkoutData)
    } catch (error) {
      if (error instanceof WorkoutError) {
        throw error
      }
      throw new WorkoutError(
        WorkoutErrorType.NETWORK_ERROR,
        `Unexpected error fetching student workouts: ${error}`
      )
    }
  }

  /**
   * Gets detailed information about a specific workout
   */
  static async getWorkoutDetails(workoutId: string): Promise<WorkoutWithExercises> {
    try {
      // Get the workout
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
        .single()

      if (workoutError) {
        if (workoutError.code === 'PGRST116') {
          throw new WorkoutError(WorkoutErrorType.NOT_FOUND_ERROR, 'Workout not found')
        }
        throw new WorkoutError(
          WorkoutErrorType.NETWORK_ERROR,
          `Failed to fetch workout details: ${workoutError.message}`
        )
      }

      // Get student details
      const { data: student } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('id', workout.student_id)
        .single()

      // Get instructor details
      const { data: instructor } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('id', workout.instructor_id)
        .single()

      // Get workout exercises
      const { data: workoutExercises } = await supabase
        .from('workout_exercises')
        .select(
          `
          *,
          exercise:exercises(*)
        `
        )
        .eq('workout_id', workoutId)
        .order('order_index')

      const data = {
        ...workout,
        student: student || null,
        instructor: instructor || null,
        exercises: (workoutExercises || []).map(we => ({
          ...we,
          exercise: we.exercise,
        })),
      }

      return this.transformWorkoutData(data)
    } catch (error) {
      if (error instanceof WorkoutError) {
        throw error
      }
      throw new WorkoutError(
        WorkoutErrorType.NETWORK_ERROR,
        `Unexpected error fetching workout details: ${error}`
      )
    }
  }

  /**
   * Updates an existing workout
   */
  static async updateWorkout(
    workoutId: string,
    instructorId: string,
    updateData: UpdateWorkoutRequest
  ): Promise<WorkoutWithExercises> {
    try {
      // Verify instructor owns this workout
      await this.verifyWorkoutOwnership(workoutId, instructorId)

      // Update workout basic info
      if (updateData.name || updateData.description) {
        const { error: updateError } = await supabase
          .from('workouts')
          .update({
            name: updateData.name,
            description: updateData.description,
            updated_at: new Date().toISOString(),
          })
          .eq('id', workoutId)

        if (updateError) {
          throw new WorkoutError(
            WorkoutErrorType.NETWORK_ERROR,
            `Failed to update workout: ${updateError.message}`
          )
        }
      }

      // Update exercises if provided
      if (updateData.exercises) {
        // Delete existing exercises
        const { error: deleteError } = await supabase
          .from('workout_exercises')
          .delete()
          .eq('workout_id', workoutId)

        if (deleteError) {
          throw new WorkoutError(
            WorkoutErrorType.NETWORK_ERROR,
            `Failed to delete existing exercises: ${deleteError.message}`
          )
        }

        // Insert new exercises
        if (updateData.exercises.length > 0) {
          const workoutExercises = updateData.exercises.map(exercise => ({
            workout_id: workoutId,
            exercise_id: exercise.exerciseId,
            sets: exercise.sets,
            reps: exercise.reps,
            rest_seconds: exercise.restSeconds,
            order_index: exercise.orderIndex,
            notes: exercise.notes,
          }))

          const { error: insertError } = await supabase
            .from('workout_exercises')
            .insert(workoutExercises)

          if (insertError) {
            throw new WorkoutError(
              WorkoutErrorType.NETWORK_ERROR,
              `Failed to insert updated exercises: ${insertError.message}`
            )
          }
        }
      }

      // Log audit event
      await this.logAuditEvent('update', workoutId, instructorId, {
        updatedFields: Object.keys(updateData),
        exerciseCount: updateData.exercises?.length,
      })

      return await this.getWorkoutDetails(workoutId)
    } catch (error) {
      if (error instanceof WorkoutError) {
        throw error
      }
      throw new WorkoutError(
        WorkoutErrorType.NETWORK_ERROR,
        `Unexpected error updating workout: ${error}`
      )
    }
  }

  /**
   * Deletes a workout and all associated exercises
   */
  static async deleteWorkout(workoutId: string, instructorId: string): Promise<void> {
    try {
      // Verify instructor owns this workout
      await this.verifyWorkoutOwnership(workoutId, instructorId)

      // Delete workout exercises first (foreign key constraint)
      const { error: exercisesError } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('workout_id', workoutId)

      if (exercisesError) {
        throw new WorkoutError(
          WorkoutErrorType.NETWORK_ERROR,
          `Failed to delete workout exercises: ${exercisesError.message}`
        )
      }

      // Delete the workout
      const { error: workoutError } = await supabase.from('workouts').delete().eq('id', workoutId)

      if (workoutError) {
        throw new WorkoutError(
          WorkoutErrorType.NETWORK_ERROR,
          `Failed to delete workout: ${workoutError.message}`
        )
      }

      // Log audit event
      await this.logAuditEvent('delete', workoutId, instructorId)
    } catch (error) {
      if (error instanceof WorkoutError) {
        throw error
      }
      throw new WorkoutError(
        WorkoutErrorType.NETWORK_ERROR,
        `Unexpected error deleting workout: ${error}`
      )
    }
  }

  /**
   * Gets workouts with search and filter options
   */
  static async searchInstructorWorkouts(
    instructorId: string,
    options: {
      search?: string
      studentId?: string
      limit?: number
      offset?: number
    } = {}
  ): Promise<WorkoutWithExercises[]> {
    try {
      let query = supabase
        .from('workouts')
        .select(
          `
          *,
          student:profiles!workouts_student_id_fkey(id, full_name, email, avatar_url),
          workout_exercises(
            *,
            exercise:exercises(*)
          )
        `
        )
        .eq('instructor_id', instructorId)
        .order('created_at', { ascending: false })

      // Apply student filter
      if (options.studentId) {
        query = query.eq('student_id', options.studentId)
      }

      // Apply search filter (server-side text search)
      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`)
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit)
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) {
        throw new WorkoutError(
          WorkoutErrorType.NETWORK_ERROR,
          `Failed to search workouts: ${error.message}`
        )
      }

      return (data || []).map(this.transformWorkoutData)
    } catch (error) {
      if (error instanceof WorkoutError) {
        throw error
      }
      throw new WorkoutError(
        WorkoutErrorType.NETWORK_ERROR,
        `Unexpected error searching workouts: ${error}`
      )
    }
  }

  /**
   * Gets workout statistics for an instructor
   */
  static async getInstructorWorkoutStats(instructorId: string): Promise<{
    totalWorkouts: number
    totalStudents: number
    recentWorkouts: number
    mostActiveStudent?: Profile
  }> {
    try {
      // Get total workouts count
      const { count: totalWorkouts } = await supabase
        .from('workouts')
        .select('id', { count: 'exact', head: true })
        .eq('instructor_id', instructorId)

      // Get unique students count
      const { data: studentIds } = await supabase
        .from('workouts')
        .select('student_id')
        .eq('instructor_id', instructorId)

      const uniqueStudentIds = [...new Set(studentIds?.map(w => w.student_id) || [])]
      const totalStudents = uniqueStudentIds.length

      // Get recent workouts (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { count: recentWorkouts } = await supabase
        .from('workouts')
        .select('id', { count: 'exact', head: true })
        .eq('instructor_id', instructorId)
        .gte('created_at', sevenDaysAgo.toISOString())

      // Get most active student (student with most workouts)
      let mostActiveStudent: Profile | undefined
      if (uniqueStudentIds.length > 0) {
        const { data: workoutCounts } = await supabase
          .from('workouts')
          .select('student_id')
          .eq('instructor_id', instructorId)

        if (workoutCounts) {
          const studentWorkoutCounts = workoutCounts.reduce(
            (acc, workout) => {
              acc[workout.student_id] = (acc[workout.student_id] || 0) + 1
              return acc
            },
            {} as Record<string, number>
          )

          const mostActiveStudentId = Object.entries(studentWorkoutCounts).sort(
            ([, a], [, b]) => b - a
          )[0]?.[0]

          if (mostActiveStudentId) {
            const { data: student } = await supabase
              .from('profiles')
              .select('id, full_name, email, avatar_url')
              .eq('id', mostActiveStudentId)
              .single()

            mostActiveStudent = student || undefined
          }
        }
      }

      return {
        totalWorkouts: totalWorkouts || 0,
        totalStudents,
        recentWorkouts: recentWorkouts || 0,
        mostActiveStudent,
      }
    } catch (error) {
      console.warn('Failed to get workout stats:', error)
      return {
        totalWorkouts: 0,
        totalStudents: 0,
        recentWorkouts: 0,
      }
    }
  }

  /**
   * Duplicates an existing workout for the same or different student
   */
  static async duplicateWorkout(
    workoutId: string,
    instructorId: string,
    newStudentId?: string,
    newName?: string
  ): Promise<WorkoutWithExercises> {
    try {
      // Get the original workout
      const originalWorkout = await this.getWorkoutDetails(workoutId)

      // Verify instructor owns the original workout
      if (originalWorkout.instructor_id !== instructorId) {
        throw new WorkoutError(
          WorkoutErrorType.PERMISSION_ERROR,
          'You can only duplicate your own workouts'
        )
      }

      // Create the duplicate
      const duplicateData: CreateWorkoutRequest = {
        name: newName || `${originalWorkout.name} (Cópia)`,
        description: originalWorkout.description,
        studentId: newStudentId || originalWorkout.student_id,
        exercises: originalWorkout.exercises.map(we => ({
          exerciseId: we.exercise_id,
          sets: we.sets,
          reps: we.reps,
          restSeconds: we.rest_seconds,
          orderIndex: we.order_index,
          notes: we.notes,
        })),
      }

      const duplicatedWorkout = await this.createWorkout(instructorId, duplicateData)

      // Log audit event
      await this.logAuditEvent('duplicate', workoutId, instructorId, {
        originalWorkoutId: workoutId,
        newWorkoutId: duplicatedWorkout.id,
        newStudentId: newStudentId || originalWorkout.student_id,
        newName: newName || duplicateData.name,
      })

      return duplicatedWorkout
    } catch (error) {
      if (error instanceof WorkoutError) {
        throw error
      }
      throw new WorkoutError(
        WorkoutErrorType.NETWORK_ERROR,
        `Unexpected error duplicating workout: ${error}`
      )
    }
  }

  /**
   * Logs audit events for critical workout operations
   */
  private static async logAuditEvent(
    action: 'create' | 'update' | 'delete' | 'duplicate',
    workoutId: string,
    instructorId: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      // In a production app, you would send this to an audit logging service
      // For now, we'll just log to console and could store in a separate audit table
      const auditLog = {
        timestamp: new Date().toISOString(),
        action,
        workoutId,
        instructorId,
        details: details || {},
        userAgent: 'FitFlow Mobile App', // In web, you'd get this from navigator.userAgent
        ip: 'mobile-device', // In web, you'd get the actual IP
      }

      console.log('Workout Audit Log:', auditLog)

      // TODO: In production, send to audit service or store in audit_logs table
      // await supabase.from('audit_logs').insert(auditLog)
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      console.warn('Failed to log audit event:', error)
    }
  }

  // Private helper methods

  private static validateCreateWorkoutRequest(data: CreateWorkoutRequest): void {
    if (!data.name?.trim()) {
      throw new WorkoutError(WorkoutErrorType.VALIDATION_ERROR, 'Workout name is required', 'name')
    }

    if (!data.studentId?.trim()) {
      throw new WorkoutError(
        WorkoutErrorType.VALIDATION_ERROR,
        'Student selection is required',
        'studentId'
      )
    }

    if (!data.exercises || data.exercises.length === 0) {
      throw new WorkoutError(
        WorkoutErrorType.VALIDATION_ERROR,
        'At least one exercise is required',
        'exercises'
      )
    }

    // Validate each exercise
    data.exercises.forEach((exercise, index) => {
      if (!exercise.exerciseId) {
        throw new WorkoutError(
          WorkoutErrorType.VALIDATION_ERROR,
          `Exercise ${index + 1}: Exercise selection is required`,
          `exercises.${index}.exerciseId`
        )
      }

      if (!exercise.sets || exercise.sets < 1) {
        throw new WorkoutError(
          WorkoutErrorType.VALIDATION_ERROR,
          `Exercise ${index + 1}: Number of sets must be at least 1`,
          `exercises.${index}.sets`
        )
      }

      if (!exercise.reps?.trim()) {
        throw new WorkoutError(
          WorkoutErrorType.VALIDATION_ERROR,
          `Exercise ${index + 1}: Repetitions are required`,
          `exercises.${index}.reps`
        )
      }

      if (exercise.restSeconds < 0) {
        throw new WorkoutError(
          WorkoutErrorType.VALIDATION_ERROR,
          `Exercise ${index + 1}: Rest time cannot be negative`,
          `exercises.${index}.restSeconds`
        )
      }
    })
  }

  private static async verifyInstructorStudentRelation(
    instructorId: string,
    studentId: string
  ): Promise<void> {
    const { data, error } = await supabase
      .from('profiles')
      .select('instructor_id')
      .eq('id', studentId)
      .single()

    if (error) {
      throw new WorkoutError(WorkoutErrorType.NOT_FOUND_ERROR, 'Student not found')
    }

    if (data.instructor_id !== instructorId) {
      throw new WorkoutError(
        WorkoutErrorType.PERMISSION_ERROR,
        'You can only create workouts for your own students'
      )
    }
  }

  private static async verifyWorkoutOwnership(
    workoutId: string,
    instructorId: string
  ): Promise<void> {
    const { data, error } = await supabase
      .from('workouts')
      .select('instructor_id')
      .eq('id', workoutId)
      .single()

    if (error) {
      throw new WorkoutError(WorkoutErrorType.NOT_FOUND_ERROR, 'Workout not found')
    }

    if (data.instructor_id !== instructorId) {
      throw new WorkoutError(
        WorkoutErrorType.PERMISSION_ERROR,
        'You can only modify your own workouts'
      )
    }
  }

  private static transformWorkoutData(data: any): WorkoutWithExercises {
    return {
      ...data,
      exercises: (data.exercises || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((we: any) => ({
          ...we,
          exercise: we.exercise,
        })),
    }
  }
}
