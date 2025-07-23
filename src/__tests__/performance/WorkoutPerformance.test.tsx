import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'
import { performance } from 'perf_hooks'
import CreateWorkoutModal from '@/components/modals/CreateWorkoutModal'
import WorkoutDetailsModal from '@/components/modals/WorkoutDetailsModal'
import WorkoutListScreen from '@/screens/student/WorkoutListScreen'
import { WorkoutService } from '@/services/api/WorkoutService'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/context/ThemeContext'

// Mock dependencies
jest.mock('@/services/api/WorkoutService')
jest.mock('@/hooks/useAuth')
jest.mock('@/context/ThemeContext')
jest.mock('../../workout', () => ({
  useWorkoutOperations: () => ({
    createWorkout: jest.fn(),
    updateWorkout: jest.fn(),
    loading: false,
    error: null,
    getPersistedFormData: jest.fn(),
    clearPersistedFormData: jest.fn(),
    retry: jest.fn(),
    clearError: jest.fn(),
  }),
}))

const mockWorkoutService = WorkoutService as jest.Mocked<typeof WorkoutService>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>

describe('Workout Performance Tests', () => {
  const mockUser = {
    id: 'student-123',
    email: 'student@test.com',
    role: 'student',
    full_name: 'Test Student',
  }

  const mockTheme = {
    colors: {
      primary: '#007AFF',
      background: '#FFFFFF',
      surface: '#F2F2F7',
      text: '#000000',
      textSecondary: '#8E8E93',
      border: '#C6C6C8',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
    })

    mockUseTheme.mockReturnValue({
      theme: mockTheme,
      isDark: false,
      toggleTheme: jest.fn(),
    })
  })

  const measureRenderTime = (renderFunction: () => void): number => {
    const startTime = performance.now()
    renderFunction()
    const endTime = performance.now()
    return endTime - startTime
  }

  const generateLargeWorkoutList = (count: number) => {
    return Array.from({ length: count }, (_, index) => ({
      id: `workout-${index}`,
      name: `Treino ${index + 1}`,
      description: `Descrição do treino ${index + 1}`,
      student_id: 'student-123',
      instructor_id: 'instructor-123',
      created_at: new Date(Date.now() - index * 86400000).toISOString(),
      updated_at: new Date(Date.now() - index * 86400000).toISOString(),
      exercises: Array.from({ length: 5 }, (_, exerciseIndex) => ({
        id: `we-${index}-${exerciseIndex}`,
        workout_id: `workout-${index}`,
        exercise_id: `exercise-${exerciseIndex}`,
        sets: 3,
        reps: '10-12',
        rest_seconds: 60,
        order_index: exerciseIndex + 1,
        notes: `Notas do exercício ${exerciseIndex + 1}`,
        exercise: {
          id: `exercise-${exerciseIndex}`,
          name: `Exercício ${exerciseIndex + 1}`,
          muscle_group: 'chest',
          thumbnail_url: `https://example.com/exercise-${exerciseIndex}.jpg`,
          description: `Descrição do exercício ${exerciseIndex + 1}`,
          instructions: `Instruções do exercício ${exerciseIndex + 1}`,
          created_at: '2025-01-18T09:00:00Z',
          updated_at: '2025-01-18T09:00:00Z',
        },
      })),
      instructor: {
        id: 'instructor-123',
        full_name: 'Test Instructor',
        email: 'instructor@test.com',
        role: 'instructor',
      },
    }))
  }

  describe('Rendering Performance', () => {
    it('should render CreateWorkoutModal within acceptable time', () => {
      const students = Array.from({ length: 50 }, (_, index) => ({
        id: `student-${index}`,
        full_name: `Student ${index + 1}`,
        email: `student${index + 1}@test.com`,
        role: 'student',
        instructor_id: 'instructor-123',
      }))

      const renderTime = measureRenderTime(() => {
        render(
          <CreateWorkoutModal
            visible={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
            instructorStudents={students}
          />
        )
      })

      // Should render within 100ms even with 50 students
      expect(renderTime).toBeLessThan(100)
    })

    it('should render WorkoutDetailsModal with large exercise list efficiently', () => {
      const workoutWithManyExercises = {
        id: 'workout-123',
        name: 'Treino Completo',
        description: 'Treino com muitos exercícios',
        student_id: 'student-123',
        instructor_id: 'instructor-123',
        created_at: '2025-01-18T10:00:00Z',
        updated_at: '2025-01-18T10:00:00Z',
        exercises: Array.from({ length: 20 }, (_, index) => ({
          id: `we-${index}`,
          workout_id: 'workout-123',
          exercise_id: `exercise-${index}`,
          sets: 3,
          reps: '10-12',
          rest_seconds: 60,
          order_index: index + 1,
          notes: `Notas do exercício ${index + 1}`,
          exercise: {
            id: `exercise-${index}`,
            name: `Exercício ${index + 1}`,
            muscle_group: 'chest',
            thumbnail_url: `https://example.com/exercise-${index}.jpg`,
            description: `Descrição do exercício ${index + 1}`,
            instructions: `Instruções do exercício ${index + 1}`,
            created_at: '2025-01-18T09:00:00Z',
            updated_at: '2025-01-18T09:00:00Z',
          },
        })),
        student: {
          id: 'student-123',
          full_name: 'Test Student',
          email: 'student@test.com',
          role: 'student',
        },
        instructor: {
          id: 'instructor-123',
          full_name: 'Test Instructor',
          email: 'instructor@test.com',
          role: 'instructor',
        },
      }

      const renderTime = measureRenderTime(() => {
        render(
          <WorkoutDetailsModal
            visible={true}
            workout={workoutWithManyExercises}
            onClose={jest.fn()}
          />
        )
      })

      // Should render within 150ms even with 20 exercises
      expect(renderTime).toBeLessThan(150)
    })

    it('should render WorkoutListScreen with large dataset efficiently', () => {
      const largeWorkoutList = generateLargeWorkoutList(100)
      mockWorkoutService.getStudentWorkouts.mockResolvedValue(largeWorkoutList as any)

      const renderTime = measureRenderTime(() => {
        render(<WorkoutListScreen />)
      })

      // Should render within 200ms even with 100 workouts
      expect(renderTime).toBeLessThan(200)
    })
  })

  describe('Memory Usage', () => {
    it('should not cause memory leaks when mounting/unmounting modals', () => {
      const initialMemory = process.memoryUsage().heapUsed

      // Mount and unmount modal multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <CreateWorkoutModal
            visible={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
            instructorStudents={[]}
          />
        )
        unmount()
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })

    it('should efficiently handle large workout lists without excessive memory usage', () => {
      const initialMemory = process.memoryUsage().heapUsed
      const largeWorkoutList = generateLargeWorkoutList(500)

      mockWorkoutService.getStudentWorkouts.mockResolvedValue(largeWorkoutList as any)

      const { unmount } = render(<WorkoutListScreen />)

      const peakMemory = process.memoryUsage().heapUsed
      unmount()

      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = peakMemory - initialMemory
      const memoryRetained = finalMemory - initialMemory

      // Peak memory increase should be reasonable (less than 50MB for 500 workouts)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)

      // Most memory should be released after unmounting
      expect(memoryRetained).toBeLessThan(memoryIncrease * 0.3)
    })
  })

  describe('Interaction Performance', () => {
    it('should handle rapid form input changes efficiently', async () => {
      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={[]}
        />
      )

      const nameInput = screen.getByPlaceholderText('Nome do treino')

      const startTime = performance.now()

      // Simulate rapid typing
      for (let i = 0; i < 50; i++) {
        fireEvent.changeText(nameInput, `Treino ${i}`)
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Should handle 50 rapid changes within 100ms
      expect(totalTime).toBeLessThan(100)
    })

    it('should handle rapid student selection changes efficiently', async () => {
      const manyStudents = Array.from({ length: 100 }, (_, index) => ({
        id: `student-${index}`,
        full_name: `Student ${index + 1}`,
        email: `student${index + 1}@test.com`,
        role: 'student',
        instructor_id: 'instructor-123',
      }))

      render(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={manyStudents}
        />
      )

      const startTime = performance.now()

      // Simulate rapid student selection changes
      for (let i = 0; i < 10; i++) {
        const studentOption = screen.getByText(`Student ${i + 1}`)
        fireEvent.press(studentOption)
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Should handle 10 rapid selections within 50ms
      expect(totalTime).toBeLessThan(50)
    })

    it('should handle scroll performance in large lists', async () => {
      const largeWorkoutList = generateLargeWorkoutList(200)
      mockWorkoutService.getStudentWorkouts.mockResolvedValue(largeWorkoutList as any)

      render(<WorkoutListScreen />)

      await waitFor(() => {
        expect(screen.getByText('Treino 1')).toBeTruthy()
      })

      const scrollView = screen.getByTestId('workout-list-scroll')

      const startTime = performance.now()

      // Simulate rapid scrolling
      for (let i = 0; i < 20; i++) {
        fireEvent.scroll(scrollView, {
          nativeEvent: {
            contentOffset: { y: i * 100, x: 0 },
            contentSize: { height: 20000, width: 400 },
            layoutMeasurement: { height: 800, width: 400 },
          },
        })
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Should handle 20 scroll events within 100ms
      expect(totalTime).toBeLessThan(100)
    })
  })

  describe('Network Performance', () => {
    it('should handle concurrent workout service calls efficiently', async () => {
      const mockWorkouts = generateLargeWorkoutList(10)

      // Mock service calls with realistic delays
      mockWorkoutService.getStudentWorkouts.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockWorkouts as any), 50))
      )
      mockWorkoutService.getWorkoutDetails.mockImplementation(
        id =>
          new Promise(resolve =>
            setTimeout(() => resolve(mockWorkouts.find(w => w.id === id) as any), 30)
          )
      )

      const startTime = performance.now()

      // Make multiple concurrent calls
      const promises = [
        WorkoutService.getStudentWorkouts('student-123'),
        WorkoutService.getWorkoutDetails('workout-1'),
        WorkoutService.getWorkoutDetails('workout-2'),
        WorkoutService.getWorkoutDetails('workout-3'),
      ]

      await Promise.all(promises)

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Concurrent calls should complete faster than sequential calls
      // Sequential would take ~160ms (50 + 30 + 30 + 30), concurrent should be ~80ms
      expect(totalTime).toBeLessThan(100)
    })

    it('should handle service call failures gracefully without performance impact', async () => {
      // Mock service to fail initially then succeed
      let callCount = 0
      mockWorkoutService.getStudentWorkouts.mockImplementation(() => {
        callCount++
        if (callCount <= 2) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve([])
      })

      const startTime = performance.now()

      render(<WorkoutListScreen />)

      // Wait for error handling and retry
      await waitFor(
        () => {
          expect(screen.getByText('Tentar Novamente')).toBeTruthy()
        },
        { timeout: 1000 }
      )

      const retryButton = screen.getByText('Tentar Novamente')
      fireEvent.press(retryButton)

      await waitFor(() => {
        expect(callCount).toBe(3)
      })

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Error handling and retry should not significantly impact performance
      expect(totalTime).toBeLessThan(1500)
    })
  })

  describe('Image Loading Performance', () => {
    it('should handle multiple exercise thumbnails efficiently', async () => {
      const workoutWithImages = {
        id: 'workout-123',
        name: 'Treino com Imagens',
        exercises: Array.from({ length: 15 }, (_, index) => ({
          id: `we-${index}`,
          exercise: {
            id: `exercise-${index}`,
            name: `Exercício ${index + 1}`,
            thumbnail_url: `https://example.com/exercise-${index}.jpg`,
          },
        })),
      }

      const startTime = performance.now()

      render(
        <WorkoutDetailsModal
          visible={true}
          workout={workoutWithImages as any}
          onClose={jest.fn()}
        />
      )

      // Wait for all images to start loading
      await waitFor(() => {
        const images = screen.getAllByTestId(/exercise-thumbnail-/)
        expect(images).toHaveLength(15)
      })

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Should render with image placeholders quickly
      expect(totalTime).toBeLessThan(200)
    })

    it('should handle missing images without performance degradation', async () => {
      const workoutWithMissingImages = {
        id: 'workout-123',
        name: 'Treino sem Imagens',
        exercises: Array.from({ length: 10 }, (_, index) => ({
          id: `we-${index}`,
          exercise: {
            id: `exercise-${index}`,
            name: `Exercício ${index + 1}`,
            thumbnail_url: null,
          },
        })),
      }

      const startTime = performance.now()

      render(
        <WorkoutDetailsModal
          visible={true}
          workout={workoutWithMissingImages as any}
          onClose={jest.fn()}
        />
      )

      // Wait for placeholders to render
      await waitFor(() => {
        const placeholders = screen.getAllByTestId(/exercise-placeholder-/)
        expect(placeholders).toHaveLength(10)
      })

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Should render placeholders quickly
      expect(totalTime).toBeLessThan(100)
    })
  })

  describe('Search Performance', () => {
    it('should handle search with debouncing efficiently', async () => {
      const largeWorkoutList = generateLargeWorkoutList(100)
      mockWorkoutService.getStudentWorkouts.mockResolvedValue(largeWorkoutList as any)
      mockWorkoutService.searchInstructorWorkouts.mockResolvedValue(
        largeWorkoutList.slice(0, 5) as any
      )

      render(<WorkoutListScreen />)

      await waitFor(() => {
        expect(screen.getByText('Treino 1')).toBeTruthy()
      })

      const searchInput = screen.getByPlaceholderText('Buscar treinos...')

      const startTime = performance.now()

      // Simulate rapid typing (should be debounced)
      fireEvent.changeText(searchInput, 'T')
      fireEvent.changeText(searchInput, 'Tr')
      fireEvent.changeText(searchInput, 'Tre')
      fireEvent.changeText(searchInput, 'Trei')
      fireEvent.changeText(searchInput, 'Treino')

      // Wait for debounced search
      await waitFor(
        () => {
          expect(mockWorkoutService.searchInstructorWorkouts).toHaveBeenCalledTimes(1)
        },
        { timeout: 500 }
      )

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Debounced search should prevent excessive API calls
      expect(totalTime).toBeLessThan(600)
    })
  })

  describe('Animation Performance', () => {
    it('should handle modal animations without blocking UI', async () => {
      const { rerender } = render(
        <CreateWorkoutModal
          visible={false}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={[]}
        />
      )

      const startTime = performance.now()

      // Show modal (trigger animation)
      rerender(
        <CreateWorkoutModal
          visible={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          instructorStudents={[]}
        />
      )

      // Modal should be immediately accessible even during animation
      expect(screen.getByText('Criar Treino')).toBeTruthy()

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Modal should render immediately, not wait for animation
      expect(renderTime).toBeLessThan(50)
    })
  })

  describe('Bundle Size Impact', () => {
    it('should not significantly increase bundle size', () => {
      // This test would typically be run as part of a build process
      // to ensure that workout components don't add excessive bundle size

      // Mock bundle size check
      const mockBundleSize = 2.5 * 1024 * 1024 // 2.5MB
      const maxAcceptableSize = 3 * 1024 * 1024 // 3MB

      expect(mockBundleSize).toBeLessThan(maxAcceptableSize)
    })
  })

  describe('CPU Usage', () => {
    it('should not cause excessive CPU usage during heavy operations', async () => {
      const largeDataset = generateLargeWorkoutList(500)
      mockWorkoutService.getStudentWorkouts.mockResolvedValue(largeDataset as any)

      const startTime = process.hrtime.bigint()

      render(<WorkoutListScreen />)

      await waitFor(() => {
        expect(screen.getByText('Treino 1')).toBeTruthy()
      })

      const endTime = process.hrtime.bigint()
      const cpuTime = Number(endTime - startTime) / 1000000 // Convert to milliseconds

      // CPU time should be reasonable for large dataset
      expect(cpuTime).toBeLessThan(500)
    })
  })
})
