import React, { useEffect, useState } from "react"
import { View, FlatList, StyleSheet } from "react-native"
import { supabase } from "@/services/supabase/supabase"
import { useAuth } from "@/hooks/useAuth"
import { Workout } from "@/types/database"
import { Card } from "@/components/common/Card"
import { Button } from "@/components/common/Button"
import { ThemedText } from "@/components/ThemedText"
import { Loading } from "@/components/common/Loading"

export default function WorkoutListScreen() {
  const { user, loading: loadingAuth } = useAuth()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && user.role === "student") {
      fetchWorkouts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchWorkouts() {
    if (!user) return
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
    if (error) setError(error.message)
    else setWorkouts(data || [])
    setLoading(false)
  }

  if (loadingAuth) return <Loading />

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button
        title="Novo Treino"
        onPress={() => {}}
        style={{ marginBottom: 16 }}
        accessibilityLabel="Criar novo treino"
      />
      {loading && <ThemedText>Carregando...</ThemedText>}
      {error && <ThemedText style={{ color: "red" }}>{error}</ThemedText>}
      {!loading && workouts.length === 0 && (
        <ThemedText>Nenhum treino encontrado.</ThemedText>
      )}
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            accessible
            accessibilityLabel={`Treino ${item.name}`}
          >
            <View style={{ flex: 1 }}>
              <ThemedText type="subtitle">{item.name}</ThemedText>
              <ThemedText>{item.description}</ThemedText>
              <ThemedText>
                Status: <ThemedText type="default">(em breve)</ThemedText>
              </ThemedText>
              <ThemedText>
                Criado em: {new Date(item.created_at).toLocaleDateString()}
              </ThemedText>
            </View>
          </Card>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
})
