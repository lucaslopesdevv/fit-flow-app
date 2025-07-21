import React, { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { ThemedText } from '../ThemedText'
import { Button, Input, Card, Loading, Avatar, Chip, Divider } from './index'

/**
 * Componente de demonstração dos componentes base
 * Este arquivo pode ser removido após a implementação estar completa
 */
export function ComponentsDemo() {
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLoadingTest = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedText style={styles.title}>Componentes Base - Demo</ThemedText>

      <Divider label="Botões" />
      <View style={styles.section}>
        <Button title="Botão Padrão" onPress={() => console.log('Botão padrão pressionado')} />
        <Button
          title="Outlined"
          variant="outlined"
          onPress={() => console.log('Botão outlined pressionado')}
        />
        <Button title="Text" variant="text" onPress={() => console.log('Botão text pressionado')} />
        <Button
          title="Pequeno"
          size="small"
          onPress={() => console.log('Botão pequeno pressionado')}
        />
        <Button
          title="Grande"
          size="large"
          onPress={() => console.log('Botão grande pressionado')}
        />
        <Button
          title="Full Width"
          fullWidth
          onPress={() => console.log('Botão full width pressionado')}
        />
      </View>

      <Divider label="Inputs" />
      <View style={styles.section}>
        <Input
          label="Nome"
          value={inputValue}
          onChangeText={setInputValue}
          helperText="Digite seu nome completo"
        />
        <Input label="Email" required placeholder="exemplo@email.com" />
        <Input label="Senha" secureTextEntry errorMessage="Senha muito fraca" />
      </View>

      <Divider label="Cards" />
      <View style={styles.section}>
        <Card>
          <ThemedText>Card padrão com conteúdo</ThemedText>
        </Card>

        <Card variant="outlined">
          <Card.Title title="Card com Título" subtitle="Subtítulo" />
          <Card.Content>
            <ThemedText>Conteúdo do card outlined</ThemedText>
          </Card.Content>
          <Card.Actions>
            <Button
              title="Ação"
              variant="text"
              onPress={() => console.log('Ação do card pressionada')}
            />
          </Card.Actions>
        </Card>
      </View>

      <Divider label="Avatars" />
      <View style={styles.avatarSection}>
        <Avatar.Text label="JD" size="small" />
        <Avatar.Text label="AB" size="medium" />
        <Avatar.Text label="CD" size="large" />
        <Avatar.Icon icon="account" size="xlarge" />
      </View>

      <Divider label="Chips" />
      <View style={styles.chipSection}>
        <Chip label="Tag 1" />
        <Chip label="Tag 2" variant="outlined" />
        <Chip label="Pequeno" size="small" />
        <Chip label="Removível" onClose={() => console.log('Chip removido')} />
      </View>

      <Divider label="Loading" />
      <View style={styles.section}>
        <Button title="Testar Loading" onPress={handleLoadingTest} disabled={loading} />
        {loading && <Loading message="Carregando..." containerStyle={styles.loadingContainer} />}
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    gap: 12,
  },
  avatarSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  chipSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  loadingContainer: {
    marginTop: 20,
  },
  bottomSpace: {
    height: 50,
  },
})
