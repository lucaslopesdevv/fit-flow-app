export type UserRole = "admin" | "instructor" | "student"

export interface User {
  id: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  full_name: string
  phone?: string
  avatar_url?: string
  instructor_id?: string
  role?: UserRole
  email: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface Exercise {
  id: string
  name: string
  description?: string
  muscle_group: string
  video_url?: string
  thumbnail_url?: string
  created_by: string
  created_at: string
}

export interface Workout {
  id: string
  student_id: string
  instructor_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface WorkoutExercise {
  id: string
  workout_id: string
  exercise_id: string
  sets: number
  reps: string
  rest_seconds: number
  order_index: number
  notes?: string
}

export interface WorkoutLog {
  id: string
  workout_id: string
  student_id: string
  completed_at: string
  notes?: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, "created_at" | "updated_at">
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>
      }
      exercises: {
        Row: Exercise
        Insert: Omit<Exercise, "id" | "created_at">
        Update: Partial<Omit<Exercise, "id" | "created_at">>
      }
      workouts: {
        Row: Workout
        Insert: Omit<Workout, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Workout, "id" | "created_at" | "updated_at">>
      }
      workout_exercises: {
        Row: WorkoutExercise
        Insert: Omit<WorkoutExercise, "id">
        Update: Partial<Omit<WorkoutExercise, "id">>
      }
      workout_logs: {
        Row: WorkoutLog
        Insert: Omit<WorkoutLog, "id">
        Update: Partial<Omit<WorkoutLog, "id">>
      }
    }
  }
}
