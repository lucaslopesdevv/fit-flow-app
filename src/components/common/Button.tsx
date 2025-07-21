import React from 'react'
import { Button as PaperButton, ButtonProps as PaperButtonProps } from 'react-native-paper'
import { StyleSheet } from 'react-native'

interface ButtonProps extends Omit<PaperButtonProps, 'children'> {
  title: string
  variant?: 'contained' | 'outlined' | 'text'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
}

export function Button({
  title,
  variant = 'contained',
  size = 'medium',
  fullWidth = false,
  style,
  ...props
}: ButtonProps) {
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.small
      case 'large':
        return styles.large
      default:
        return styles.medium
    }
  }

  return (
    <PaperButton
      mode={variant}
      style={[getSizeStyle(), fullWidth && styles.fullWidth, style]}
      {...props}
    >
      {title}
    </PaperButton>
  )
}

const styles = StyleSheet.create({
  small: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  medium: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  large: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  fullWidth: {
    width: '100%',
  },
})
