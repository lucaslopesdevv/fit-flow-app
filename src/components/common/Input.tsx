import React from 'react'
import { TextInput, TextInputProps, HelperText } from 'react-native-paper'
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { useTheme } from '@/context/ThemeContext'

interface InputProps extends Omit<TextInputProps, 'mode' | 'error'> {
  label: string
  errorMessage?: string
  helperText?: string
  variant?: 'outlined' | 'flat'
  required?: boolean
  accessibilityLabel?: string
  accessibilityHint?: string
}

export function Input({
  label,
  errorMessage,
  helperText,
  variant = 'outlined',
  required = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  ...props
}: InputProps) {
  const { theme } = useTheme()
  const displayLabel = required ? `${label} *` : label
  const hasError = !!errorMessage
  const showHelperText = errorMessage || helperText

  // Generate unique IDs for accessibility
  const helperTextId = React.useMemo(() => `helper-${Math.random().toString(36).substr(2, 9)}`, [])

  return (
    <View style={[styles.container, style] as StyleProp<ViewStyle>}>
      <TextInput
        label={displayLabel}
        mode={variant}
        error={hasError}
        theme={theme}
        textColor={theme.colors.onSurface}
        accessible={true}
        accessibilityLabel={accessibilityLabel || displayLabel}
        accessibilityHint={accessibilityHint}
        style={styles.input}
        {...props}
      />
      {showHelperText && (
        <HelperText
          type={hasError ? 'error' : 'info'}
          visible={!!showHelperText}
          theme={theme}
          style={styles.helperText}
          accessibilityLiveRegion={hasError ? 'polite' : 'none'}
          nativeID={helperTextId}
        >
          {errorMessage || helperText}
        </HelperText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  input: {
    minHeight: 44, // Ensure minimum touch target
  },
  helperText: {
    marginTop: 4,
  },
})
