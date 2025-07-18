import 'react-native-gesture-handler/jestSetup'
import '@testing-library/jest-native/extend-expect'

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  Reanimated.default.call = () => {}
  return Reanimated
})

// Mock Expo modules
jest.mock('expo-font')
jest.mock('expo-asset')

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

// Mock Supabase
jest.mock('@/services/supabase/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [],
            error: null
          }))
        }))
      }))
    }))
  }
}))