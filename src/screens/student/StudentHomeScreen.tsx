import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/ThemedText'

export default function StudentHomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText type="title">Bem-vindo ao FitFlow!</ThemedText>
      <ThemedText style={{ marginTop: 16 }}>
        Aqui você verá seus treinos, progresso e notificações.
      </ThemedText>
    </SafeAreaView>
  )
}
