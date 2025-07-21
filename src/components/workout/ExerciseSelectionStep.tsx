import { useEffect, useState, useCallback, useMemo, memo } from 'react'
import { View, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { supabase } from '../../services/supabase/supabase'
import { Card } from '../common/Card'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { ThemedText } from '../ThemedText'
import { ThemedView } from '../ThemedView'
import LazyImage, { ImagePlaceholder } from '../common/LazyImage'
import { Exercise, ExerciseSelectionStepProps, WorkoutExerciseConfig } from '../../types/database'
import { Loading } from '../common/Loading'
import { debounce } from '../../utils/debounce'
import { exerciseCache, cacheUtils } from '../../utils/cache'

const MUSCLE_GROUPS = [
  'Peito',
  'Costas',
  'Pernas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Abdômen',
  'Glúteos',
]

const ExerciseSelectionStep = memo(
  ({
    selectedExercises,
    onExerciseAdd,
    onExerciseRemove,
    onExerciseReorder,
  }: ExerciseSelectionStepProps) => {
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

    // Memoized selected exercise IDs for quick lookup
    const selectedExerciseIds = useMemo(
      () => new Set(selectedExercises.map(ex => ex.exerciseId)),
      [selectedExercises]
    )

    const fetchExercises = useCallback(
      async (searchTerm: string = '', muscleGroup: string | null = null) => {
        setLoading(true)
        setError(null)

        // Generate cache key
        const cacheKey = cacheUtils.getExerciseQueryKey(searchTerm, muscleGroup || undefined)

        // Check cache first
        const cachedExercises = exerciseCache.get<Exercise[]>(cacheKey)
        if (cachedExercises) {
          setExercises(cachedExercises)
          setLoading(false)
          return
        }

        try {
          let query = supabase.from('exercises').select('*')

          if (muscleGroup) {
            query = query.eq('muscle_group', muscleGroup)
          }

          if (searchTerm.trim()) {
            query = query.ilike('name', `%${searchTerm.trim()}%`)
          }

          const { data, error } = await query.order('name')

          if (error) {
            setError(error.message)
          } else {
            const exerciseData = data || []
            setExercises(exerciseData)

            // Cache the results for 10 minutes
            exerciseCache.set(cacheKey, exerciseData, 10 * 60 * 1000)
          }
        } catch (err) {
          setError('Erro ao carregar exercícios')
        } finally {
          setLoading(false)
        }
      },
      []
    )

    // Debounced fetch function
    const debouncedFetchExercises = useMemo(
      () =>
        debounce(async (searchTerm: string, muscleGroup: string | null) => {
          await fetchExercises(searchTerm, muscleGroup)
        }, 300), // 300ms debounce as per requirements
      [fetchExercises]
    )

    useEffect(() => {
      debouncedFetchExercises(search, selectedGroup)
    }, [search, selectedGroup, debouncedFetchExercises])

    const clearFilters = useCallback(() => {
      setSearch('')
      setSelectedGroup(null)
    }, [])

    const handleExerciseToggle = useCallback(
      (exercise: Exercise) => {
        if (selectedExerciseIds.has(exercise.id)) {
          onExerciseRemove(exercise.id)
        } else {
          onExerciseAdd(exercise)
        }
      },
      [selectedExerciseIds, onExerciseAdd, onExerciseRemove]
    )

    const handleReorderExercise = useCallback(
      (exerciseId: string, direction: 'up' | 'down') => {
        const currentIndex = selectedExercises.findIndex(ex => ex.exerciseId === exerciseId)
        if (currentIndex === -1) return

        const newExercises = [...selectedExercises]
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

        if (targetIndex < 0 || targetIndex >= newExercises.length) return

        // Swap exercises
        ;[newExercises[currentIndex], newExercises[targetIndex]] = [
          newExercises[targetIndex],
          newExercises[currentIndex],
        ]

        // Update order indices
        newExercises.forEach((exercise, index) => {
          exercise.orderIndex = index + 1
        })

        onExerciseReorder(newExercises)
      },
      [selectedExercises, onExerciseReorder]
    )

    // Optimization functions for FlatList performance
    const keyExtractor = useCallback((item: Exercise) => item.id, [])
    const selectedKeyExtractor = useCallback((item: WorkoutExerciseConfig) => item.exerciseId, [])

    const getItemLayout = useCallback(
      (_: any, index: number) => ({
        length: 80, // Approximate height of exercise card
        offset: 80 * index,
        index,
      }),
      []
    )

    const getSelectedItemLayout = useCallback(
      (_: any, index: number) => ({
        length: 72, // Approximate height of selected exercise card
        offset: 72 * index,
        index,
      }),
      []
    )

    // Memoized render functions for better performance
    const renderExerciseItem = useCallback(
      ({ item }: { item: Exercise }) => {
        const isSelected = selectedExerciseIds.has(item.id)

        return (
          <ExerciseItem exercise={item} isSelected={isSelected} onToggle={handleExerciseToggle} />
        )
      },
      [selectedExerciseIds, handleExerciseToggle]
    )

    const renderSelectedExerciseItem = useCallback(
      ({ item, index }: { item: WorkoutExerciseConfig; index: number }) => {
        return (
          <SelectedExerciseItem
            item={item}
            index={index}
            totalCount={selectedExercises.length}
            onReorder={handleReorderExercise}
            onRemove={onExerciseRemove}
          />
        )
      },
      [selectedExercises.length, handleReorderExercise, onExerciseRemove]
    )

    return (
      <ThemedView style={styles.container}>
        {/* Selected Exercises Preview */}
        {selectedExercises.length > 0 && (
          <View style={styles.selectedSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Exercícios Selecionados ({selectedExercises.length})
            </ThemedText>
            <FlatList
              data={selectedExercises}
              keyExtractor={selectedKeyExtractor}
              renderItem={renderSelectedExerciseItem}
              style={styles.selectedList}
              showsVerticalScrollIndicator={false}
              accessibilityLabel="Lista de exercícios selecionados"
              getItemLayout={getSelectedItemLayout}
              removeClippedSubviews={true}
              maxToRenderPerBatch={5}
              initialNumToRender={5}
            />
          </View>
        )}

        {/* Search and Filters */}
        <View style={styles.filtersSection}>
          <View style={styles.searchRow}>
            <Input
              label="Buscar exercício"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              accessibilityLabel="Campo de busca de exercícios"
              accessibilityHint="Digite o nome do exercício que deseja encontrar"
            />
            {(search || selectedGroup) && (
              <Button
                title="Limpar"
                variant="outlined"
                onPress={clearFilters}
                style={styles.clearButton}
                accessibilityLabel="Limpar filtros de busca"
              />
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.muscleGroupsContainer}
            accessibilityLabel="Filtros por grupo muscular"
          >
            {MUSCLE_GROUPS.map(group => (
              <Button
                key={group}
                title={group}
                variant={selectedGroup === group ? 'contained' : 'outlined'}
                onPress={() => setSelectedGroup(group === selectedGroup ? null : group)}
                style={[
                  styles.muscleGroupButton,
                  selectedGroup === group && styles.selectedMuscleGroupButton,
                ]}
                accessibilityLabel={`Filtrar exercícios de ${group}`}
                accessibilityState={{ selected: selectedGroup === group }}
              />
            ))}
          </ScrollView>
        </View>

        {/* Exercise List */}
        <View style={styles.exerciseListSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Exercícios Disponíveis
          </ThemedText>

          {loading && (
            <View style={styles.loadingContainer}>
              <Loading />
              <ThemedText style={styles.loadingText}>Carregando exercícios...</ThemedText>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
              <Button
                title="Tentar Novamente"
                onPress={() => fetchExercises(search, selectedGroup)}
                style={styles.retryButton}
                accessibilityLabel="Tentar carregar exercícios novamente"
              />
            </View>
          )}

          {!loading && !error && exercises.length === 0 && (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                {search || selectedGroup
                  ? 'Nenhum exercício encontrado com os filtros aplicados.'
                  : 'Nenhum exercício disponível.'}
              </ThemedText>
            </View>
          )}

          {!loading && !error && exercises.length > 0 && (
            <FlatList
              data={exercises}
              keyExtractor={keyExtractor}
              renderItem={renderExerciseItem}
              style={styles.exerciseList}
              showsVerticalScrollIndicator={false}
              accessibilityLabel="Lista de exercícios disponíveis"
              getItemLayout={getItemLayout}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={50}
              initialNumToRender={10}
              windowSize={10}
            />
          )}
        </View>
      </ThemedView>
    )
  }
)

ExerciseSelectionStep.displayName = 'ExerciseSelectionStep'

// Memoized sub-components for better performance
const ExerciseItem = memo(
  ({
    exercise,
    isSelected,
    onToggle,
  }: {
    exercise: Exercise
    isSelected: boolean
    onToggle: (exercise: Exercise) => void
  }) => (
    <TouchableOpacity
      onPress={() => onToggle(exercise)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${isSelected ? 'Remover' : 'Adicionar'} exercício ${exercise.name}`}
      accessibilityHint={`Exercício para ${exercise.muscle_group}`}
    >
      <Card style={[styles.exerciseCard, isSelected && styles.selectedExerciseCard]}>
        {exercise.thumbnail_url ? (
          <LazyImage
            source={{ uri: exercise.thumbnail_url }}
            style={styles.thumbnail}
            placeholder={<ImagePlaceholder style={styles.thumbnail} />}
            accessibilityLabel={`Imagem do exercício ${exercise.name}`}
          />
        ) : (
          <ImagePlaceholder style={styles.thumbnail} />
        )}
        <View style={styles.exerciseInfo}>
          <ThemedText
            type="subtitle"
            style={[styles.exerciseName, isSelected && styles.selectedText]}
          >
            {exercise.name}
          </ThemedText>
          <ThemedText style={[styles.muscleGroup, isSelected && styles.selectedText]}>
            {exercise.muscle_group}
          </ThemedText>
        </View>
        <View style={styles.selectionIndicator}>
          {isSelected && (
            <View style={styles.checkmark}>
              <ThemedText style={styles.checkmarkText}>✓</ThemedText>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  )
)

ExerciseItem.displayName = 'ExerciseItem'

const SelectedExerciseItem = memo(
  ({
    item,
    index,
    totalCount,
    onReorder,
    onRemove,
  }: {
    item: WorkoutExerciseConfig
    index: number
    totalCount: number
    onReorder: (exerciseId: string, direction: 'up' | 'down') => void
    onRemove: (exerciseId: string) => void
  }) => (
    <Card style={styles.selectedExercisePreview}>
      <View style={styles.selectedExerciseHeader}>
        <View style={styles.selectedExerciseInfo}>
          {item.exercise.thumbnail_url ? (
            <LazyImage
              source={{ uri: item.exercise.thumbnail_url }}
              style={styles.smallThumbnail}
              placeholder={<ImagePlaceholder style={styles.smallThumbnail} />}
              accessibilityLabel={`Imagem do exercício ${item.exercise.name}`}
            />
          ) : (
            <ImagePlaceholder style={styles.smallThumbnail} />
          )}
          <View>
            <ThemedText type="subtitle" style={styles.selectedExerciseName}>
              {item.exercise.name}
            </ThemedText>
            <ThemedText style={styles.selectedExerciseMuscle}>
              {item.exercise.muscle_group}
            </ThemedText>
          </View>
        </View>

        <View style={styles.reorderButtons}>
          <TouchableOpacity
            onPress={() => onReorder(item.exerciseId, 'up')}
            disabled={index === 0}
            style={[styles.reorderButton, index === 0 && styles.disabledButton]}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Mover ${item.exercise.name} para cima`}
            accessibilityHint="Move o exercício uma posição acima na lista"
          >
            <ThemedText
              style={[styles.reorderButtonText, index === 0 && styles.disabledButtonText]}
            >
              ↑
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onReorder(item.exerciseId, 'down')}
            disabled={index === totalCount - 1}
            style={[styles.reorderButton, index === totalCount - 1 && styles.disabledButton]}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Mover ${item.exercise.name} para baixo`}
            accessibilityHint="Move o exercício uma posição abaixo na lista"
          >
            <ThemedText
              style={[
                styles.reorderButtonText,
                index === totalCount - 1 && styles.disabledButtonText,
              ]}
            >
              ↓
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onRemove(item.exerciseId)}
            style={styles.removeButton}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Remover ${item.exercise.name} do treino`}
            accessibilityHint="Remove o exercício da lista do treino"
          >
            <ThemedText style={styles.removeButtonText}>×</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  )
)

SelectedExerciseItem.displayName = 'SelectedExerciseItem'

export default ExerciseSelectionStep

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  selectedSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  selectedList: {
    maxHeight: 200,
  },
  selectedExercisePreview: {
    marginBottom: 8,
    padding: 12,
  },
  selectedExerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedExerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  smallThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  selectedExerciseName: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedExerciseMuscle: {
    fontSize: 12,
    opacity: 0.7,
  },
  reorderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reorderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    minWidth: 44, // Accessibility touch target
    minHeight: 44,
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
    opacity: 0.5,
  },
  reorderButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: '#999',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    minWidth: 44, // Accessibility touch target
    minHeight: 44,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  filtersSection: {
    marginBottom: 24,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
  },
  clearButton: {
    height: 40,
    paddingHorizontal: 16,
  },
  muscleGroupsContainer: {
    marginBottom: 8,
  },
  muscleGroupButton: {
    marginRight: 8,
    paddingHorizontal: 16,
  },
  selectedMuscleGroupButton: {
    backgroundColor: '#2563eb',
  },
  exerciseListSection: {
    flex: 1,
  },
  exerciseList: {
    flex: 1,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 12,
    minHeight: 72, // Accessibility touch target
  },
  selectedExerciseCard: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 2,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    marginBottom: 4,
  },
  muscleGroup: {
    fontSize: 14,
    opacity: 0.7,
  },
  selectedText: {
    color: '#1976d2',
    fontWeight: '500',
  },
  selectionIndicator: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 8,
    opacity: 0.7,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
})
