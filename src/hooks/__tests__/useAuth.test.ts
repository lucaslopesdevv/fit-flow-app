import { renderHook, act } from '@testing-library/react-native'
import { useAuth, AuthProvider } from '../useAuth'
import React from 'react'

// Mock Supabase
jest.mock('@/services/supabase/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      refreshSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}))

const wrapper = ({ children }: { children: React.ReactNode }) => 
  React.createElement(AuthProvider, {}, children)

describe('Enhanced useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should provide enhanced error handling with error types', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    expect(result.current.error).toBeNull()
    expect(result.current.clearError).toBeDefined()
    expect(typeof result.current.clearError).toBe('function')
  })

  it('should provide session expiration tracking', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    expect(result.current.isSessionExpired).toBeDefined()
    expect(typeof result.current.isSessionExpired).toBe('boolean')
    expect(result.current.isSessionExpired).toBe(false)
  })

  it('should provide role refresh functionality', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    expect(result.current.refreshRole).toBeDefined()
    expect(typeof result.current.refreshRole).toBe('function')
  })

  it('should provide user data refresh functionality', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    expect(result.current.refreshUser).toBeDefined()
    expect(typeof result.current.refreshUser).toBe('function')
  })

  it('should clear both error and session expired state when clearError is called', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    act(() => {
      result.current.clearError()
    })
    
    expect(result.current.error).toBeNull()
    expect(result.current.isSessionExpired).toBe(false)
  })
})