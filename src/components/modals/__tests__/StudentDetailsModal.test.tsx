import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { StudentDetailsModal } from '../StudentDetailsModal'
import { StudentService } from '@/services/api/StudentService'
import { Alert } from 'react-native'

// Mock the StudentService
jest.mock('@/services/api/StudentService', () => ({
  StudentService: {
    updateStudent: jest.fn(),
  },
}))

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
  Alert: {
    alert: jest.fn(),
  },
}))

describe('StudentDetailsModal', () => {
  const mockStudent = {
    id: '123',
    full_name: 'Test Student',
    email: 'test@example.com',
    phone: '123456789',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    is_active: true,
  }

  const mockProps = {
    visible: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
    student: mockStudent,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly with student data', () => {
    const { getByText } = render(<StudentDetailsModal {...mockProps} />)
    
    expect(getByText('Detalhes do Aluno')).toBeTruthy()
    expect(getByText('test@example.com')).toBeTruthy()
    expect(getByText('Test Student')).toBeTruthy()
    expect(getByText('123456789')).toBeTruthy()
    expect(getByText('Ativo')).toBeTruthy()
  })

  it('shows edit form when edit button is pressed', () => {
    const { getByText, getByDisplayValue } = render(<StudentDetailsModal {...mockProps} />)
    
    fireEvent.press(getByText('Editar Informações'))
    
    expect(getByDisplayValue('Test Student')).toBeTruthy()
    expect(getByDisplayValue('123456789')).toBeTruthy()
    expect(getByText('Salvar')).toBeTruthy()
  })

  it('validates form fields correctly', async () => {
    const { getByText, getByDisplayValue, findByText } = render(<StudentDetailsModal {...mockProps} />)
    
    fireEvent.press(getByText('Editar Informações'))
    
    const nameInput = getByDisplayValue('Test Student')
    fireEvent.changeText(nameInput, '')
    
    fireEvent.press(getByText('Salvar'))
    
    expect(await findByText('Nome completo é obrigatório')).toBeTruthy()
  })

  it('calls updateStudent when form is valid and submitted', async () => {
    const { getByText, getByDisplayValue } = render(<StudentDetailsModal {...mockProps} />)
    
    // Mock successful update
    (StudentService.updateStudent as jest.Mock).mockResolvedValueOnce({
      ...mockStudent,
      full_name: 'Updated Name',
      phone: '987654321',
    })
    
    fireEvent.press(getByText('Editar Informações'))
    
    const nameInput = getByDisplayValue('Test Student')
    fireEvent.changeText(nameInput, 'Updated Name')
    
    const phoneInput = getByDisplayValue('123456789')
    fireEvent.changeText(phoneInput, '987654321')
    
    fireEvent.press(getByText('Salvar'))
    
    await waitFor(() => {
      expect(StudentService.updateStudent).toHaveBeenCalledWith('123', {
        full_name: 'Updated Name',
        phone: '987654321',
        is_active: true,
      })
    })
  })

  it('shows confirmation dialog when toggling student status', () => {
    const { getByText } = render(<StudentDetailsModal {...mockProps} />)
    
    fireEvent.press(getByText('Desativar Aluno'))
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Confirmar desativar',
      'Tem certeza que deseja desativar este aluno?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancelar' }),
        expect.objectContaining({ text: 'Confirmar' }),
      ])
    )
  })

  it('updates student status when confirmed', async () => {
    const { getByText } = render(<StudentDetailsModal {...mockProps} />)
    
    // Mock the Alert.alert implementation to trigger the confirm action
    (Alert.alert as jest.Mock).mockImplementationOnce((title: string, message: string, buttons: any[]) => {
      // Find the confirm button and trigger its onPress
      const confirmButton = buttons.find((button) => button.text === 'Confirmar')
      if (confirmButton && confirmButton.onPress) {
        confirmButton.onPress()
      }
    })
    
    // Mock successful update
    (StudentService.updateStudent as jest.Mock).mockResolvedValueOnce({
      ...mockStudent,
      is_active: false,
    })
    
    fireEvent.press(getByText('Desativar Aluno'))
    
    await waitFor(() => {
      expect(StudentService.updateStudent).toHaveBeenCalledWith('123', {
        is_active: false,
      })
    })
  })
})