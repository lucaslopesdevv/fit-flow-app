import React, { useState, useEffect, memo } from 'react'
import { Image, View, StyleSheet, ImageStyle, ViewStyle } from 'react-native'
import { imageCache, cacheUtils } from '@/utils/cache'

interface LazyImageProps {
  source: { uri: string }
  style?: ImageStyle
  placeholder?: React.ReactNode
  fallback?: React.ReactNode
  onLoad?: () => void
  onError?: () => void
  accessibilityLabel?: string
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center'
}

const LazyImage = memo(({
  source,
  style,
  placeholder,
  fallback,
  onLoad,
  onError,
  accessibilityLabel,
  resizeMode = 'cover'
}: LazyImageProps) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const cacheKey = cacheUtils.getImageCacheKey(source.uri)

  useEffect(() => {
    // Check if image is already cached
    const cachedImage = imageCache.get<boolean>(cacheKey)
    if (cachedImage) {
      setLoading(false)
      setImageLoaded(true)
      return
    }

    // For React Native, we'll use the Image component's onLoad/onError directly
    // This is a simplified approach that still provides lazy loading benefits
    setLoading(true)
    setError(false)
  }, [source.uri, cacheKey])

  if (error && fallback) {
    return <View style={style}>{fallback}</View>
  }

  if (loading && placeholder) {
    return <View style={style}>{placeholder}</View>
  }

  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
      accessibilityLabel={accessibilityLabel}
      onLoad={() => {
        imageCache.set(cacheKey, true, 30 * 60 * 1000) // Cache for 30 minutes
        setLoading(false)
        setImageLoaded(true)
        onLoad?.()
      }}
      onError={() => {
        setLoading(false)
        setError(true)
        onError?.()
      }}
    />
  )
})

LazyImage.displayName = 'LazyImage'

export default LazyImage

// Default placeholder component
export const ImagePlaceholder = memo(({ style }: { style?: ViewStyle }) => (
  <View style={[styles.placeholder, style]}>
    <View style={styles.placeholderContent} />
  </View>
))

ImagePlaceholder.displayName = 'ImagePlaceholder'

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContent: {
    width: '60%',
    height: '60%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  }
})