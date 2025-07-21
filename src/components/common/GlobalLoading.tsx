import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useGlobalLoading } from '@/store/useGlobalLoading'
import { Loading } from './Loading'

export function GlobalLoading() {
  const { isLoading, message } = useGlobalLoading()

  if (!isLoading) return null

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <Loading fullScreen overlay message={message} />
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
