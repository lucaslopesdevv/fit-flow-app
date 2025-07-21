import { supabase } from '@/services/supabase/supabase'
import { Profile, Workout, WorkoutLog, Exercise, WorkoutExercise } from '@/types/database'

export interface WorkoutWithExercises extends Workout {
  workout_exercises: (WorkoutExercise & {
    exercise: Exercise
  })[]
}

export interface StudentStats {
  totalWorkouts: number
  completedWorkouts: number
  completionRate: number
  currentStreak: number
  longestStreak: number
}

export interface StudentInvitation {
  email: string
  full_name: string
  phone?: string
}

export interface InvitationResponse {
  success: boolean
  invitation_data?: {
    email: string
    full_name: string
    phone?: string
    avatar_url?: string
    instructor_id: string
    instructor_name: string
    instructor_email: string
  }
  error?: string
}

export class StudentService {
  /**
   * Invite a new student (instructor only)
   */
  static async inviteStudent(invitation: StudentInvitation): Promise<InvitationResponse> {
    try {
      // Get the current session to pass the auth token
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        return {
          success: false,
          error: 'User must be authenticated',
        }
      }

      // Call the Edge Function to invite the student
      const { data, error } = await supabase.functions.invoke('invite-student', {
        body: {
          email: invitation.email,
          full_name: invitation.full_name,
          phone: invitation.phone || null,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (error) {
        console.error('Error inviting student:', error)
        return {
          success: false,
          error: error.message || 'Failed to invite student',
        }
      }

      if (data.error) {
        return {
          success: false,
          error: data.error,
        }
      }

      return {
        success: true,
        invitation_data: {
          email: invitation.email,
          full_name: invitation.full_name,
          phone: invitation.phone,
          instructor_id: session.user.id,
          instructor_name: '',
          instructor_email: session.user.email || '',
        },
      }
    } catch (error: any) {
      console.error('Error inviting student:', error)
      return {
        success: false,
        error: error.message || 'Failed to invite student',
      }
    }
  }

  /**
   * Get all students for the current instructor
   */
  static async getInstructorStudents(
    instructorId?: string,
    includeInactive: boolean = false
  ): Promise<Profile[]> {
    try {
      const { data, error } = await supabase.rpc('get_instructor_students', {
        p_instructor_id: instructorId || null,
        p_include_inactive: includeInactive,
      })

      if (error) {
        console.error('Error fetching instructor students:', error)
        throw new Error('Failed to fetch students')
      }

      return data || []
    } catch (error: any) {
      console.error('Error fetching instructor students:', error)
      throw new Error(error.message || 'Failed to fetch students')
    }
  }

  /**
   * Update student information (uses secure database function)
   */
  static async updateStudent(studentId: string, updates: Partial<Profile>): Promise<Profile> {
    try {
      const { data, error } = await supabase.rpc('update_student_profile', {
        p_student_id: studentId,
        p_full_name: updates.full_name || null,
        p_phone: updates.phone || null,
        p_avatar_url: updates.avatar_url || null,
      })

      if (error) {
        console.error('Error updating student:', error)
        throw new Error('Failed to update student')
      }

      return data
    } catch (error: any) {
      console.error('Error updating student:', error)
      throw new Error(error.message || 'Failed to update student')
    }
  }

  /**
   * Get student profile by user ID (with RLS compliance)
   */
  static async getStudentProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Profile not found
        }
        console.error('Error fetching student profile:', error)
        throw new Error('Failed to fetch student profile')
      }

      return data
    } catch (error: any) {
      console.error('Error fetching student profile:', error)
      throw new Error(error.message || 'Failed to fetch student profile')
    }
  }

  /**
   * Activate a student (instructor only)
   */
  static async activateStudent(studentId: string): Promise<Profile> {
    try {
      const { data, error } = await supabase.rpc('update_student_status', {
        p_student_id: studentId,
        p_is_active: true,
      })

      if (error) {
        console.error('Error activating student:', error)
        throw new Error('Failed to activate student')
      }

      return data
    } catch (error: any) {
      console.error('Error activating student:', error)
      throw new Error(error.message || 'Failed to activate student')
    }
  }

  /**
   * Deactivate a student (instructor only)
   */
  static async deactivateStudent(studentId: string): Promise<Profile> {
    try {
      const { data, error } = await supabase.rpc('update_student_status', {
        p_student_id: studentId,
        p_is_active: false,
      })

      if (error) {
        console.error('Error deactivating student:', error)
        throw new Error('Failed to deactivate student')
      }

      return data
    } catch (error: any) {
      console.error('Error deactivating student:', error)
      throw new Error(error.message || 'Failed to deactivate student')
    }
  }

  /**
   * Get all workouts assigned to a student (with RLS compliance)
   */
  static async getStudentWorkouts(studentId: string): Promise<WorkoutWithExercises[]> {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select(
          `
          *,
          workout_exercises (
            *,
            exercise:exercises (*)
          )
        `
        )
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching student workouts:', error)
        throw new Error('Failed to fetch student workouts')
      }

      return data as WorkoutWithExercises[]
    } catch (error: any) {
      console.error('Error fetching student workouts:', error)
      throw new Error(error.message || 'Failed to fetch student workouts')
    }
  }

  /**
   * Get a specific workout with exercises for a student (with RLS compliance)
   */
  static async getStudentWorkout(
    workoutId: string,
    studentId: string
  ): Promise<WorkoutWithExercises | null> {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select(
          `
          *,
          workout_exercises (
            *,
            exercise:exercises (*)
          )
        `
        )
        .eq('id', workoutId)
        .eq('student_id', studentId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Workout not found
        }
        console.error('Error fetching student workout:', error)
        throw new Error('Failed to fetch student workout')
      }

      return data as WorkoutWithExercises
    } catch (error: any) {
      console.error('Error fetching student workout:', error)
      throw new Error(error.message || 'Failed to fetch student workout')
    }
  }

  /**
   * Log a completed workout (with RLS compliance)
   */
  static async logWorkout(
    workoutId: string,
    studentId: string,
    notes?: string
  ): Promise<WorkoutLog> {
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .insert({
          workout_id: workoutId,
          student_id: studentId,
          completed_at: new Date().toISOString(),
          notes,
        })
        .select()
        .single()

      if (error) {
        console.error('Error logging workout:', error)
        throw new Error('Failed to log workout')
      }

      return data
    } catch (error: any) {
      console.error('Error logging workout:', error)
      throw new Error(error.message || 'Failed to log workout')
    }
  }

  /**
   * Get workout logs for a student (with RLS compliance)
   */
  static async getWorkoutLogs(studentId: string, limit?: number): Promise<WorkoutLog[]> {
    try {
      let query = supabase
        .from('workout_logs')
        .select('*')
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching workout logs:', error)
        throw new Error('Failed to fetch workout logs')
      }

      return data || []
    } catch (error: any) {
      console.error('Error fetching workout logs:', error)
      throw new Error(error.message || 'Failed to fetch workout logs')
    }
  }

  /**
   * Check if a workout has been completed by the student (with RLS compliance)
   */
  static async isWorkoutCompleted(workoutId: string, studentId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('id')
        .eq('workout_id', workoutId)
        .eq('student_id', studentId)
        .limit(1)

      if (error) {
        console.error('Error checking workout completion:', error)
        return false
      }

      return (data || []).length > 0
    } catch (error: any) {
      console.error('Error checking workout completion:', error)
      return false
    }
  }

  /**
   * Get student statistics (with RLS compliance)
   */
  static async getStudentStats(studentId: string): Promise<StudentStats> {
    try {
      // Get total assigned workouts
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('id')
        .eq('student_id', studentId)

      if (workoutsError) {
        console.error('Error fetching workouts for stats:', workoutsError)
        throw new Error('Failed to fetch student statistics')
      }

      // Get completed workout logs
      const { data: logs, error: logsError } = await supabase
        .from('workout_logs')
        .select('completed_at')
        .eq('student_id', studentId)
        .order('completed_at', { ascending: true })

      if (logsError) {
        console.error('Error fetching workout logs for stats:', logsError)
        throw new Error('Failed to fetch student statistics')
      }

      const totalWorkouts = (workouts || []).length
      const completedWorkouts = (logs || []).length
      const completionRate = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0

      // Calculate streaks
      const { currentStreak, longestStreak } = this.calculateStreaks(
        (logs || []).map(log => log.completed_at)
      )

      return {
        totalWorkouts,
        completedWorkouts,
        completionRate: Math.round(completionRate * 100) / 100,
        currentStreak,
        longestStreak,
      }
    } catch (error: any) {
      console.error('Error fetching student statistics:', error)
      throw new Error(error.message || 'Failed to fetch student statistics')
    }
  } /**

   * Calculate workout streaks based on completion dates
   */
  private static calculateStreaks(completedDates: string[]): {
    currentStreak: number
    longestStreak: number
  } {
    if (completedDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 }
    }

    // Convert to dates and sort
    const dates = completedDates
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => a.getTime() - b.getTime())

    // Group by day (ignore time)
    const uniqueDays = Array.from(new Set(dates.map(date => date.toDateString()))).map(
      dateStr => new Date(dateStr)
    )

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 1

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Calculate current streak (working backwards from today)
    for (let i = uniqueDays.length - 1; i >= 0; i--) {
      const daysDiff = Math.floor(
        (today.getTime() - uniqueDays[i].getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysDiff === currentStreak) {
        currentStreak++
      } else if (daysDiff === currentStreak + 1 && currentStreak === 0) {
        // Allow for yesterday if no workout today
        currentStreak++
      } else {
        break
      }
    }

    // Calculate longest streak
    for (let i = 1; i < uniqueDays.length; i++) {
      const daysDiff = Math.floor(
        (uniqueDays[i].getTime() - uniqueDays[i - 1].getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysDiff === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak)

    return { currentStreak, longestStreak }
  }

  /**
   * Get recent workout activity for a student (with RLS compliance)
   */
  static async getRecentActivity(studentId: string, days: number = 30): Promise<WorkoutLog[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('workout_logs')
        .select(
          `
          *,
          workout:workouts (
            name,
            description
          )
        `
        )
        .eq('student_id', studentId)
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: false })

      if (error) {
        console.error('Error fetching recent activity:', error)
        throw new Error('Failed to fetch recent activity')
      }

      return data || []
    } catch (error: any) {
      console.error('Error fetching recent activity:', error)
      throw new Error(error.message || 'Failed to fetch recent activity')
    }
  }
}
