import React, { useEffect, useState, useCallback } from 'react'
import { View, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { ThemedText } from '@/components/ThemedText'
import { Loading } from '@/components/common/Loading'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/services/supabase/supabase'
import CreateWorkoutModal from '@/components/modals/CreateWorkoutModal'
import WorkoutManagementModal from '@/components/modals/WorkoutManagementModal'
import { WorkoutService } from '@/services/api/WorkoutService'
import { Profile, WorkoutWithExercises } from '@/types/database'

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
  const [refreshing, setRefreshing] = useState(false)
  const [kpis, setKpis] = useState({ students: 0, workouts: 0, executions: 0 })

  // Workout modal states
  const [showCreateWorkoutModal, setShowCreateWorkoutModal] = useState(false)
  const [showWorkoutManagement, setShowWorkoutManagement] = useState(false)
  const [instructorStudents, setInstructorStudents] = useState<Profile[]>([])
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutWithExercises[]>([])
  const [workoutsLoading, setWorkoutsLoading] = useState(false)

  const fetchDashboard = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)
    try {
      // Buscar alunos
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select(
          'id, full_name, email, phone, avatar_url, instructor_id, role, created_at, updated_at, is_active'
        )
        .eq('instructor_id', user.id)
      if (studentsError) throw studentsError

      const students = studentsData || []
      setStudents(students)
      setInstructorStudents(students)

      // Buscar KPIs
      const { count: workoutsCount } = await supabase
        .from('workouts')
        .select('id', { count: 'exact', head: true })
        .eq('instructor_id', user.id)
      const { count: executionsCount } = await supabase
        .from('workout_logs')
        .select('id', { count: 'exact', head: true })
        .in(
          'student_id',
          students.map((s: Student) => s.id)
        )
      setKpis({
        students: students.length,
        workouts: workoutsCount || 0,
        executions: executionsCount || 0,
      })
    } catch (e: any) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const fetchRecentWorkouts = useCallback(async () => {
    if (!user?.id) return

    setWorkoutsLoading(true)
    try {
      const workouts = await WorkoutService.getInstructorWorkouts(user.id)
      // Get only the 5 most recent workouts
      setRecentWorkouts(workouts.slice(0, 5))
    } catch (error) {
      console.error('Error fetching recent workouts:', error)
    } finally {
      setWorkoutsLoading(false)
    }
  }, [user?.id])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([fetchDashboard(), fetchRecentWorkouts()])
    setRefreshing(false)
  }, [fetchDashboard, fetchRecentWorkouts])

  useEffect(() => {
    fetchDashboard()
    fetchRecentWorkouts()
  }, [fetchDashboard, fetchRecentWorkouts])

  const handleCreateWorkout = () => {
    if (instructorStudents.length === 0) {
      Alert.alert(
        'Nenhum aluno encontrado',
        'Você precisa ter alunos cadastrados para criar treinos. Cadastre alunos primeiro.',
        [{ text: 'OK' }]
      )
      return
    }
    setShowCreateWorkoutModal(true)
  }

  const handleWorkoutCreated = (workout: WorkoutWithExercises) => {
    // Refresh the dashboard data
    fetchDashboard()
    fetchRecentWorkouts()

    Alert.alert(
      'Treino criado com sucesso!',
      `O treino "${workout.name}" foi criado para ${workout.student?.full_name}.`,
      [{ text: 'OK' }]
    )
  }

  const handleWorkoutPress = (workout: WorkoutWithExercises) => {
    Alert.alert(
      workout.name,
      `Aluno: ${workout.student?.full_name}\nExercícios: ${
        workout.exercises.length
      }\nCriado em: ${new Date(workout.created_at).toLocaleDateString('pt-BR')}`,
      [{ text: 'OK' }]
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[]} // Using FlatList for pull-to-refresh functionality
        renderItem={() => null}
        ListHeaderComponent={
          <>
            {error && (
              <Card style={styles.errorCard}>
                <ThemedText style={{ color: '#b91c1c', textAlign: 'center' }}>{error}</ThemedText>
                <Button
                  title="Tentar Novamente"
                  onPress={fetchDashboard}
                  style={{ marginTop: 8 }}
                />
              </Card>
            )}

            {/* KPI Cards */}
            <View style={styles.kpiRow}>
              <Card style={styles.kpiCard} padding="none">
                <ThemedText style={styles.kpiLabel} numberOfLines={1}>
                  Alunos
                </ThemedText>
                <ThemedText style={styles.kpiValue}>{kpis.students}</ThemedText>
              </Card>
              <Card style={styles.kpiCard} padding="none">
                <ThemedText style={styles.kpiLabel} numberOfLines={1}>
                  Treinos
                </ThemedText>
                <ThemedText style={styles.kpiValue}>{kpis.workouts}</ThemedText>
              </Card>
              <Card style={styles.kpiCard} padding="none">
                <ThemedText style={styles.kpiLabel} numberOfLines={1}>
                  Exec.
                </ThemedText>
                <ThemedText style={styles.kpiValue}>{kpis.executions}</ThemedText>
              </Card>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <Button
                title="Adicionar Aluno"
                onPress={() => Alert.alert('Adicionar Aluno', 'Funcionalidade em desenvolvimento')}
                style={styles.actionButton}
                variant="outlined"
              />
              <Button
                title="Criar Treino"
                onPress={handleCreateWorkout}
                style={styles.actionButton}
                variant="contained"
                disabled={loading}
              />
            </View>

            {/* Workout Management Button */}
            <View style={styles.managementRow}>
              <Button
                title="Gerenciar Treinos"
                onPress={() => setShowWorkoutManagement(true)}
                style={styles.managementButton}
                variant="outlined"
                disabled={loading}
              />
            </View>

            {/* Recent Workouts Section */}
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Treinos Recentes</ThemedText>
              <View style={styles.sectionActions}>
                {workoutsLoading && <Loading size="small" />}
                <Button
                  title="Ver Todos"
                  variant="text"
                  onPress={() => setShowWorkoutManagement(true)}
                  style={styles.seeAllButton}
                />
              </View>
            </View>

            {workoutsLoading ? (
              <Card style={styles.loadingCard}>
                <Loading />
                <ThemedText style={styles.loadingText}>Carregando treinos...</ThemedText>
              </Card>
            ) : recentWorkouts.length === 0 ? (
              <Card style={styles.emptyCard}>
                <ThemedText style={styles.emptyText}>Nenhum treino criado ainda.</ThemedText>
                <ThemedText style={styles.emptySubtext}>
                  Crie seu primeiro treino para começar!
                </ThemedText>
              </Card>
            ) : (
              <View style={styles.workoutsList}>
                {recentWorkouts.map(workout => (
                  <Card
                    key={workout.id}
                    style={styles.workoutCard}
                    onPress={() => handleWorkoutPress(workout)}
                  >
                    <View style={styles.workoutHeader}>
                      <ThemedText type="subtitle" numberOfLines={1}>
                        {workout.name}
                      </ThemedText>
                      <ThemedText style={styles.workoutDate}>
                        {new Date(workout.created_at).toLocaleDateString('pt-BR')}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.workoutStudent}>
                      Aluno: {workout.student?.full_name}
                    </ThemedText>
                    <ThemedText style={styles.workoutExercises}>
                      {workout.exercises.length} exercício
                      {workout.exercises.length !== 1 ? 's' : ''}
                    </ThemedText>
                  </Card>
                ))}
              </View>
            )}

            {/* Students Section */}
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Alunos</ThemedText>
            </View>

            {loading ? (
              <Card style={styles.loadingCard}>
                <Loading />
                <ThemedText style={styles.loadingText}>Carregando alunos...</ThemedText>
              </Card>
            ) : students.length === 0 ? (
              <Card style={styles.emptyCard}>
                <ThemedText style={styles.emptyText}>Nenhum aluno encontrado.</ThemedText>
                <ThemedText style={styles.emptySubtext}>
                  Cadastre alunos para começar a criar treinos.
                </ThemedText>
              </Card>
            ) : (
              <View style={styles.studentsList}>
                {students.map(student => (
                  <Card key={student.id} style={styles.studentCard}>
                    <ThemedText type="subtitle">{student.full_name}</ThemedText>
                    <ThemedText style={styles.studentEmail}>{student.email}</ThemedText>
                  </Card>
                ))}
              </View>
            )}
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      />

      {/* Create Workout Modal */}
      <CreateWorkoutModal
        visible={showCreateWorkoutModal}
        onClose={() => setShowCreateWorkoutModal(false)}
        onSuccess={handleWorkoutCreated}
        instructorStudents={instructorStudents}
      />

      {/* Workout Management Modal */}
      <WorkoutManagementModal
        visible={showWorkoutManagement}
        onClose={() => setShowWorkoutManagement(false)}
        instructorStudents={instructorStudents}
        onWorkoutChange={() => {
          fetchDashboard()
          fetchRecentWorkouts()
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  errorCard: {
    marginBottom: 16,
    backgroundColor: '#fee2e2',
    padding: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    minHeight: 75,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginVertical: 0,
    margin: 0,
  },
  kpiLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6c757d',
    marginBottom: 4,
    textAlign: 'center',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  managementRow: {
    marginBottom: 24,
  },
  managementButton: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seeAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  loadingCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    color: '#6c757d',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 24,
  },
  workoutCard: {
    padding: 16,
    marginBottom: 8,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  workoutDate: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 8,
  },
  workoutStudent: {
    color: '#2563eb',
    fontWeight: '600',
    marginBottom: 4,
  },
  workoutExercises: {
    fontSize: 12,
    color: '#6c757d',
  },
  studentsList: {
    marginBottom: 16,
  },
  studentCard: {
    marginBottom: 8,
    padding: 16,
  },
  studentEmail: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
})
