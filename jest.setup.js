import 'react-native-gesture-handler/jestSetup'

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  Reanimated.default.call = () => {}
  return Reanimated
})

// Mock Expo modules
jest.mock('expo-font')
jest.mock('expo-asset')
jest.mock('expo-router', () => ({
  useRouter: () => ({
    navigate: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  }),
  useNavigation: () => ({
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
  }),
}))

// Mock react-native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')

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

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
  }),
  NavigationContainer: ({ children }) => children,
}))

// Mock Supabase
jest.mock('@/services/supabase/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    functions: {
      invoke: jest.fn(),
    },
    rpc: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null,
          })),
          order: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
    })),
  },
}))

// Mock React Native Paper components
jest.mock('react-native-paper', () => {
  const RNPaper = jest.requireActual('react-native-paper')
  return {
    ...RNPaper,
    TextInput: ({ children, ...props }) => {
      const React = require('react')
      const { TextInput: RNTextInput } = require('react-native')
      return React.createElement(RNTextInput, props, children)
    },
    Button: ({ children, title, onPress, ...props }) => {
      const React = require('react')
      const { TouchableOpacity, Text } = require('react-native')
      return React.createElement(
        TouchableOpacity,
        { onPress, ...props },
        React.createElement(Text, {}, title || children)
      )
    },
    Card: ({ children, ...props }) => {
      const React = require('react')
      const { View } = require('react-native')
      return React.createElement(View, props, children)
    },
    HelperText: ({ children, ...props }) => {
      const React = require('react')
      const { Text } = require('react-native')
      return React.createElement(Text, props, children)
    },
  }
})

// Global test environment setup
global.__DEV__ = true
