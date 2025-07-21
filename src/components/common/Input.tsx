import React from 'react'
import { TextInput, TextInputProps, HelperText } from 'react-native-paper'
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'

interface InputProps extends Omit<TextInputProps, 'mode' | 'error'> {
  label: string
  errorMessage?: string
  helperText?: string
  variant?: 'outlined' | 'flat'
  required?: boolean
}

export function Input({
  label,
  errorMessage,
  helperText,
  variant = 'outlined',
  required = false,
  style,
  ...props
}: InputProps) {
  const displayLabel = required ? `${label} *` : label
  const hasError = !!errorMessage
  const showHelperText = errorMessage || helperText

  return (
    <View style={[styles.container, style] as StyleProp<ViewStyle>}>
      <TextInput label={displayLabel} mode={variant} error={hasError} {...props} />
      {showHelperText && (
        <HelperText type={hasError ? 'error' : 'info'} visible={!!showHelperText}>
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
})
