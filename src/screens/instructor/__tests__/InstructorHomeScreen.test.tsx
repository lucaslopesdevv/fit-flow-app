import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import InstructorHomeScreen from '../InstructorHomeScreen'
import { useAuth } from '@/hooks/useAuth'
import { WorkoutService } from '@/services/api/WorkoutService'

// Mock dependencies
jest.mock('@/hooks/useAuth')
jest.mock('@/services/api/WorkoutService')
jest.mock('@/services/supabase/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null
        }))
      }))
    }))
  }
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockWorkoutService = WorkoutService as jest.Mocked<typeof WorkoutService>

describe('InstructorHomeScreen', () => {
  const mockUser = {
    id: 'instructor-1',
    email: 'instructor@test.com',
    role: 'instructor' as const
  }

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn()
    })

    mockWorkoutService.getInstructorWorkouts = jest.fn().mockResolvedValue([])
    
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders create workout button', async () => {
    const { getByText } = render(<InstructorHomeScreen />)
    
    await waitFor(() => {
      expect(getByText('Criar Treino')).toBeTruthy()
    })
  })

  it('shows alert when create workout is pressed with no students', async () => {
    const { getByText } = render(<InstructorHomeScreen />)
    
    await waitFor(() => {
      const createButton = getByText('Criar Treino')
      fireEvent.press(createButton)
    })

    expect(Alert.alert).toHaveBeenCalledWith(
      'Nenhum aluno encontrado',
      'Você precisa ter alunos cadastrados para criar treinos. Cadastre alunos primeiro.',
      [{ text: 'OK' }]
    )
  })

  it('displays recent workouts section', async () => {
    const { getByText } = render(<InstructorHomeScreen />)
    
    await waitFor(() => {
      expect(getByText('Treinos Recentes')).toBeTruthy()
    })
  })

  it('displays KPI cards', async () => {
    const { getByText } = render(<InstructorHomeScreen />)
    
    await waitFor(() => {
      expect(getByText('Alunos')).toBeTruthy()
      expect(getByText('Treinos')).toBeTruthy()
      expect(getByText('Execuções')).toBeTruthy()
    })
  })
})