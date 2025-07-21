import React, { useEffect, useState, useCallback, useMemo, memo } from 'react'
import { View, FlatList, Image, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/services/supabase/supabase'
import { Card } from '@/components/common/Card'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { ThemedText } from '@/components/ThemedText'
import { useAuth } from '@/hooks/useAuth'
import { Exercise } from '@/types/database'
import { Loading } from '@/components/common/Loading'
import LazyImage, { ImagePlaceholder } from '@/components/common/LazyImage'
import ExerciseForm from '@/components/forms/ExerciseForm'
import { debounce } from '@/utils/debounce'
import { exerciseCache, cacheUtils } from '@/utils/cache'

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

const ExerciseListScreen = memo(() => {
  const { user, loading: loadingAuth } = useAuth()
  const router = useRouter()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [group, setGroup] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!loadingAuth && (!user || user.role !== 'instructor')) {
      router.replace('/login')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

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
        if (muscleGroup) query = query.eq('muscle_group', muscleGroup)
        if (searchTerm) query = query.ilike('name', `%${searchTerm}%`)

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
    if (user && user.role === 'instructor') {
      debouncedFetchExercises(search, group)
    }
  }, [user, search, group, debouncedFetchExercises])

  const clearFilters = useCallback(() => {
    setSearch('')
    setGroup(null)
    setSuccess('Filtros limpos com sucesso!')
  }, [])

  // Optimization functions for FlatList performance
  const keyExtractor = useCallback((item: Exercise) => item.id, [])

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 80, // Approximate height of exercise card
      offset: 80 * index,
      index,
    }),
    []
  )

  const renderExerciseItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <Card style={styles.card} accessible accessibilityLabel={`Exercício ${item.name}`}>
        {item.thumbnail_url ? (
          <LazyImage
            source={{ uri: item.thumbnail_url }}
            style={styles.thumb}
            placeholder={<ImagePlaceholder style={styles.thumb} />}
            accessibilityLabel={`Thumbnail de ${item.name}`}
          />
        ) : (
          <ImagePlaceholder style={styles.thumb} />
        )}
        <View style={{ flex: 1 }}>
          <ThemedText type="subtitle">{item.name}</ThemedText>
          <ThemedText>{item.muscle_group}</ThemedText>
        </View>
      </Card>
    ),
    []
  )

  if (loadingAuth) return <Loading />

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* Modal de cadastro de exercício */}
      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <ExerciseForm
          onSuccess={() => {
            setShowModal(false)
            setSuccess('Exercício cadastrado com sucesso!')
            fetchExercises(search, group)
          }}
        />
      </Modal>
      {/* Filtros e busca */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Input
          label="Buscar exercício"
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, marginRight: 8 }}
          accessibilityLabel="Buscar exercício"
        />
        {(search || group) && (
          <Button
            title="Limpar"
            variant="outlined"
            onPress={clearFilters}
            style={{ height: 40 }}
            accessibilityLabel="Limpar filtros"
          />
        )}
      </View>
      <FlatList
        data={MUSCLE_GROUPS}
        horizontal
        renderItem={({ item }) => (
          <Button
            title={item}
            variant={group === item ? 'contained' : 'outlined'}
            onPress={() => setGroup(item === group ? null : item)}
            style={{
              marginRight: 8,
              borderColor: group === item ? '#2563eb' : undefined,
              backgroundColor: group === item ? '#2563eb' : undefined,
            }}
            accessibilityLabel={`Filtrar por ${item}`}
          />
        )}
        keyExtractor={item => item}
        style={{ marginBottom: 12 }}
        showsHorizontalScrollIndicator={false}
      />
      {/* Botão de novo exercício */}
      <Button
        title="Novo Exercício"
        onPress={() => setShowModal(true)}
        style={{ marginBottom: 12 }}
        accessibilityLabel="Cadastrar novo exercício"
      />
      {loading && <ThemedText>Carregando...</ThemedText>}
      {error && <ThemedText style={{ color: 'red' }}>{error}</ThemedText>}
      {success && <ThemedText style={{ color: 'green' }}>{success}</ThemedText>}
      {!loading && exercises.length === 0 && <ThemedText>Nenhum exercício encontrado.</ThemedText>}
      <FlatList
        data={exercises}
        keyExtractor={keyExtractor}
        renderItem={renderExerciseItem}
        getItemLayout={getItemLayout}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
      />
    </View>
  )
})

ExerciseListScreen.displayName = 'ExerciseListScreen'

export default ExerciseListScreen

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  thumb: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
})
