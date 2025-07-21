/**
 * Simple in-memory cache with TTL (Time To Live) support
 * Used for caching frequently accessed data like exercises
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>()
  private maxSize: number
  private defaultTTL: number

  constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) {
    // 5 minutes default TTL
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }

  /**
   * Set a value in the cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    })
  }

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Remove a specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Clean expired entries
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Global cache instances
export const exerciseCache = new MemoryCache(200, 10 * 60 * 1000) // 10 minutes TTL for exercises
export const workoutCache = new MemoryCache(50, 5 * 60 * 1000) // 5 minutes TTL for workouts
export const imageCache = new MemoryCache(100, 30 * 60 * 1000) // 30 minutes TTL for image URLs

// Utility functions for common cache operations
export const cacheUtils = {
  /**
   * Generate cache key for exercise queries
   */
  getExerciseQueryKey: (search?: string, muscleGroup?: string) => {
    const parts = ['exercises']
    if (search) parts.push(`search:${search.toLowerCase()}`)
    if (muscleGroup) parts.push(`group:${muscleGroup}`)
    return parts.join('|')
  },

  /**
   * Generate cache key for workout queries
   */
  getWorkoutQueryKey: (userId: string, type: 'instructor' | 'student') => {
    return `workouts|${type}:${userId}`
  },

  /**
   * Generate cache key for image preloading
   */
  getImageCacheKey: (url: string) => {
    return `image:${url}`
  },
}

// Cleanup expired entries every 5 minutes
const cleanupInterval = setInterval(
  () => {
    exerciseCache.cleanup()
    workoutCache.cleanup()
    imageCache.cleanup()
  },
  5 * 60 * 1000
)

// Export cleanup function for manual cleanup if needed
export const cleanupCaches = () => {
  exerciseCache.cleanup()
  workoutCache.cleanup()
  imageCache.cleanup()
}

// Export function to clear interval (useful for testing or app cleanup)
export const stopCacheCleanup = () => {
  clearInterval(cleanupInterval)
}
