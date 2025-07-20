import React, { ReactNode } from 'react'
import { View, StyleSheet } from 'react-native'
import { WorkoutErrorBoundary } from './WorkoutErrorBoundary'
import { WorkoutLoading, WorkoutSavingIndicator } from './WorkoutLoadingStates'
import { WorkoutErrorMessage, NetworkErrorFallback, EmptyStateFallback } from './WorkoutErrorMessages'
import { WorkoutError } from '@/services/api/WorkoutService'

interface WorkoutOperationWrapperProps {
  children: ReactNode
  loading?: boolean
  error?: WorkoutError | null
  isEmpty?: boolean
  emptyTitle?: string
  emptyMessage?: string
  emptyActionTitle?: string
  onEmptyAction?: () => void
  loadingMessage?: string
  onRetry?: () => void
  onErrorDismiss?: () => void
  showSavingIndicator?: boolean
  fallbackMessage?: string
}

export function WorkoutOperationWrapper({
  children,
  loading = false,
  error = null,
  isEmpty = false,
  emptyTitle = 'Nenhum treino encontrado',
  emptyMessage = 'Você ainda não possui treinos criados.',
  emptyActionTitle,
  onEmptyAction,
  loadingMessage = 'Carregando...',
  onRetry,
  onErrorDismiss,
  showSavingIndicator = false,
  fallbackMessage
}: WorkoutOperationWrapperProps) {
  
  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <WorkoutLoading message={loadingMessage} />
        <WorkoutSavingIndicator visible={showSavingIndicator} />
      </View>
    )
  }

  // Show error state
  if (error) {
    return (
      <WorkoutErrorBoundary onRetry={onRetry} fallbackMessage={fallbackMessage}>
        <View style={styles.container}>
          <WorkoutErrorMessage
            error={error}
            onRetry={onRetry}
            onDismiss={onErrorDismiss}
          />
        </View>
      </WorkoutErrorBoundary>
    )
  }

  // Show empty state
  if (isEmpty) {
    return (
      <View style={styles.container}>
        <EmptyStateFallback
          title={emptyTitle}
          message={emptyMessage}
          actionTitle={emptyActionTitle}
          onAction={onEmptyAction}
        />
      </View>
    )
  }

  // Show content wrapped in error boundary
  return (
    <WorkoutErrorBoundary onRetry={onRetry} fallbackMessage={fallbackMessage}>
      <View style={styles.container}>
        {children}
        <WorkoutSavingIndicator visible={showSavingIndicator} />
      </View>
    </WorkoutErrorBoundary>
  )
}

interface WorkoutListWrapperProps {
  children: ReactNode
  loading?: boolean
  error?: WorkoutError | null
  workouts?: any[]
  onRetry?: () => void
  onCreateWorkout?: () => void
  userRole?: 'instructor' | 'student'
}

export function WorkoutListWrapper({
  children,
  loading = false,
  error = null,
  workouts = [],
  onRetry,
  onCreateWorkout,
  userRole = 'student'
}: WorkoutListWrapperProps) {
  const isEmpty = !loading && !error && workouts.length === 0

  const getEmptyConfig = () => {
    if (userRole === 'instructor') {
      return {
        title: 'Nenhum treino criado',
        message: 'Comece criando seu primeiro treino para seus alunos.',
        actionTitle: 'Criar Treino',
        onAction: onCreateWorkout
      }
    } else {
      return {
        title: 'Nenhum treino disponível',
        message: 'Seu instrutor ainda não criou treinos para você.',
        actionTitle: undefined,
        onAction: undefined
      }
    }
  }

  const emptyConfig = getEmptyConfig()

  return (
    <WorkoutOperationWrapper
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyTitle={emptyConfig.title}
      emptyMessage={emptyConfig.message}
      emptyActionTitle={emptyConfig.actionTitle}
      onEmptyAction={emptyConfig.onAction}
      loadingMessage="Carregando treinos..."
      onRetry={onRetry}
      fallbackMessage="Não foi possível carregar os treinos."
    >
      {children}
    </WorkoutOperationWrapper>
  )
}

interface WorkoutFormWrapperProps {
  children: ReactNode
  saving?: boolean
  error?: WorkoutError | null
  onRetry?: () => void
  onErrorDismiss?: () => void
}

export function WorkoutFormWrapper({
  children,
  saving = false,
  error = null,
  onRetry,
  onErrorDismiss
}: WorkoutFormWrapperProps) {
  return (
    <WorkoutOperationWrapper
      error={error}
      onRetry={onRetry}
      onErrorDismiss={onErrorDismiss}
      showSavingIndicator={saving}
      fallbackMessage="Erro ao processar formulário do treino."
    >
      {children}
    </WorkoutOperationWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})