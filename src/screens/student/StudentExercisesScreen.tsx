import React from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { ThemedText } from "@/components/ThemedText"

export default function StudentExercisesScreen() {
  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <ThemedText type="title">Exercícios</ThemedText>
      <ThemedText style={{ marginTop: 16 }}>
        Aqui você pode visualizar os exercícios disponíveis.
      </ThemedText>
    </SafeAreaView>
  )
}