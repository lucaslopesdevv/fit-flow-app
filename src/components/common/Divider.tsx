import React from 'react'
import { Divider as PaperDivider, DividerProps as PaperDividerProps } from 'react-native-paper'
import { View, StyleSheet } from 'react-native'
import { ThemedText } from '../ThemedText'

interface DividerProps extends PaperDividerProps {
  label?: string
  spacing?: 'none' | 'small' | 'medium' | 'large'
  orientation?: 'horizontal' | 'vertical'
}

export function Divider({
  label,
  spacing = 'medium',
  orientation = 'horizontal',
  style,
  ...props
}: DividerProps) {
  const getSpacingStyle = () => {
    switch (spacing) {
      case 'none':
        return {}
      case 'small':
        return styles.spacingSmall
      case 'large':
        return styles.spacingLarge
      default:
        return styles.spacingMedium
    }
  }

  if (label) {
    return (
      <View style={[styles.labelContainer, getSpacingStyle(), style]}>
        <PaperDivider style={styles.labelDivider} {...props} />
        <ThemedText style={styles.label}>{label}</ThemedText>
        <PaperDivider style={styles.labelDivider} {...props} />
      </View>
    )
  }

  return (
    <View style={[getSpacingStyle(), style]}>
      <PaperDivider {...props} />
    </View>
  )
}

const styles = StyleSheet.create({
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelDivider: {
    flex: 1,
  },
  label: {
    marginHorizontal: 16,
    fontSize: 14,
    opacity: 0.7,
  },
  spacingSmall: {
    marginVertical: 8,
  },
  spacingMedium: {
    marginVertical: 16,
  },
  spacingLarge: {
    marginVertical: 24,
  },
})
