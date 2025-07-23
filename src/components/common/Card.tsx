import React from 'react'
import { Card as PaperCard, CardProps as PaperCardProps } from 'react-native-paper'
import { StyleSheet, ViewStyle, AccessibilityRole } from 'react-native'
import { useTheme } from '@/context/ThemeContext'

interface CardProps extends Omit<PaperCardProps, 'elevation'> {
  children: React.ReactNode
  variant?: 'elevated' | 'outlined' | 'contained'
  padding?: 'none' | 'small' | 'medium' | 'large'
  elevation?: 0 | 1 | 2 | 3 | 4 | 5
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityRole?: AccessibilityRole
  onPress?: () => void
}

export function Card({
  children,
  variant = 'elevated',
  padding = 'medium',
  style,
  elevation,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  onPress,
  ...props
}: CardProps) {
  const { theme } = useTheme()

  const getPaddingStyle = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return {}
      case 'small':
        return styles.paddingSmall
      case 'large':
        return styles.paddingLarge
      default:
        return styles.paddingMedium
    }
  }

  // Dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    outlined: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
    },
    elevated: {
      backgroundColor: theme.colors.surface,
    },
    contained: {
      backgroundColor: theme.colors.surfaceVariant,
    },
  })

  // Common accessibility props
  const accessibilityProps = {
    accessible: true,
    accessibilityLabel,
    accessibilityHint,
    accessibilityRole: accessibilityRole || (onPress ? 'button' : undefined),
    onPress,
  }

  // Ensure minimum touch target if pressable
  const touchTargetStyle = onPress ? styles.touchTarget : {}

  if (variant === 'elevated') {
    // Remove any mode from props to avoid conflict
    const { mode: _mode, ...rest } = props as any
    const cardProps = elevation !== undefined ? { elevation, ...rest } : { ...rest }
    return (
      <PaperCard
        mode="elevated"
        style={[styles.base, dynamicStyles.elevated, touchTargetStyle, style]}
        theme={theme}
        {...cardProps}
        {...accessibilityProps}
      >
        <PaperCard.Content style={getPaddingStyle()}>{children}</PaperCard.Content>
      </PaperCard>
    )
  }

  if (variant === 'outlined') {
    return (
      <PaperCard
        mode="outlined"
        style={[styles.base, dynamicStyles.outlined, touchTargetStyle, style]}
        theme={theme}
        {...props}
        {...accessibilityProps}
      >
        <PaperCard.Content style={getPaddingStyle()}>{children}</PaperCard.Content>
      </PaperCard>
    )
  }

  // contained
  return (
    <PaperCard
      mode="contained"
      style={[styles.base, dynamicStyles.contained, touchTargetStyle, style]}
      theme={theme}
      {...props}
      {...accessibilityProps}
    >
      <PaperCard.Content style={getPaddingStyle()}>{children}</PaperCard.Content>
    </PaperCard>
  )
}

// Subcomponentes para estruturação do Card
Card.Title = PaperCard.Title
Card.Content = PaperCard.Content
Card.Actions = PaperCard.Actions
Card.Cover = PaperCard.Cover

const styles = StyleSheet.create({
  base: {
    marginVertical: 4,
  },
  paddingSmall: {
    padding: 8,
  },
  paddingMedium: {
    padding: 16,
  },
  paddingLarge: {
    padding: 24,
  },
  // Ensure minimum touch target for pressable cards
  touchTarget: {
    minHeight: 44,
  },
})
