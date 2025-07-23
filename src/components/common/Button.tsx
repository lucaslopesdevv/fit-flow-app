import React from 'react'
import { Button as PaperButton, ButtonProps as PaperButtonProps } from 'react-native-paper'
import { StyleSheet, AccessibilityRole } from 'react-native'
import { useTheme } from '@/context/ThemeContext'

interface ButtonProps extends Omit<PaperButtonProps, 'children'> {
  title: string
  variant?: 'contained' | 'outlined' | 'text'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityRole?: AccessibilityRole
}

export function Button({
  title,
  variant = 'contained',
  size = 'medium',
  fullWidth = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  ...props
}: ButtonProps) {
  const { theme } = useTheme()

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

  // Ensure text color is appropriate for dark mode
  const textColor = variant === 'contained' ? (theme.dark ? '#FFFFFF' : undefined) : undefined

  // Ensure minimum touch target size (44px)
  const touchTargetStyle = size === 'small' ? styles.minTouchTarget : {}

  return (
    <PaperButton
      mode={variant}
      style={[getSizeStyle(), fullWidth && styles.fullWidth, touchTargetStyle, style]}
      theme={theme}
      textColor={textColor}
      accessible={true}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
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
  // Ensure minimum 44px touch target for accessibility
  minTouchTarget: {
    minHeight: 44,
    minWidth: 44,
  },
})
