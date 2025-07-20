import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native'
import { ThemedText } from '@/components/ThemedText'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Loading } from '@/components/common/Loading'
import { Input } from '@/components/common/Input'
import { useAuth } from '@/hooks/useAuth'
import { WorkoutService, WorkoutError, WorkoutErrorType } from '@/services/api/WorkoutService'
import { WorkoutWithExercises, Profile } from '@/types/database'
import WorkoutDetailsModal from './WorkoutDetailsModal'
import CreateWorkoutModal from './CreateWorkoutModal'

interface WorkoutManagementModalProps {
  visible: boolean
  onClose: () => void
  instructorStudents: Profile[]
  onWorkoutChange?: () => void
}

interface FilterState {
  search: string
  studentId: string
  sortBy: 'name' | 'date' | 'student'
  sortOrder: 'asc' | 'desc'
}

const INITIAL_FILTER_STATE: FilterState = {
  search: '',
  studentId: '',
  sortBy: 'date',
  sortOrder: 'desc'
}

export default function WorkoutManagementModal({
  visible,
  onClose,
  instructorStudents,
  onWorkoutChange
}: WorkoutManagementModalProps) {
  const { user } = useAuth()
  const [workouts, setWorkouts] = useState<WorkoutWithExercises[]>([])
  const [filteredWorkouts, setFilteredWorkouts] = useState<WorkoutWithExercises[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER_STATE)
  
  // Modal states
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithExercises | null>(null)
  const [showWorkoutDetails, setShowWorkoutDetails] = useState(false)
  const [showCreateWorkout, setShowCreateWorkout] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<WorkoutWithExercises | null>(null)

  const fetchWorkouts = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const workoutsData = await WorkoutService.getInstructorWorkouts(user.id)
      setWorkouts(workoutsData)
    } catch (error) {
      let errorMessage = 'Erro ao carregar treinos.'
      
      if (error instanceof WorkoutError) {
        switch (error.type) {
          case WorkoutErrorType.NETWORK_ERROR:
            errorMessage = 'Erro de conexão. Verifique sua internet.'
            break
          default:
            errorMessage = error.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchWorkouts()
    setRefreshing(false)
  }, [fetchWorkouts])

  // Filter and sort workouts
  useEffect(() => {
    let filtered = [...workouts]

    // Apply search filter
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(workout =>
        workout.name.toLowerCase().includes(searchLower) ||
        workout.description?.toLowerCase().includes(searchLower) ||
        workout.student?.full_name?.toLowerCase().includes(searchLower)
      )
    }

    // Apply student filter
    if (filters.studentId) {
      filtered = filtered.filter(workout => workout.student_id === filters.studentId)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'student':
          const studentA = a.student?.full_name || ''
          const studentB = b.student?.full_name || ''
          comparison = studentA.localeCompare(studentB)
          break
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison
    })

    setFilteredWorkouts(filtered)
  }, [workouts, filters])

  useEffect(() => {
    if (visible) {
      fetchWorkouts()
      setFilters(INITIAL_FILTER_STATE)
    }
  }, [visible, fetchWorkouts])

  const handleWorkoutPress = (workout: WorkoutWithExercises) => {
    setSelectedWorkout(workout)
    setShowWorkoutDetails(true)
  }

  const handleEditWorkout = (workout: WorkoutWithExercises) => {
    setEditingWorkout(workout)
    setShowCreateWorkout(true)
  }

  const handleDuplicateWorkout = async (workout: WorkoutWithExercises) => {
    if (!user?.id) return

    Alert.alert(
      'Duplicar Treino',
      `Deseja duplicar o treino "${workout.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Duplicar',
          onPress: async () => {
            try {
              setLoading(true)
              await WorkoutService.duplicateWorkout(workout.id, user.id)
              await fetchWorkouts()
              onWorkoutChange?.()
              Alert.alert('Sucesso', 'Treino duplicado com sucesso!')
            } catch (error) {
              let errorMessage = 'Erro ao duplicar treino.'
              
              if (error instanceof WorkoutError) {
                errorMessage = error.message
              }
              
              Alert.alert('Erro', errorMessage)
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  const handleDeleteWorkout = async (workout: WorkoutWithExercises) => {
    if (!user?.id) return

    Alert.alert(
      'Excluir Treino',
      `Tem certeza que deseja excluir o treino "${workout.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true)
              await WorkoutService.deleteWorkout(workout.id, user.id)
              await fetchWorkouts()
              onWorkoutChange?.()
              Alert.alert('Sucesso', 'Treino excluído com sucesso!')
            } catch (error) {
              let errorMessage = 'Erro ao excluir treino.'
              
              if (error instanceof WorkoutError) {
                errorMessage = error.message
              }
              
              Alert.alert('Erro', errorMessage)
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  const handleWorkoutCreated = (workout: WorkoutWithExercises) => {
    fetchWorkouts()
    onWorkoutChange?.()
    setEditingWorkout(null)
    
    const action = editingWorkout ? 'atualizado' : 'criado'
    Alert.alert('Sucesso', `Treino ${action} com sucesso!`)
  }

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters(INITIAL_FILTER_STATE)
  }

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <Input
        placeholder="Buscar treinos..."
        value={filters.search}
        onChangeText={(text) => updateFilter('search', text)}
        style={styles.searchInput}
      />
      
      <View style={styles.filterRow}>
        <View style={styles.filterItem}>
          <ThemedText style={styles.filterLabel}>Aluno:</ThemedText>
          <View style={styles.pickerContainer}>
            {/* Simple picker implementation */}
            <Button
              title={
                filters.studentId 
                  ? instructorStudents.find(s => s.id === filters.studentId)?.full_name || 'Todos'
                  : 'Todos'
              }
              variant="outlined"
              onPress={() => {
                Alert.alert(
                  'Filtrar por Aluno',
                  'Selecione um aluno:',
                  [
                    { text: 'Todos', onPress: () => updateFilter('studentId', '') },
                    ...instructorStudents.map(student => ({
                      text: student.full_name,
                      onPress: () => updateFilter('studentId', student.id)
                    }))
                  ]
                )
              }}
              style={styles.filterButton}
            />
          </View>
        </View>

        <View style={styles.filterItem}>
          <ThemedText style={styles.filterLabel}>Ordenar:</ThemedText>
          <Button
            title={
              filters.sortBy === 'name' ? 'Nome' :
              filters.sortBy === 'date' ? 'Data' : 'Aluno'
            }
            variant="outlined"
            onPress={() => {
              Alert.alert(
                'Ordenar por',
                'Selecione o critério:',
                [
                  { text: 'Nome', onPress: () => updateFilter('sortBy', 'name') },
                  { text: 'Data', onPress: () => updateFilter('sortBy', 'date') },
                  { text: 'Aluno', onPress: () => updateFilter('sortBy', 'student') }
                ]
              )
            }}
            style={styles.filterButton}
          />
        </View>
      </View>

      {(filters.search || filters.studentId) && (
        <Button
          title="Limpar Filtros"
          variant="text"
          onPress={clearFilters}
          style={styles.clearFiltersButton}
        />
      )}
    </View>
  )

  const renderWorkoutCard = (workout: WorkoutWithExercises) => (
    <Card key={workout.id} style={styles.workoutCard}>
      <View style={styles.workoutHeader}>
        <View style={styles.workoutInfo}>
          <ThemedText type="subtitle" numberOfLines={1}>
            {workout.name}
          </ThemedText>
          <ThemedText style={styles.workoutStudent}>
            {workout.student?.full_name}
          </ThemedText>
          <ThemedText style={styles.workoutMeta}>
            {workout.exercises.length} exercício{workout.exercises.length !== 1 ? 's' : ''} • {' '}
            {new Date(workout.created_at).toLocaleDateString('pt-BR')}
          </ThemedText>
        </View>
        
        <View style={styles.workoutActions}>
          <Button
            title="Ver"
            variant="text"
            onPress={() => handleWorkoutPress(workout)}
            style={styles.actionButton}
          />
          <Button
            title="Editar"
            variant="text"
            onPress={() => handleEditWorkout(workout)}
            style={styles.actionButton}
          />
          <Button
            title="⋯"
            variant="text"
            onPress={() => {
              Alert.alert(
                'Ações do Treino',
                `Treino: ${workout.name}`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Duplicar', onPress: () => handleDuplicateWorkout(workout) },
                  { text: 'Excluir', style: 'destructive', onPress: () => handleDeleteWorkout(workout) }
                ]
              )
            }}
            style={styles.moreButton}
          />
        </View>
      </View>
      
      {workout.description && (
        <ThemedText style={styles.workoutDescription} numberOfLines={2}>
          {workout.description}
        </ThemedText>
      )}
    </Card>
  )

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Button
              title="Fechar"
              variant="text"
              onPress={onClose}
              accessibilityLabel="Fechar gerenciamento de treinos"
            />
            <ThemedText type="subtitle" style={styles.headerTitle}>
              Gerenciar Treinos
            </ThemedText>
            <Button
              title="Novo"
              variant="text"
              onPress={() => setShowCreateWorkout(true)}
              accessibilityLabel="Criar novo treino"
            />
          </View>

          {/* Filters */}
          {renderFilters()}

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#2563eb']}
                tintColor="#2563eb"
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {error && (
              <Card style={styles.errorCard}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
                <Button
                  title="Tentar Novamente"
                  onPress={fetchWorkouts}
                  style={styles.retryButton}
                />
              </Card>
            )}

            {loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <Loading />
                <ThemedText style={styles.loadingText}>
                  Carregando treinos...
                </ThemedText>
              </View>
            ) : filteredWorkouts.length === 0 ? (
              <Card style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>
                  {filters.search || filters.studentId 
                    ? 'Nenhum treino encontrado com os filtros aplicados.'
                    : 'Nenhum treino criado ainda.'
                  }
                </ThemedText>
                <ThemedText style={styles.emptySubtext}>
                  {filters.search || filters.studentId
                    ? 'Tente ajustar os filtros de busca.'
                    : 'Crie seu primeiro treino para começar!'
                  }
                </ThemedText>
              </Card>
            ) : (
              <View style={styles.workoutsList}>
                <ThemedText style={styles.resultsCount}>
                  {filteredWorkouts.length} treino{filteredWorkouts.length !== 1 ? 's' : ''} encontrado{filteredWorkouts.length !== 1 ? 's' : ''}
                </ThemedText>
                {filteredWorkouts.map(renderWorkoutCard)}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Workout Details Modal */}
      <WorkoutDetailsModal
        visible={showWorkoutDetails}
        workout={selectedWorkout}
        onClose={() => {
          setShowWorkoutDetails(false)
          setSelectedWorkout(null)
        }}
      />

      {/* Create/Edit Workout Modal */}
      <CreateWorkoutModal
        visible={showCreateWorkout}
        onClose={() => {
          setShowCreateWorkout(false)
          setEditingWorkout(null)
        }}
        onSuccess={handleWorkoutCreated}
        instructorStudents={instructorStudents}
        editingWorkout={editingWorkout}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInput: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#6c757d',
  },
  pickerContainer: {
    flex: 1,
  },
  filterButton: {
    paddingVertical: 8,
  },
  clearFiltersButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  errorCard: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc3545',
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    alignSelf: 'center',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6c757d',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#6c757d',
    textAlign: 'center',
  },
  workoutsList: {
    flex: 1,
  },
  resultsCount: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
    textAlign: 'center',
  },
  workoutCard: {
    marginBottom: 12,
    padding: 16,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  workoutInfo: {
    flex: 1,
    marginRight: 12,
  },
  workoutStudent: {
    color: '#2563eb',
    fontWeight: '600',
    marginTop: 4,
  },
  workoutMeta: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  workoutDescription: {
    color: '#6c757d',
    marginTop: 8,
    fontSize: 14,
  },
  workoutActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 50,
  },
  moreButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 30,
  },
})