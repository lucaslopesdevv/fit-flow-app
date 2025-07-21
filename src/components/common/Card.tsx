import React from 'react'
import { Card as PaperCard, CardProps as PaperCardProps } from 'react-native-paper'
import { StyleSheet, ViewStyle } from 'react-native'

interface CardProps extends Omit<PaperCardProps, 'elevation'> {
  children: React.ReactNode
  variant?: 'elevated' | 'outlined' | 'contained'
  padding?: 'none' | 'small' | 'medium' | 'large'
  elevation?: 0 | 1 | 2 | 3 | 4 | 5
}

export function Card({
  children,
  variant = 'elevated',
  padding = 'medium',
  style,
  elevation,
  ...props
}: CardProps) {
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

  if (variant === 'elevated') {
    // Remove any mode from props to avoid conflict
    const { mode: _mode, ...rest } = props as any
    const cardProps = elevation !== undefined ? { elevation, ...rest } : { ...rest }
    return (
      <PaperCard mode="elevated" style={[styles.base, styles.elevated, style]} {...cardProps}>
        <PaperCard.Content style={getPaddingStyle()}>{children}</PaperCard.Content>
      </PaperCard>
    )
  }

  if (variant === 'outlined') {
    return (
      <PaperCard mode="outlined" style={[styles.base, styles.outlined, style]} {...props}>
        <PaperCard.Content style={getPaddingStyle()}>{children}</PaperCard.Content>
      </PaperCard>
    )
  }

  // contained
  return (
    <PaperCard mode="contained" style={[styles.base, styles.contained, style]} {...props}>
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
  elevated: {}, // No elevation in style, handled by mode prop
  outlined: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  contained: {},
  paddingSmall: {
    padding: 8,
  },
  paddingMedium: {
    padding: 16,
  },
  paddingLarge: {
    padding: 24,
  },
})
