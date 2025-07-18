import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { InviteStudentModal } from '../InviteStudentModal'
import { StudentService } from '@/services/api/StudentService'

// Mock the StudentService
jest.mock('@/services/api/StudentService', () => ({
  StudentService: {
    inviteStudent: jest.fn(),
  },
}))

// Mock Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native')
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  }
})

const mockProps = {
  visible: true,
  onClose: jest.fn(),
  onSuccess: jest.fn(),
}

describe('InviteStudentModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly when visible', () => {
    const { getByText, getByDisplayValue } = render(
      <InviteStudentModal {...mockProps} />
    )

    expect(getByText('Convidar Aluno')).toBeTruthy()
    expect(getByText('Preencha os dados do aluno para enviar um convite por email.')).toBeTruthy()
    expect(getByText('Enviar Convite')).toBeTruthy()
  })

  it('validates required fields', async () => {
    const { getByText, getByTestId } = render(
      <InviteStudentModal {...mockProps} />
    )

    const submitButton = getByText('Enviar Convite')
    fireEvent.press(submitButton)

    await waitFor(() => {
      expect(getByText('Email é obrigatório')).toBeTruthy()
      expect(getByText('Nome completo é obrigatório')).toBeTruthy()
    })
  })

  it('validates email format', async () => {
    const { getByText, getByDisplayValue } = render(
      <InviteStudentModal {...mockProps} />
    )

    const emailInput = getByDisplayValue('')
    fireEvent.changeText(emailInput, 'invalid-email')
    
    const submitButton = getByText('Enviar Convite')
    fireEvent.press(submitButton)

    await waitFor(() => {
      expect(getByText('Email deve ter um formato válido')).toBeTruthy()
    })
  })

  it('calls StudentService.inviteStudent with correct data', async () => {
    const mockInviteStudent = StudentService.inviteStudent as jest.MockedFunction<typeof StudentService.inviteStudent>
    mockInviteStudent.mockResolvedValue({ success: true, student_id: 'test-id' })

    const { getByText, getByDisplayValue } = render(
      <InviteStudentModal {...mockProps} />
    )

    // Fill form
    const emailInput = getByDisplayValue('')
    fireEvent.changeText(emailInput, 'test@example.com')
    
    const nameInput = getByDisplayValue('')
    fireEvent.changeText(nameInput, 'Test Student')

    const submitButton = getByText('Enviar Convite')
    fireEvent.press(submitButton)

    await waitFor(() => {
      expect(mockInviteStudent).toHaveBeenCalledWith({
        email: 'test@example.com',
        full_name: 'Test Student',
        phone: undefined,
      })
    })
  })
})