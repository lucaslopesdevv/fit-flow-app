import React, { useState } from "react"
import {
  View,
  Image,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native"
import { Input } from "@/components/common/Input"
import { Button } from "@/components/common/Button"
import { supabase } from "@/services/supabase/supabase"
import * as ImagePicker from "expo-image-picker"
import { ThemedText } from "@/components/ThemedText"
import { ActivityIndicator } from "react-native"
import { useAuth } from "@/hooks/useAuth"

const MUSCLE_GROUPS = [
  "Peito",
  "Costas",
  "Pernas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Abdômen",
  "Glúteos",
]

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri)
  return await response.blob()
}

export default function ExerciseForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth()
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [group, setGroup] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    })
    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri)
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    setSuccess(false)
    let thumbnail_url = null
    try {
      if (image) {
        const fileExt = image.split(".").pop()
        const fileName = `exercise_${Date.now()}.${fileExt}`
        const filePath = `exercises/${fileName}`
        const blob = await uriToBlob(image)
        const { error: uploadError } = await supabase.storage
          .from("exercises")
          .upload(filePath, blob, { contentType: "image/jpeg" })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage
          .from("exercises")
          .getPublicUrl(filePath)
        thumbnail_url = urlData.publicUrl
      }
      const { error: insertError } = await supabase.from("exercises").insert({
        name,
        description: desc,
        muscle_group: group,
        thumbnail_url,
        created_by: user?.id,
      })
      if (insertError) throw insertError
      setLoading(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
      setName("")
      setDesc("")
      setGroup("")
      setImage(null)
      onSuccess()
    } catch (e: any) {
      setError(e.message || "Erro ao cadastrar exercício")
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, flexGrow: 1, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Nome"
          value={name}
          onChangeText={setName}
          style={{ marginBottom: 12 }}
        />
        <Input
          label="Descrição"
          value={desc}
          onChangeText={setDesc}
          style={{ marginBottom: 12 }}
          multiline
        />
        <ThemedText style={{ marginBottom: 8 }}>Grupo Muscular</ThemedText>
        <View
          style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}
        >
          {MUSCLE_GROUPS.map((g) => (
            <Button
              key={g}
              title={g}
              variant={group === g ? "contained" : "outlined"}
              onPress={() => setGroup(g)}
              style={{ marginRight: 8, marginBottom: 8, minWidth: 90 }}
            />
          ))}
        </View>
        <Button
          title={image ? "Trocar Imagem" : "Selecionar Imagem"}
          onPress={pickImage}
          style={{ marginBottom: 12 }}
        />
        {image && (
          <Image
            source={{ uri: image }}
            style={{
              width: 140,
              height: 140,
              borderRadius: 12,
              marginBottom: 12,
              alignSelf: "center",
            }}
          />
        )}
        {error && (
          <ThemedText style={{ color: "red", marginBottom: 12 }}>
            {error}
          </ThemedText>
        )}
        {success && (
          <ThemedText style={{ color: "green", marginBottom: 12 }}>
            Exercício cadastrado com sucesso!
          </ThemedText>
        )}
        {loading && (
          <ActivityIndicator color="#2563eb" style={{ marginBottom: 12 }} />
        )}
        <Button
          title={loading ? "Salvando..." : "Cadastrar Exercício"}
          onPress={handleSubmit}
          disabled={loading || !name || !group}
          style={{ minHeight: 48, borderRadius: 8, marginBottom: 32 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
