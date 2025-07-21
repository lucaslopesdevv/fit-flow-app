import React from 'react'
import { ActivityIndicator, ActivityIndicatorProps } from 'react-native-paper'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { ThemedText } from '../ThemedText'

interface LoadingProps extends ActivityIndicatorProps {
  message?: string
  fullScreen?: boolean
  overlay?: boolean
  containerStyle?: ViewStyle
}

export function Loading({
  message,
  fullScreen = false,
  overlay = false,
  containerStyle,
  size = 'large',
  ...props
}: LoadingProps) {
  const containerStyles = [
    styles.container,
    fullScreen && styles.fullScreen,
    overlay && styles.overlay,
    containerStyle,
  ]

  return (
    <View style={containerStyles}>
      <ActivityIndicator size={size} {...props} />
      {message && <ThemedText style={styles.message}>{message}</ThemedText>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  message: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 16,
  },
})
