import React, { useState, useEffect, useCallback } from "react"
import { View, FlatList, StyleSheet, RefreshControl, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { ThemedText } from "@/components/ThemedText"
import { Card } from "@/components/common/Card"
import { Button } from "@/components/common/Button"
import { Loading } from "@/components/common/Loading"
import { InviteStudentModal } from "@/components/modals/InviteStudentModal"
import { StudentService } from "@/services/api/StudentService"
import { useAuth } from "@/hooks/useAuth"
import { Profile } from "@/types/database"

// Using Profile directly since it already includes email

export default function InstructorStudentsScreen() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteModalVisible, setInviteModalVisible] = useState(false)

  const fetchStudents = useCallback(async () => {
    if (!user?.id) return

    try {
      setError(null)
      const studentsData = await StudentService.getInstructorStudents(user.id)
      setStudents(studentsData)
    } catch (err: any) {
      console.error('Error fetching students:', err)
      setError(err.message || 'Erro ao carregar alunos')
    }
  }, [user?.id])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchStudents()
    setRefreshing(false)
  }, [fetchStudents])

  const handleInviteSuccess = useCallback(() => {
    fetchStudents()
  }, [fetchStudents])

  const handleStudentPress = useCallback((student: Profile) => {
    Alert.alert(
      student.full_name,
      `Email: ${student.email || 'Não informado'}\nTelefone: ${student.phone || 'Não informado'}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Ver Detalhes',
          onPress: () => {
            // TODO: Navigate to student details screen
            Alert.alert('Em breve', 'Funcionalidade de detalhes do aluno será implementada em breve.')
          }
        }
      ]
    )
  }, [])

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true)
      await fetchStudents()
      setLoading(false)
    }

    loadStudents()
  }, [fetchStudents])

  const renderStudentCard = ({ item }: { item: Profile }) => (
    <Card 
      style={styles.studentCard}
      variant="elevated"
      padding="medium"
    >
      <View style={styles.studentInfo}>
        <View style={styles.studentDetails}>
          <ThemedText style={styles.studentName}>{item.full_name}</ThemedText>
          {item.email && (
            <ThemedText style={styles.studentEmail}>{item.email}</ThemedText>
          )}
          {item.phone && (
            <ThemedText style={styles.studentPhone}>{item.phone}</ThemedText>
          )}
          <ThemedText style={styles.studentDate}>
            Cadastrado em: {new Date(item.created_at).toLocaleDateString('pt-BR')}
          </ThemedText>
        </View>
        <Button
          title="Ver"
          variant="outlined"
          size="small"
          onPress={() => handleStudentPress(item)}
        />
      </View>
    </Card>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <ThemedText style={styles.emptyTitle}>Nenhum aluno encontrado</ThemedText>
      <ThemedText style={styles.emptyDescription}>
        Convide seus primeiros alunos para começar a criar treinos personalizados.
      </ThemedText>
      <Button
        title="Convidar Primeiro Aluno"
        onPress={() => setInviteModalVisible(true)}
        style={styles.emptyButton}
      />
    </View>
  )

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Card style={styles.errorCard} variant="outlined">
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <Button
          title="Tentar Novamente"
          onPress={fetchStudents}
          style={styles.retryButton}
        />
      </Card>
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading message="Carregando alunos..." />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Meus Alunos</ThemedText>
        <Button
          title="Convidar"
          onPress={() => setInviteModalVisible(true)}
          size="small"
        />
      </View>

      {error ? (
        renderError()
      ) : students.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <View style={styles.statsContainer}>
            <Card style={styles.statsCard} variant="contained">
              <ThemedText style={styles.statsNumber}>{students.length}</ThemedText>
              <ThemedText style={styles.statsLabel}>
                {students.length === 1 ? 'Aluno' : 'Alunos'}
              </ThemedText>
            </Card>
          </View>

          <FlatList
            data={students}
            keyExtractor={(item) => item.id}
            renderItem={renderStudentCard}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#2563eb']}
                tintColor="#2563eb"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      <InviteStudentModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        onSuccess={handleInviteSuccess}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsCard: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#2563eb',
  },
  statsNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsLabel: {
    fontSize: 14,
    color: '#e2e8f0',
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  studentCard: {
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentDetails: {
    flex: 1,
    marginRight: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  studentPhone: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  studentDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  errorCard: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  retryButton: {
    minWidth: 150,
  },
})