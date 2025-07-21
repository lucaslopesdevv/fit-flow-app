import React, {
  useEffect,
  useState,
  createContext,
  useContext,
  type ReactNode,
  useCallback,
  useRef,
} from 'react'
import { supabase } from '@/services/supabase/supabase'
import { UserRole, Profile } from '@/types/database'

interface User {
  id: string
  email: string
  role: UserRole
  profile?: Profile
}

interface AuthError {
  message: string
  code?: string
  type: 'network' | 'auth' | 'permission' | 'session' | 'unknown'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: AuthError | null
  signOut: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  refreshUser: () => Promise<void>
  refreshRole: () => Promise<void>
  clearError: () => void
  isSessionExpired: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  signOut: async () => {},
  signIn: async () => ({ error: null }),
  refreshUser: async () => {},
  refreshRole: async () => {},
  clearError: () => {},
  isSessionExpired: false,
})

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const [isSessionExpired, setIsSessionExpired] = useState(false)
  const mountedRef = useRef(true)
  const authListenerRef = useRef<{ data: { subscription: any } } | null>(null)
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearError = useCallback(() => {
    setError(null)
    setIsSessionExpired(false)
  }, [])

  const handleError = useCallback((error: any, context: string) => {
    console.error(`Error in ${context}:`, error)

    // Categorize error types for better handling
    let errorType: AuthError['type'] = 'unknown'
    if (error?.message?.includes('network') || error?.code === 'NETWORK_ERROR') {
      errorType = 'network'
    } else if (
      error?.message?.includes('Invalid login credentials') ||
      error?.code === 'INVALID_CREDENTIALS'
    ) {
      errorType = 'auth'
    } else if (error?.message?.includes('JWT expired') || error?.code === 'JWT_EXPIRED') {
      errorType = 'session'
      setIsSessionExpired(true)
    } else if (error?.message?.includes('permission') || error?.code === 'INSUFFICIENT_PRIVILEGE') {
      errorType = 'permission'
    }

    const authError: AuthError = {
      message: error?.message || `An error occurred during ${context}`,
      code: error?.code || error?.status?.toString(),
      type: errorType,
    }
    setError(authError)
    return authError
  }, [])

  const fetchUserProfile = useCallback(
    async (userId: string, email: string): Promise<User | null> => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (profileError) {
          handleError(profileError, 'fetching user profile')
          return null
        }

        if (profile && profile.role) {
          return {
            id: userId,
            email,
            role: profile.role as UserRole,
            profile: profile as Profile,
          }
        }

        // If no role found, this is an error condition
        handleError({ message: 'User profile found but no role assigned' }, 'profile validation')
        return null
      } catch (err) {
        handleError(err, 'fetching user profile')
        return null
      }
    },
    [handleError]
  )

  const refreshUser = useCallback(async () => {
    if (!mountedRef.current) return

    try {
      setError(null) // Clear any previous errors
      const { data, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        handleError(sessionError, 'getting session')
        if (mountedRef.current) setUser(null)
        return
      }

      if (data.session?.user && mountedRef.current) {
        const { id, email = '' } = data.session.user
        const userData = await fetchUserProfile(id, email)
        if (mountedRef.current) setUser(userData)
      } else if (mountedRef.current) {
        setUser(null)
      }
    } catch (err) {
      handleError(err, 'refreshing user')
      if (mountedRef.current) setUser(null)
    }
  }, [fetchUserProfile, handleError])

  const refreshRole = useCallback(async () => {
    if (!user || !mountedRef.current) return

    try {
      setError(null)
      const userData = await fetchUserProfile(user.id, user.email)
      if (mountedRef.current && userData) {
        // Check if role actually changed to trigger any necessary updates
        const roleChanged = user.role !== userData.role
        setUser(userData)

        // If role changed, we might want to trigger navigation updates
        if (roleChanged) {
          console.log(`User role changed from ${user.role} to ${userData.role}`)
        }
      }
    } catch (err) {
      handleError(err, 'refreshing user role')
    }
  }, [user, fetchUserProfile, handleError])

  // Add automatic session refresh with retry mechanism
  const handleSessionRefresh = useCallback(
    async (retryCount = 0) => {
      if (!mountedRef.current || retryCount > 3) return

      try {
        const { data, error } = await supabase.auth.refreshSession()

        if (error) {
          if (
            error.message?.includes('refresh_token_not_found') ||
            error.message?.includes('invalid_grant')
          ) {
            // Session is truly expired, sign out user
            setIsSessionExpired(true)
            setUser(null)
            return
          }

          // For network errors, retry after a delay
          if (retryCount < 3) {
            refreshTimeoutRef.current = setTimeout(
              () => {
                handleSessionRefresh(retryCount + 1)
              },
              Math.pow(2, retryCount) * 1000
            ) // Exponential backoff
          } else {
            handleError(error, 'refreshing session')
          }
          return
        }

        if (data.session?.user && mountedRef.current) {
          const userData = await fetchUserProfile(
            data.session.user.id,
            data.session.user.email || ''
          )
          if (mountedRef.current) setUser(userData)
        }
      } catch (err) {
        if (retryCount < 3) {
          refreshTimeoutRef.current = setTimeout(
            () => {
              handleSessionRefresh(retryCount + 1)
            },
            Math.pow(2, retryCount) * 1000
          )
        } else {
          handleError(err, 'refreshing session')
        }
      }
    },
    [fetchUserProfile, handleError]
  )

  useEffect(() => {
    mountedRef.current = true

    // Initialize auth state
    const initAuth = async () => {
      try {
        setError(null)
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          handleError(sessionError, 'initializing auth')
          if (mountedRef.current) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        if (mountedRef.current) {
          if (session?.user) {
            console.log('Initial session found, fetching profile...')
            const userData = await fetchUserProfile(session.user.id, session.user.email || '')
            console.log('Initial profile fetched:', userData)
            if (mountedRef.current) setUser(userData)
          } else {
            console.log('No initial session found')
            setUser(null)
          }
          setLoading(false)
        }
      } catch (error) {
        handleError(error, 'initializing auth')
        if (mountedRef.current) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    // Set up auth state listener
    const setupAuthListener = () => {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)

        if (!mountedRef.current) return

        try {
          setError(null)
          setIsSessionExpired(false) // Clear session expired flag on auth state change

          if (event === 'SIGNED_OUT' || !session?.user) {
            setUser(null)
            setIsSessionExpired(false)
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            const userData = await fetchUserProfile(session.user.id, session.user.email || '')
            if (mountedRef.current) setUser(userData)
            setIsSessionExpired(false)
          }
        } catch (error) {
          handleError(error, 'handling auth state change')
          if (mountedRef.current) setUser(null)
        }
      })

      authListenerRef.current = { data: { subscription } }
    }

    initAuth()
    setupAuthListener()

    return () => {
      mountedRef.current = false

      // Clean up auth listener
      if (authListenerRef.current?.data?.subscription) {
        authListenerRef.current.data.subscription.unsubscribe()
        authListenerRef.current = null
      }

      // Clean up any pending timeouts
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }
    }
  }, [fetchUserProfile, handleError])

  const signOut = useCallback(async () => {
    try {
      setError(null)
      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        handleError(signOutError, 'signing out')
      }

      if (mountedRef.current) {
        setUser(null)
      }
    } catch (error) {
      handleError(error, 'signing out')
    }
  }, [handleError])

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setError(null)
        console.log('Attempting to sign in...')

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          const authError = handleError(signInError, 'signing in')
          return { error: authError }
        }

        console.log('Sign in successful')
        // The auth state listener will handle user refresh automatically
        return { error: null }
      } catch (error) {
        const authError = handleError(error, 'signing in')
        return { error: authError }
      }
    },
    [handleError]
  )

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        loading,
        error,
        signOut,
        signIn,
        refreshUser,
        refreshRole,
        clearError,
        isSessionExpired,
      },
    },
    children
  )
}

export const useAuth = () => useContext(AuthContext)
