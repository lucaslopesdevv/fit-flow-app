import React from 'react'
import { View, StyleSheet } from 'react-native'
import { ThemedText } from '../ThemedText'
import { ThemedView } from '../ThemedView'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { WorkoutError, WorkoutErrorType } from '@/services/api/WorkoutService'

interface WorkoutErrorMessageProps {
  error: WorkoutError
  onRetry?: () => void
  onDismiss?: () => void
  compact?: boolean
}

export function WorkoutErrorMessage({
  error,
  onRetry,
  onDismiss,
  compact = false,
}: WorkoutErrorMessageProps) {
  const getErrorConfig = () => {
    switch (error.type) {
      case WorkoutErrorType.NETWORK_ERROR:
        return {
          icon: '🌐',
          title: 'Problema de Conexão',
          message: 'Verifique sua conexão com a internet e tente novamente.',
          actionable: true,
          color: '#f59e0b',
        }

      case WorkoutErrorType.PERMISSION_ERROR:
        return {
          icon: '🔒',
          title: 'Acesso Negado',
          message: 'Você não tem permissão para realizar esta ação.',
          actionable: false,
          color: '#dc2626',
        }

      case WorkoutErrorType.VALIDATION_ERROR:
        return {
          icon: '⚠️',
          title: 'Dados Inválidos',
          message: error.message,
          actionable: false,
          color: '#ea580c',
        }

      case WorkoutErrorType.NOT_FOUND_ERROR:
        return {
          icon: '🔍',
          title: 'Não Encontrado',
          message: 'O treino solicitado não foi encontrado. Pode ter sido removido.',
          actionable: false,
          color: '#6b7280',
        }

      default:
        return {
          icon: '❌',
          title: 'Erro',
          message: error.message || 'Ocorreu um erro inesperado.',
          actionable: true,
          color: '#dc2626',
        }
    }
  }

  const config = getErrorConfig()

  if (compact) {
    return (
      <View style={[styles.compactContainer, { borderLeftColor: config.color }]}>
        <View style={styles.compactContent}>
          <ThemedText style={styles.compactIcon}>{config.icon}</ThemedText>
          <View style={styles.compactText}>
            <ThemedText style={[styles.compactTitle, { color: config.color }]}>
              {config.title}
            </ThemedText>
            <ThemedText style={styles.compactMessage}>{config.message}</ThemedText>
          </View>
        </View>

        <View style={styles.compactActions}>
          {config.actionable && onRetry && (
            <Button
              title="Tentar Novamente"
              variant="text"
              onPress={onRetry}
              style={styles.compactButton}
            />
          )}
          {onDismiss && (
            <Button
              title="Dispensar"
              variant="text"
              onPress={onDismiss}
              style={styles.compactButton}
            />
          )}
        </View>
      </View>
    )
  }

  return (
    <Card style={styles.container} variant="outlined">
      <View style={styles.header}>
        <ThemedText style={styles.icon}>{config.icon}</ThemedText>
        <ThemedText type="subtitle" style={[styles.title, { color: config.color }]}>
          {config.title}
        </ThemedText>
      </View>

      <ThemedText style={styles.message}>{config.message}</ThemedText>

      {error.field && <ThemedText style={styles.fieldError}>Campo: {error.field}</ThemedText>}

      <View style={styles.actions}>
        {config.actionable && onRetry && (
          <Button
            title="Tentar Novamente"
            variant="contained"
            onPress={onRetry}
            style={styles.retryButton}
          />
        )}
        {onDismiss && (
          <Button
            title="Dispensar"
            variant="text"
            onPress={onDismiss}
            style={styles.dismissButton}
          />
        )}
      </View>
    </Card>
  )
}

interface NetworkErrorFallbackProps {
  onRetry: () => void
  message?: string
}

export function NetworkErrorFallback({
  onRetry,
  message = 'Não foi possível carregar os dados.',
}: NetworkErrorFallbackProps) {
  return (
    <ThemedView style={styles.fallbackContainer}>
      <View style={styles.fallbackContent}>
        <ThemedText style={styles.fallbackIcon}>📡</ThemedText>
        <ThemedText type="subtitle" style={styles.fallbackTitle}>
          Sem Conexão
        </ThemedText>
        <ThemedText style={styles.fallbackMessage}>{message}</ThemedText>
        <Button
          title="Tentar Novamente"
          variant="contained"
          onPress={onRetry}
          style={styles.fallbackButton}
        />
      </View>
    </ThemedView>
  )
}

interface EmptyStateFallbackProps {
  title: string
  message: string
  actionTitle?: string
  onAction?: () => void
  icon?: string
}

export function EmptyStateFallback({
  title,
  message,
  actionTitle,
  onAction,
  icon = '📝',
}: EmptyStateFallbackProps) {
  return (
    <ThemedView style={styles.emptyContainer}>
      <View style={styles.emptyContent}>
        <ThemedText style={styles.emptyIcon}>{icon}</ThemedText>
        <ThemedText type="subtitle" style={styles.emptyTitle}>
          {title}
        </ThemedText>
        <ThemedText style={styles.emptyMessage}>{message}</ThemedText>
        {actionTitle && onAction && (
          <Button
            title={actionTitle}
            variant="contained"
            onPress={onAction}
            style={styles.emptyButton}
          />
        )}
      </View>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  title: {
    flex: 1,
  },
  message: {
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  fieldError: {
    fontSize: 12,
    color: '#dc2626',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  retryButton: {
    minWidth: 120,
  },
  dismissButton: {
    minWidth: 80,
  },
  compactContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftWidth: 4,
    padding: 12,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  compactIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  compactText: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  compactMessage: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  compactActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  compactButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fallbackContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  fallbackIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  fallbackTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  fallbackMessage: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
    marginBottom: 24,
  },
  fallbackButton: {
    minWidth: 160,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 160,
  },
})
