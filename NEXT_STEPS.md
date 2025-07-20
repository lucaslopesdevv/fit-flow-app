# FitFlow - Próximos Passos de Implementação

## 🎯 Prioridade Imediata: Sistema de Criação de Treinos

### Status Atual
- ✅ **Exercícios**: Sistema completo (cadastro, listagem, busca, upload)
- ✅ **Gestão de Alunos**: Sistema completo (convite, listagem, edição)
- ✅ **Listagem de Treinos**: Tela básica implementada (só mostra treinos existentes)
- ❌ **Criação de Treinos**: Não implementado (botão placeholder)

### O que precisa ser implementado:

#### 1. Modal/Tela de Criação de Treino (Instrutor)
**Localização**: `src/components/modals/CreateWorkoutModal.tsx`

**Funcionalidades necessárias**:
- Formulário com nome e descrição do treino
- Seleção do aluno (dropdown com alunos do instrutor)
- Seleção de exercícios do banco (com busca/filtro)
- Para cada exercício selecionado:
  - Definir número de séries
  - Definir repetições (texto livre: "10-12", "até a falha", etc.)
  - Definir tempo de descanso (segundos)
  - Definir ordem no treino
  - Campo opcional para notas
- Botões para adicionar/remover exercícios
- Preview do treino antes de salvar
- Integração com Supabase (insert em `workouts` e `workout_exercises`)

#### 2. Integração na Tela do Instrutor
**Localização**: `src/screens/instructor/InstructorHomeScreen.tsx` ou nova tela

**Modificações necessárias**:
- Adicionar botão "Criar Treino" funcional
- Listar treinos criados pelo instrutor
- Permitir edição/exclusão de treinos

#### 3. Visualização Detalhada de Treino (Aluno)
**Localização**: `src/components/modals/WorkoutDetailsModal.tsx`

**Funcionalidades necessárias**:
- Mostrar informações do treino (nome, descrição, instrutor)
- Listar exercícios com detalhes (séries, reps, descanso, notas)
- Mostrar thumbnail/vídeo dos exercícios
- Botão "Iniciar Treino" (para futura implementação)
- Histórico de execuções anteriores

#### 4. Serviços e Queries
**Localização**: `src/services/api/WorkoutService.ts`

**Métodos necessários**:
```typescript
- createWorkout(workoutData, exercises)
- getInstructorWorkouts(instructorId)
- getStudentWorkouts(studentId)
- getWorkoutDetails(workoutId)
- updateWorkout(workoutId, data)
- deleteWorkout(workoutId)
```

## 🔄 Fluxo de Implementação Sugerido

### Passo 1: Criar WorkoutService
- Implementar queries básicas para workouts
- Testar CRUD operations no banco

### Passo 2: Modal de Criação de Treino
- Criar componente com formulário básico
- Implementar seleção de aluno
- Adicionar seleção de exercícios

### Passo 3: Integração com Exercícios
- Permitir busca e seleção de exercícios
- Configurar séries, reps, descanso para cada exercício
- Implementar reordenação de exercícios

### Passo 4: Visualização para Alunos
- Modal/tela de detalhes do treino
- Integração com thumbnails/vídeos dos exercícios
- Layout responsivo e user-friendly

### Passo 5: Testes e Refinamentos
- Testar fluxo completo instrutor → aluno
- Validações de formulário
- Estados de loading e erro
- Acessibilidade

## 📋 Estrutura de Dados Já Pronta

O banco de dados já está configurado com as tabelas necessárias:

```sql
-- workouts: treino principal
-- workout_exercises: exercícios do treino com configurações
-- exercises: banco de exercícios (já implementado)
-- profiles: relação instrutor-aluno (já implementado)
```

## 🎨 Considerações de UX/UI

### Para Instrutores:
- Interface intuitiva para montar treinos
- Drag & drop para reordenar exercícios (opcional)
- Preview antes de salvar
- Templates de treino (futuro)

### Para Alunos:
- Visualização clara dos exercícios
- Fácil acesso aos vídeos demonstrativos
- Progresso visual do treino
- Histórico de execuções

## ⏱️ Estimativa de Tempo

- **WorkoutService**: 1-2 dias
- **Modal de Criação**: 3-4 dias
- **Visualização para Alunos**: 2-3 dias
- **Testes e Refinamentos**: 1-2 dias

**Total estimado**: 1-2 semanas

## 🚀 Após Implementação

Com o sistema de criação de treinos implementado, o app terá as funcionalidades core completas:
- Instrutores podem gerenciar alunos ✅
- Instrutores podem criar exercícios ✅
- Instrutores podem criar treinos ⏳
- Alunos podem visualizar seus treinos ⏳

Próximas fases seriam:
- Execução de treinos (timer, progresso)
- Histórico e estatísticas
- Features avançadas (offline, notifications)