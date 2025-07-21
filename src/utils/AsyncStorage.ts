/**
 * Simple AsyncStorage implementation for local storage
 * This is a temporary solution until we properly install @react-native-async-storage/async-storage
 */

// In-memory storage for development
const memoryStorage = new Map<string, string>()

const AsyncStorage = {
  /**
   * Stores a string value with the given key
   */
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      memoryStorage.set(key, value)
    } catch (error) {
      console.error('AsyncStorage setItem error:', error)
      throw error
    }
  },

  /**
   * Gets a string value for the given key
   */
  getItem: async (key: string): Promise<string | null> => {
    try {
      return memoryStorage.get(key) || null
    } catch (error) {
      console.error('AsyncStorage getItem error:', error)
      throw error
    }
  },

  /**
   * Removes an item for the given key
   */
  removeItem: async (key: string): Promise<void> => {
    try {
      memoryStorage.delete(key)
    } catch (error) {
      console.error('AsyncStorage removeItem error:', error)
      throw error
    }
  },

  /**
   * Erases all AsyncStorage data
   */
  clear: async (): Promise<void> => {
    try {
      memoryStorage.clear()
    } catch (error) {
      console.error('AsyncStorage clear error:', error)
      throw error
    }
  },

  /**
   * Gets all keys known to the storage
   */
  getAllKeys: async (): Promise<string[]> => {
    try {
      return Array.from(memoryStorage.keys())
    } catch (error) {
      console.error('AsyncStorage getAllKeys error:', error)
      throw error
    }
  },

  /**
   * Performs multiple operations in a batch
   */
  multiGet: async (keys: string[]): Promise<[string, string | null][]> => {
    try {
      return keys.map(key => [key, memoryStorage.get(key) || null])
    } catch (error) {
      console.error('AsyncStorage multiGet error:', error)
      throw error
    }
  },

  /**
   * Sets multiple key-value pairs in a batch
   */
  multiSet: async (keyValuePairs: [string, string][]): Promise<void> => {
    try {
      keyValuePairs.forEach(([key, value]) => {
        memoryStorage.set(key, value)
      })
    } catch (error) {
      console.error('AsyncStorage multiSet error:', error)
      throw error
    }
  },

  /**
   * Removes multiple keys in a batch
   */
  multiRemove: async (keys: string[]): Promise<void> => {
    try {
      keys.forEach(key => {
        memoryStorage.delete(key)
      })
    } catch (error) {
      console.error('AsyncStorage multiRemove error:', error)
      throw error
    }
  },
}

export default AsyncStorage
