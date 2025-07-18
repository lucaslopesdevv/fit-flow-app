import React, { useEffect, useState, useCallback } from "react"
import { View, FlatList, StyleSheet, Alert } from "react-native"
import { Card } from "@/components/common/Card"
import { Button } from "@/components/common/Button"
import { ThemedText } from "@/components/ThemedText"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/services/supabase/supabase"

interface Student {
  id: string
  full_name: string
  email: string
}

export default function InstructorHomeScreen() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kpis, setKpis] = useState({ students: 0, workouts: 0, executions: 0 })

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Buscar alunos
      const { data: studentsData, error: studentsError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("instructor_id", user?.id)
      if (studentsError) throw studentsError
      setStudents(studentsData || [])
      // Buscar KPIs
      const { count: workoutsCount } = await supabase
        .from("workouts")
        .select("id", { count: "exact", head: true })
        .eq("instructor_id", user?.id)
      const { count: executionsCount } = await supabase
        .from("workout_logs")
        .select("id", { count: "exact", head: true })
        .in(
          "student_id",
          (studentsData || []).map((s: Student) => s.id)
        )
      setKpis({
        students: studentsData?.length || 0,
        workouts: workoutsCount || 0,
        executions: executionsCount || 0,
      })
    } catch (e: any) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  return (
    <View style={styles.container}>
      {error && (
        <Card style={styles.errorCard}>
          <ThemedText style={{ color: "#b91c1c", textAlign: "center" }}>
            {error}
          </ThemedText>
          <Button
            title="Retry"
            onPress={fetchDashboard}
            style={{ marginTop: 8 }}
          />
        </Card>
      )}
      <View style={styles.kpiRow}>
        <Card style={styles.kpiCard}>
          <ThemedText type="subtitle">Students</ThemedText>
          <ThemedText type="title">{kpis.students}</ThemedText>
        </Card>
        <Card style={styles.kpiCard}>
          <ThemedText type="subtitle">Workouts</ThemedText>
          <ThemedText type="title">{kpis.workouts}</ThemedText>
        </Card>
        <Card style={styles.kpiCard}>
          <ThemedText type="subtitle">Executions</ThemedText>
          <ThemedText type="title">{kpis.executions}</ThemedText>
        </Card>
      </View>
      <View style={styles.actionRow}>
        <Button
          title="Add Student"
          onPress={() => Alert.alert("Add Student pressed")}
        />
        <Button
          title="Create Workout"
          onPress={() => Alert.alert("Create Workout pressed")}
        />
      </View>
      <ThemedText type="subtitle" style={{ marginTop: 16, marginBottom: 8 }}>
        Students
      </ThemedText>
      {loading ? (
        <ThemedText>Loading...</ThemedText>
      ) : students.length === 0 ? (
        <ThemedText>No students found.</ThemedText>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.studentCard}>
              <ThemedText>{item.full_name}</ThemedText>
              <ThemedText style={{ fontSize: 12, color: "#666" }}>
                {item.email}
              </ThemedText>
            </Card>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fafafa" },
  errorCard: { marginBottom: 16, backgroundColor: "#fee2e2" },
  kpiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  kpiCard: { flex: 1, alignItems: "center", marginHorizontal: 4, padding: 12 },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  studentCard: { marginBottom: 8, padding: 12 },
})