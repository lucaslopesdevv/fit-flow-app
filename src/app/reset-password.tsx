import { useState } from "react"
import { useRouter } from "expo-router"
import { SafeAreaView, View, Text, ActivityIndicator } from "react-native"
import { Input } from "@/components/common/Input"
import { Button } from "@/components/common/Button"
import { ThemedText } from "@/components/ThemedText"
import { supabase } from "@/services/supabase/supabase"

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  // O Supabase já processa o access_token da URL automaticamente
  // Só precisa chamar updateUser

  const handleReset = async () => {
    setLoading(true)
    setError("")
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => router.replace("/login"), 2000)
    } catch (e: any) {
      setError(
        e.message ||
          "Token inválido ou expirado. Solicite um novo link de redefinição."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <ThemedText type="title" style={{ marginBottom: 24 }}>
        Definir nova senha
      </ThemedText>
      <Input
        label="Nova senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        required
        style={{ width: 280 }}
      />
      <Button
        title={loading ? "Salvando..." : "Salvar"}
        onPress={handleReset}
        disabled={loading || !password}
        style={{ marginTop: 16, width: 200 }}
      />
      {loading && <ActivityIndicator />}
      {!!error && <Text style={{ color: "red" }}>{error}</Text>}
      {success && (
        <>
          <Text style={{ color: "green" }}>
            Senha redefinida com sucesso! Faça login novamente.
          </Text>
          <Button
            onPress={() => router.replace("/login")}
            title="Ir para login"
          />
        </>
      )}
    </SafeAreaView>
  )
}
