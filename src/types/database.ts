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

// Form state types for workout creation
export interface WorkoutFormState {
  name: string
  description: string
  studentId: string
  selectedExercises: WorkoutExerciseConfig[]
  loading: boolean
  error: string | null
  currentStep: WorkoutCreationStep
}

export interface WorkoutExerciseConfig {
  exerciseId: string
  exercise: Exercise
  sets: number
  reps: string
  restSeconds: number
  orderIndex: number
  notes?: string
}

export enum WorkoutCreationStep {
  BASIC_INFO = 'basic_info',
  EXERCISE_SELECTION = 'exercise_selection',
  EXERCISE_CONFIGURATION = 'exercise_configuration',
  PREVIEW = 'preview'
}

// Error handling types
export enum WorkoutErrorType {
  VALIDATION_ERROR = 'validation_error',
  NETWORK_ERROR = 'network_error',
  PERMISSION_ERROR = 'permission_error',
  NOT_FOUND_ERROR = 'not_found_error'
}

export interface WorkoutValidationError {
  type: WorkoutErrorType.VALIDATION_ERROR
  message: string
  field?: string
}

export interface WorkoutNetworkError {
  type: WorkoutErrorType.NETWORK_ERROR
  message: string
}

export interface WorkoutPermissionError {
  type: WorkoutErrorType.PERMISSION_ERROR
  message: string
}

export interface WorkoutNotFoundError {
  type: WorkoutErrorType.NOT_FOUND_ERROR
  message: string
}

export type WorkoutError = 
  | WorkoutValidationError 
  | WorkoutNetworkError 
  | WorkoutPermissionError 
  | WorkoutNotFoundError

// Component prop types
export interface CreateWorkoutModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: (workout: WorkoutWithExercises) => void
  instructorStudents: Profile[]
  editingWorkout?: WorkoutWithExercises | null
}

export interface ExerciseSelectionStepProps {
  selectedExercises: WorkoutExerciseConfig[]
  onExerciseAdd: (exercise: Exercise) => void
  onExerciseRemove: (exerciseId: string) => void
  onExerciseReorder: (exercises: WorkoutExerciseConfig[]) => void
}

export interface ExerciseConfigurationStepProps {
  exercises: WorkoutExerciseConfig[]
  onExerciseUpdate: (exerciseId: string, config: Partial<WorkoutExerciseConfig>) => void
  onValidationChange: (isValid: boolean) => void
}

export interface WorkoutDetailsModalProps {
  visible: boolean
  workout?: WorkoutWithExercises | null
  workoutId?: string
  onClose: () => void
  onStartWorkout?: () => void // Future implementation
}

export interface WorkoutCardProps {
  workout: Workout | WorkoutWithExercises
  onPress: () => void
  showStudent?: boolean // For instructor view
  showInstructor?: boolean // For student view
  onEdit?: (workout: Workout) => void
  onDelete?: (workout: Workout) => void
  onDuplicate?: (workout: Workout) => void
}

// UI State types
export interface WorkoutListState {
  workouts: WorkoutWithExercises[]
  loading: boolean
  error: string | null
  refreshing: boolean
  selectedWorkout: WorkoutWithExercises | null
  showDetails: boolean
}

export interface ExerciseSelectionState {
  exercises: Exercise[]
  loading: boolean
  error: string | null
  search: string
  selectedGroup: string | null
  selectedExercises: Set<string>
}

export interface WorkoutFormValidation {
  name: boolean
  studentId: boolean
  exercises: boolean
  exerciseConfigs: Record<string, {
    sets: boolean
    reps: boolean
    restSeconds: boolean
  }>
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
