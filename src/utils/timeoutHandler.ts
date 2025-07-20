import { WorkoutError, WorkoutErrorType } from '@/services/api/WorkoutService'

export interface TimeoutOptions {
  timeout?: number
  timeoutMessage?: string
  abortController?: AbortController
}

export function withTimeout<T>(
  promise: Promise<T>,
  options: TimeoutOptions = {}
): Promise<T> {
  const {
    timeout = 30000, // 30 seconds default
    timeoutMessage = 'A operação expirou. Tente novamente.',
    abortController
  } = options

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if (abortController) {
        abortController.abort()
      }
      reject(new WorkoutError(
        WorkoutErrorType.NETWORK_ERROR,
        timeoutMessage
      ))
    }, timeout)

    promise
      .then((result) => {
        clearTimeout(timeoutId)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        reject(error)
      })
  })
}

export class TimeoutManager {
  private timeouts: Map<string, ReturnType<typeof setTimeout>> = new Map()
  private abortControllers: Map<string, AbortController> = new Map()

  createTimeout(
    key: string,
    callback: () => void,
    delay: number
  ): void {
    this.clearTimeout(key)
    
    const timeoutId = setTimeout(() => {
      callback()
      this.timeouts.delete(key)
    }, delay)
    
    this.timeouts.set(key, timeoutId)
  }

  clearTimeout(key: string): void {
    const timeoutId = this.timeouts.get(key)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.timeouts.delete(key)
    }
  }

  createAbortController(key: string): AbortController {
    this.clearAbortController(key)
    
    const controller = new AbortController()
    this.abortControllers.set(key, controller)
    
    return controller
  }

  clearAbortController(key: string): void {
    const controller = this.abortControllers.get(key)
    if (controller) {
      controller.abort()
      this.abortControllers.delete(key)
    }
  }

  clearAll(): void {
    // Clear all timeouts
    for (const timeoutId of this.timeouts.values()) {
      clearTimeout(timeoutId)
    }
    this.timeouts.clear()

    // Abort all controllers
    for (const controller of this.abortControllers.values()) {
      controller.abort()
    }
    this.abortControllers.clear()
  }

  async withManagedTimeout<T>(
    key: string,
    promise: Promise<T>,
    options: TimeoutOptions = {}
  ): Promise<T> {
    const controller = this.createAbortController(key)
    
    try {
      const result = await withTimeout(promise, {
        ...options,
        abortController: controller
      })
      
      this.clearAbortController(key)
      return result
    } catch (error) {
      this.clearAbortController(key)
      throw error
    }
  }
}

// Global timeout manager instance
export const globalTimeoutManager = new TimeoutManager()

// Cleanup function for app lifecycle
export function cleanupTimeouts(): void {
  globalTimeoutManager.clearAll()
}