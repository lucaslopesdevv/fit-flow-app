import React from 'react'
import { Chip as PaperChip, ChipProps as PaperChipProps } from 'react-native-paper'
import { StyleSheet } from 'react-native'

interface ChipProps extends Omit<PaperChipProps, 'children'> {
  label: string
  variant?: 'filled' | 'outlined'
  size?: 'small' | 'medium'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  children?: React.ReactNode
}

export function Chip({
  label,
  variant = 'filled',
  size = 'medium',
  color = 'primary',
  style,
  children,
  ...props
}: ChipProps) {
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.small
      default:
        return styles.medium
    }
  }

  const getVariantStyle = () => {
    if (variant === 'outlined') {
      return styles.outlined
    }
    return {}
  }

  return (
    <PaperChip
      style={[styles.base, getSizeStyle(), getVariantStyle(), style]}
      mode={variant === 'outlined' ? 'outlined' : 'flat'}
      {...props}
    >
      {children ?? label}
    </PaperChip>
  )
}

const styles = StyleSheet.create({
  base: {
    marginVertical: 2,
    marginHorizontal: 2,
  },
  small: {
    height: 24,
  },
  medium: {
    height: 32,
  },
  outlined: {
    backgroundColor: 'transparent',
  },
})
