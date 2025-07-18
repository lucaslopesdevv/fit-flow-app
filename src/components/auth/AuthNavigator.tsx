import { useAuth } from "../../hooks/useAuth"
import { Redirect } from "expo-router"
import { View, ActivityIndicator } from "react-native"

export function AuthNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (!user) {
    // Unauthenticated user: redirect to login
    return <Redirect href="./login" />
  }

  // Authenticated user: redirect to route according to role
  if (user.role === "admin") {
    return <Redirect href="./admin" />
  }
  // Instructor or student: tabs
  if (user.role === "instructor" || user.role === "student") {
    return <Redirect href="./(tabs)" />
  }

  // Fallback (should not happen)
  return <Redirect href="./login" />
}
