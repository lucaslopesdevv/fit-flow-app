import React from "react"
import { View, Text, StyleSheet, ActivityIndicator } from "react-native"
import { useAuth } from "@/hooks/useAuth"
import { Redirect } from "expo-router"
import { Button } from "react-native-paper"

export default function AdminDashboard() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    )
  }

  // Only allow access if user is admin
  if (!user || user.role !== "admin") {
    return <Redirect href="/login" />
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>Área exclusiva para administradores</Text>
      <Text style={styles.userInfo}>Usuário: {user.email}</Text>
      
      <Button 
        mode="outlined" 
        onPress={signOut}
        style={styles.logoutButton}
      >
        Fazer Logout
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#6200ee",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  userInfo: {
    fontSize: 14,
    color: "#333",
    marginBottom: 32,
    textAlign: "center",
  },
  logoutButton: {
    marginTop: 16,
  },
})
