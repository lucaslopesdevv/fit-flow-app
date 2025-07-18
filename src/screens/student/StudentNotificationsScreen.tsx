import React from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { ThemedText } from "@/components/ThemedText"

export default function StudentNotificationsScreen() {
  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <ThemedText type="title">Notificações</ThemedText>
      <ThemedText style={{ marginTop: 16 }}>
        Aqui você verá suas notificações importantes.
      </ThemedText>
    </SafeAreaView>
  )
}