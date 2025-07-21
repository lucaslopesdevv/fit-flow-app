import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import ExerciseForm from './ExerciseForm'

jest.mock('@/services/supabase/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => Promise.resolve({ error: null })),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ error: null })),
        getPublicUrl: jest.fn(() => ({
          data: { publicUrl: 'https://fake.url/image.jpg' },
        })),
      })),
    },
  },
}))

describe('ExerciseForm', () => {
  it('renderiza campos e cadastra exercício com sucesso', async () => {
    const onSuccess = jest.fn()
    const { getByLabelText, getByText } = render(<ExerciseForm onSuccess={onSuccess} />)

    fireEvent.changeText(getByLabelText('Nome'), 'Supino')
    fireEvent.changeText(getByLabelText('Descrição'), 'Exercício de peito')
    fireEvent.press(getByText('Peito'))

    // Simula submit
    fireEvent.press(getByText('Cadastrar Exercício'))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
      expect(getByText('Exercício cadastrado com sucesso!')).toBeTruthy()
    })
  })
})
