import React from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { ThemedText } from '../ThemedText'
import { ThemedView } from '../ThemedView'
import { Card } from '../common/Card'

interface WorkoutLoadingProps {
  message?: string
  fullScreen?: boolean
  overlay?: boolean
}

export function WorkoutLoading({
  message = 'Carregando treinos...',
  fullScreen = false,
  overlay = false,
}: WorkoutLoadingProps) {
  const containerStyles = [
    styles.container,
    fullScreen && styles.fullScreen,
    overlay && styles.overlay,
  ]

  return (
    <View style={containerStyles}>
      <ActivityIndicator size="large" color="#2563eb" />
      <ThemedText style={styles.message}>{message}</ThemedText>
    </View>
  )
}

export function WorkoutCreationLoading() {
  return (
    <ThemedView style={styles.creationContainer}>
      <View style={styles.creationContent}>
        <ActivityIndicator size="large" color="#2563eb" />
        <ThemedText type="subtitle" style={styles.creationTitle}>
          Criando Treino
        </ThemedText>
        <ThemedText style={styles.creationMessage}>
          Salvando exercícios e configurações...
        </ThemedText>
      </View>
    </ThemedView>
  )
}

export function WorkoutListLoading() {
  return (
    <View style={styles.listContainer}>
      {[1, 2, 3].map(index => (
        <Card key={index} style={styles.skeletonCard} variant="outlined">
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonAvatar} />
            <View style={styles.skeletonText}>
              <View style={styles.skeletonTitle} />
              <View style={styles.skeletonSubtitle} />
            </View>
          </View>
          <View style={styles.skeletonBody}>
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonLineShort} />
          </View>
        </Card>
      ))}
    </View>
  )
}

export function WorkoutDetailsLoading() {
  return (
    <View style={styles.detailsContainer}>
      <Card style={styles.skeletonCard} variant="elevated">
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonLineShort} />
        <View style={styles.skeletonStats}>
          {[1, 2, 3].map(index => (
            <View key={index} style={styles.skeletonStat}>
              <View style={styles.skeletonStatValue} />
              <View style={styles.skeletonStatLabel} />
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.exercisesLoading}>
        <View style={styles.skeletonSectionTitle} />
        {[1, 2, 3].map(index => (
          <Card key={index} style={styles.skeletonExerciseCard} variant="outlined">
            <View style={styles.skeletonExerciseHeader}>
              <View style={styles.skeletonExerciseImage} />
              <View style={styles.skeletonExerciseInfo}>
                <View style={styles.skeletonExerciseName} />
                <View style={styles.skeletonExerciseMuscle} />
              </View>
              <View style={styles.skeletonExerciseOrder} />
            </View>
            <View style={styles.skeletonExerciseConfig}>
              {[1, 2, 3].map(configIndex => (
                <View key={configIndex} style={styles.skeletonConfigItem}>
                  <View style={styles.skeletonConfigLabel} />
                  <View style={styles.skeletonConfigValue} />
                </View>
              ))}
            </View>
          </Card>
        ))}
      </View>
    </View>
  )
}

export function WorkoutSavingIndicator({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <View style={styles.savingOverlay}>
      <View style={styles.savingContainer}>
        <ActivityIndicator size="large" color="#28a745" />
        <ThemedText style={styles.savingText}>Salvando treino...</ThemedText>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 1000,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  message: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  creationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  creationContent: {
    alignItems: 'center',
    padding: 32,
  },
  creationTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  creationMessage: {
    textAlign: 'center',
    color: '#666',
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  skeletonCard: {
    padding: 16,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    marginRight: 12,
  },
  skeletonText: {
    flex: 1,
  },
  skeletonTitle: {
    height: 20,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonSubtitle: {
    height: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    width: '70%',
  },
  skeletonBody: {
    gap: 8,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  skeletonLineShort: {
    height: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    width: '60%',
  },
  detailsContainer: {
    padding: 16,
    gap: 24,
  },
  skeletonStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  skeletonStat: {
    alignItems: 'center',
  },
  skeletonStatValue: {
    width: 32,
    height: 24,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonStatLabel: {
    width: 60,
    height: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  exercisesLoading: {
    gap: 12,
  },
  skeletonSectionTitle: {
    height: 24,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    width: '40%',
    marginBottom: 4,
  },
  skeletonExerciseCard: {
    padding: 16,
  },
  skeletonExerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonExerciseImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
    marginRight: 12,
  },
  skeletonExerciseInfo: {
    flex: 1,
  },
  skeletonExerciseName: {
    height: 18,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 6,
    width: '80%',
  },
  skeletonExerciseMuscle: {
    height: 14,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    width: '60%',
  },
  skeletonExerciseOrder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
  },
  skeletonExerciseConfig: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  skeletonConfigItem: {
    alignItems: 'center',
    flex: 1,
  },
  skeletonConfigLabel: {
    width: 50,
    height: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonConfigValue: {
    width: 30,
    height: 16,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  savingContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  savingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
})
