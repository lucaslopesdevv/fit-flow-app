import React from 'react'
import { View, StyleSheet } from 'react-native'
import { ThemedView } from '../ThemedView'
import { ThemedText } from '../ThemedText'
import { Button } from '../common/Button'
import { WorkoutError, WorkoutErrorType } from '@/services/api/WorkoutService'

interface WorkoutErrorBoundaryProps {
  children: React.ReactNode
  onRetry?: () => void
  fallbackMessage?: string
}

interface WorkoutErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class WorkoutErrorBoundary extends React.Component<
  WorkoutErrorBoundaryProps,
  WorkoutErrorBoundaryState
> {
  constructor(props: WorkoutErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('WorkoutErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    this.props.onRetry?.()
  }

  getErrorMessage = (): string => {
    const { error } = this.state
    const { fallbackMessage } = this.props

    if (error instanceof WorkoutError) {
      switch (error.type) {
        case WorkoutErrorType.NETWORK_ERROR:
          return 'Problema de conexão. Verifique sua internet e tente novamente.'
        case WorkoutErrorType.PERMISSION_ERROR:
          return 'Você não tem permissão para realizar esta ação.'
        case WorkoutErrorType.VALIDATION_ERROR:
          return error.message
        case WorkoutErrorType.NOT_FOUND_ERROR:
          return 'Treino não encontrado. Pode ter sido removido.'
        default:
          return error.message
      }
    }

    return fallbackMessage || 'Ocorreu um erro inesperado com os treinos.'
  }

  getErrorTitle = (): string => {
    const { error } = this.state

    if (error instanceof WorkoutError) {
      switch (error.type) {
        case WorkoutErrorType.NETWORK_ERROR:
          return 'Erro de Conexão'
        case WorkoutErrorType.PERMISSION_ERROR:
          return 'Acesso Negado'
        case WorkoutErrorType.VALIDATION_ERROR:
          return 'Dados Inválidos'
        case WorkoutErrorType.NOT_FOUND_ERROR:
          return 'Não Encontrado'
        default:
          return 'Erro'
      }
    }

    return 'Erro nos Treinos'
  }

  canRetry = (): boolean => {
    const { error } = this.state
    
    if (error instanceof WorkoutError) {
      // Don't show retry for validation errors or permission errors
      return ![WorkoutErrorType.VALIDATION_ERROR, WorkoutErrorType.PERMISSION_ERROR].includes(error.type)
    }
    
    return true
  }

  render() {
    if (this.state.hasError) {
      return (
        <ThemedView style={styles.container}>
          <View style={styles.iconContainer}>
            <ThemedText style={styles.icon}>⚠️</ThemedText>
          </View>
          
          <ThemedText type="subtitle" style={styles.title}>
            {this.getErrorTitle()}
          </ThemedText>
          
          <ThemedText style={styles.message}>
            {this.getErrorMessage()}
          </ThemedText>

          {this.canRetry() && (
            <Button
              title="Tentar Novamente"
              onPress={this.handleRetry}
              style={styles.retryButton}
              variant="contained"
            />
          )}
        </ThemedView>
      )
    }

    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
    color: '#d32f2f',
  },
  message: {
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
  },
  retryButton: {
    minWidth: 160,
  },
})