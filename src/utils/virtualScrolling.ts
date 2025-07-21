/**
 * Virtual scrolling utilities for large lists
 * Helps optimize performance when dealing with hundreds of items
 */

export interface VirtualScrollConfig {
  itemHeight: number
  containerHeight: number
  overscan?: number // Number of items to render outside visible area
}

export interface VirtualScrollResult {
  startIndex: number
  endIndex: number
  totalHeight: number
  offsetY: number
}

/**
 * Calculate which items should be rendered in a virtual scroll scenario
 */
export function calculateVirtualItems(
  scrollTop: number,
  totalItems: number,
  config: VirtualScrollConfig
): VirtualScrollResult {
  const { itemHeight, containerHeight, overscan = 5 } = config

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  return {
    startIndex,
    endIndex,
    totalHeight: totalItems * itemHeight,
    offsetY: startIndex * itemHeight,
  }
}

/**
 * Hook for managing virtual scroll state
 */
import { useState, useCallback, useMemo } from 'react'

export function useVirtualScroll<T>(items: T[], config: VirtualScrollConfig) {
  const [scrollTop, setScrollTop] = useState(0)

  const virtualItems = useMemo(() => {
    return calculateVirtualItems(scrollTop, items.length, config)
  }, [scrollTop, items.length, config])

  const visibleItems = useMemo(() => {
    return items.slice(virtualItems.startIndex, virtualItems.endIndex + 1)
  }, [items, virtualItems.startIndex, virtualItems.endIndex])

  const handleScroll = useCallback((event: any) => {
    const newScrollTop = event.nativeEvent.contentOffset.y
    setScrollTop(newScrollTop)
  }, [])

  return {
    visibleItems,
    virtualItems,
    handleScroll,
    totalHeight: virtualItems.totalHeight,
    offsetY: virtualItems.offsetY,
  }
}

/**
 * Utility for calculating optimal batch sizes based on device performance
 */
export function getOptimalBatchSize(): {
  maxToRenderPerBatch: number
  updateCellsBatchingPeriod: number
  initialNumToRender: number
  windowSize: number
} {
  // These could be adjusted based on device performance metrics
  // For now, using conservative values that work well on most devices
  return {
    maxToRenderPerBatch: 10,
    updateCellsBatchingPeriod: 50,
    initialNumToRender: 10,
    windowSize: 10,
  }
}
