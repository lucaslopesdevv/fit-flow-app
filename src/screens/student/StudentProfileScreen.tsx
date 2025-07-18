import React from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { ThemedText } from "@/components/ThemedText"

export default function StudentProfileScreen() {
  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <ThemedText type="title">Perfil do Aluno</ThemedText>
      <ThemedText style={{ marginTop: 16 }}>
        Aqui você pode editar seus dados pessoais.
      </ThemedText>
    </SafeAreaView>
  )
}