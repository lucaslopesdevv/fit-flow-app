import React, { useEffect, useState, useRef } from "react"
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from "react-native"
import { useRouter } from "expo-router"
import { supabase } from "@/services/supabase/supabase"
import { Card } from "@/components/common/Card"
import { Input } from "@/components/common/Input"
import { Button } from "@/components/common/Button"
import { ThemedText } from "@/components/ThemedText"
import { useAuth } from "@/hooks/useAuth"
import { Exercise } from "@/types/database"
import { Loading } from "@/components/common/Loading"
import ExerciseForm from "@/components/forms/ExerciseForm"

const MUSCLE_GROUPS = [
  "Peito",
  "Costas",
  "Pernas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Abdômen",
  "Glúteos",
]

export default function ExerciseListScreen() {
  const { user, loading: loadingAuth } = useAuth()
  const router = useRouter()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [group, setGroup] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const searchTimeout = useRef<any>(null)

  useEffect(() => {
    if (!loadingAuth && (!user || user.role !== "instructor")) {
      router.replace("/login")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (user && user.role === "instructor") {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
      searchTimeout.current = setTimeout(() => {
        fetchExercises()
      }, 400)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, search])

  async function fetchExercises() {
    setLoading(true)
    setError(null)
    let query = supabase.from("exercises").select("*")
    if (group) query = query.eq("muscle_group", group)
    if (search) query = query.ilike("name", `%${search}%`)
    const { data, error } = await query
    if (error) setError(error.message)
    else setExercises(data || [])
    setLoading(false)
  }

  function clearFilters() {
    setSearch("")
    setGroup(null)
    setSuccess("Filtros limpos com sucesso!")
  }

  if (loadingAuth) return <Loading />

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* Modal de cadastro de exercício */}
      <Modal
        visible={showModal}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <ExerciseForm
          onSuccess={() => {
            setShowModal(false)
            setSuccess("Exercício cadastrado com sucesso!")
            fetchExercises()
          }}
        />
      </Modal>
      {/* Filtros e busca */}
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
      >
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
            variant={group === item ? "contained" : "outlined"}
            onPress={() => setGroup(item === group ? null : item)}
            style={{
              marginRight: 8,
              borderColor: group === item ? "#2563eb" : undefined,
              backgroundColor: group === item ? "#2563eb" : undefined,
            }}
            accessibilityLabel={`Filtrar por ${item}`}
          />
        )}
        keyExtractor={(item) => item}
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
      {error && <ThemedText style={{ color: "red" }}>{error}</ThemedText>}
      {success && <ThemedText style={{ color: "green" }}>{success}</ThemedText>}
      {!loading && exercises.length === 0 && (
        <ThemedText>Nenhum exercício encontrado.</ThemedText>
      )}
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            accessible
            accessibilityLabel={`Exercício ${item.name}`}
          >
            {item.thumbnail_url && (
              <Image
                source={{ uri: item.thumbnail_url }}
                style={styles.thumb}
                accessibilityLabel={`Thumbnail de ${item.name}`}
              />
            )}
            <View style={{ flex: 1 }}>
              <ThemedText type="subtitle">{item.name}</ThemedText>
              <ThemedText>{item.muscle_group}</ThemedText>
            </View>
          </Card>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  thumb: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
})
