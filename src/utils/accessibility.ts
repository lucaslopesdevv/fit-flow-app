import { AccessibilityInfo, Platform } from 'react-native'

/**
 * Accessibility utilities for better screen reader support and user experience
 */

/**
 * Announces a message to screen readers
 * @param message - The message to announce
 */
export const announceForAccessibility = (message: string): void => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    AccessibilityInfo.announceForAccessibility(message)
  }
}

/**
 * Checks if screen reader is currently enabled
 * @returns Promise<boolean> - Whether screen reader is enabled
 */
export const isScreenReaderEnabled = async (): Promise<boolean> => {
  try {
    return await AccessibilityInfo.isScreenReaderEnabled()
  } catch (error) {
    console.warn('Failed to check screen reader status:', error)
    return false
  }
}

/**
 * Checks if reduce motion is enabled (for animations)
 * @returns Promise<boolean> - Whether reduce motion is enabled
 */
export const isReduceMotionEnabled = async (): Promise<boolean> => {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled()
  } catch (error) {
    console.warn('Failed to check reduce motion status:', error)
    return false
  }
}

/**
 * Generates accessible labels for form validation
 * @param fieldName - Name of the field
 * @param isRequired - Whether the field is required
 * @param hasError - Whether the field has an error
 * @param errorMessage - The error message if any
 * @returns Accessibility label and hint
 */
export const getFieldAccessibilityProps = (
  fieldName: string,
  isRequired: boolean = false,
  hasError: boolean = false,
  errorMessage?: string
) => {
  const label = isRequired ? `${fieldName}, obrigatório` : fieldName
  let hint = ''

  if (hasError && errorMessage) {
    hint = `Erro: ${errorMessage}`
  } else if (isRequired) {
    hint = 'Campo obrigatório'
  }

  return {
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: { invalid: hasError },
  }
}

/**
 * Generates accessible labels for buttons with loading states
 * @param title - Button title
 * @param isLoading - Whether button is in loading state
 * @param isDisabled - Whether button is disabled
 * @returns Accessibility props for button
 */
export const getButtonAccessibilityProps = (
  title: string,
  isLoading: boolean = false,
  isDisabled: boolean = false
) => {
  let label = title
  let hint = ''

  if (isLoading) {
    label = `${title}, carregando`
    hint = 'Aguarde, processando'
  } else if (isDisabled) {
    hint = 'Botão desabilitado'
  }

  return {
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: {
      disabled: isDisabled,
      busy: isLoading,
    },
  }
}

/**
 * Generates accessible labels for list items
 * @param itemName - Name of the item
 * @param position - Position in list (1-based)
 * @param total - Total items in list
 * @param isSelected - Whether item is selected
 * @returns Accessibility props for list item
 */
export const getListItemAccessibilityProps = (
  itemName: string,
  position: number,
  total: number,
  isSelected: boolean = false
) => {
  const positionInfo = `${position} de ${total}`
  const selectionInfo = isSelected ? 'selecionado' : ''

  return {
    accessibilityLabel: `${itemName}, ${positionInfo}${selectionInfo ? ', ' + selectionInfo : ''}`,
    accessibilityRole: 'button' as const,
    accessibilityState: { selected: isSelected },
  }
}

/**
 * Generates accessible labels for progress indicators
 * @param current - Current step/value
 * @param total - Total steps/max value
 * @param label - Label for the progress
 * @returns Accessibility props for progress indicator
 */
export const getProgressAccessibilityProps = (current: number, total: number, label: string) => {
  const percentage = Math.round((current / total) * 100)

  return {
    accessibilityLabel: `${label}: ${current} de ${total}, ${percentage}% concluído`,
    accessibilityRole: 'progressbar' as const,
    accessibilityValue: {
      min: 0,
      max: total,
      now: current,
    },
  }
}

/**
 * Generates accessible labels for modal dialogs
 * @param title - Modal title
 * @param description - Optional description
 * @returns Accessibility props for modal
 */
export const getModalAccessibilityProps = (title: string, description?: string) => {
  return {
    accessibilityLabel: description ? `${title}. ${description}` : title,
    accessibilityViewIsModal: true,
    // Note: 'dialog' is not a valid accessibilityRole in React Native
    // Modal component handles accessibility automatically
  }
}

/**
 * Checks if a color combination meets WCAG contrast requirements
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @param level - WCAG level ('AA' or 'AAA')
 * @returns Whether the contrast ratio meets requirements
 */
export const meetsContrastRequirements = (
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean => {
  // Simple contrast ratio calculation
  // In a real implementation, you'd use a proper color contrast library
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16)
    const r = (rgb >> 16) & 0xff
    const g = (rgb >> 8) & 0xff
    const b = (rgb >> 0) & 0xff

    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const l1 = getLuminance(foreground)
  const l2 = getLuminance(background)
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)

  return level === 'AAA' ? ratio >= 7 : ratio >= 4.5
}

/**
 * Minimum touch target size for accessibility (44pt on iOS, 48dp on Android)
 */
export const MIN_TOUCH_TARGET_SIZE = Platform.OS === 'ios' ? 44 : 48

/**
 * Ensures a component meets minimum touch target requirements
 * @param currentSize - Current size of the component
 * @returns Style object with minimum dimensions
 */
export const ensureMinimumTouchTarget = (currentSize?: number) => {
  const minSize = MIN_TOUCH_TARGET_SIZE
  const size = currentSize || 0

  return {
    minWidth: Math.max(size, minSize),
    minHeight: Math.max(size, minSize),
  }
}
