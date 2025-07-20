# FitFlow - Product Requirements Document

## 📊 Status Atual do Projeto (Janeiro 2025)

### ✅ Funcionalidades Implementadas e Testadas
- **Sistema de Autenticação**: Login, roles, navegação baseada em papéis
- **Gestão de Alunos (Instrutor)**: Convite, listagem, edição, gerenciamento completo
- **Sistema de Exercícios**: Cadastro, listagem, busca, filtros, upload de imagens
- **Navegação Role-Based**: Separação clara entre instrutor e aluno
- **Infraestrutura**: Banco de dados, RLS policies, tipos TypeScript

### ⚠️ Próximas Prioridades
1. **Criação de Treinos**: Modal/tela para instrutores criarem treinos para alunos
2. **Visualização de Treinos**: Tela detalhada para alunos visualizarem treinos
3. **Execução de Treinos**: Player de vídeo, timer, marcação de progresso

### 📋 Pendente (Fases Futuras)
- Painel Web para Administradores (Fase 5)
- Features avançadas: offline, push notifications, analytics

---

## 1. Visão Geral do Projeto

### 1.1 Descrição

FitFlow é um aplicativo de academia que permite a gestão completa de treinos através de uma hierarquia de usuários: Administradores criam instrutores, instrutores cadastram alunos e criam treinos personalizados.

### 1.2 Tecnologias

- **Frontend Mobile**: React Native (Expo)
- **Backend**: Supabase
- **Autenticação**: Supabase Auth
- **Banco de Dados**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage (para vídeos/imagens)
- **Plataformas**: Android e iOS

### 1.3 Arquitetura de Usuários

```
Admin (Web) → Instrutor (Mobile) → Aluno (Mobile)
```

## 2. Funcionalidades Principais

### 2.1 Sistema de Autenticação

- [x] Login único para todos os tipos de usuário
- [x] Diferenciação por roles: `admin`, `instructor`, `student`
- [x] Usuários criados inicialmente como `student`
- [x] Email de verificação obrigatório

### 2.2 Gestão de Usuários

- [ ] **Admin**: Cria e gerencia instrutores via web *(Fase 5 - não implementado)*
- [x] **Instrutor**: Cadastra e gerencia alunos
- [ ] **Aluno**: Visualiza treinos e executa exercícios *(parcialmente implementado)*

### 2.3 Sistema de Treinos

- [ ] Criação de treinos personalizados *(estrutura pronta, falta UI)*
- [x] Exercícios com séries, repetições e tempo de descanso *(estrutura no banco)*
- [x] Vídeos demonstrativos para cada exercício *(upload de imagens implementado)*
- [ ] Histórico de treinos realizados *(estrutura pronta, falta implementação)*

## 3. Estrutura do Banco de Dados

> **Referência detalhada de triggers, functions e policies:** ver [database.md](./database.md)

### 3.1 Tabelas Principais (Status Atual)

#### users (extends auth.users)

- [x] id (uuid, primary key)
- [x] email (text)
- [x] role (enum: 'admin', 'instructor', 'student')
- [x] created_at (timestamp)
- [x] updated_at (timestamp)

#### profiles

- [x] id (uuid, foreign key to users.id)
- [x] full_name (text)
- [x] phone (text)
- [x] avatar_url (text)
- [x] instructor_id (uuid, foreign key to users.id) -- para alunos
- [x] created_at (timestamp)
- [x] updated_at (timestamp)

#### exercises

- [x] id (uuid, primary key)
- [x] name (text)
- [x] description (text)
- [x] muscle_group (text)
- [x] video_url (text)
- [x] thumbnail_url (text)
- [x] created_by (uuid, foreign key to users.id)
- [x] created_at (timestamp)

#### workouts

- [x] id (uuid, primary key)
- [x] student_id (uuid, foreign key to users.id)
- [x] instructor_id (uuid, foreign key to users.id)
- [x] name (text)
- [x] description (text)
- [x] created_at (timestamp)
- [x] updated_at (timestamp)

#### workout_exercises

- [x] id (uuid, primary key)
- [x] workout_id (uuid, foreign key to workouts.id)
- [x] exercise_id (uuid, foreign key to exercises.id)
- [x] sets (integer)
- [x] reps (text)
- [x] rest_seconds (integer)
- [x] order_index (integer)
- [x] notes (text)

#### workout_logs

- [x] id (uuid, primary key)
- [x] workout_id (uuid, foreign key to workouts.id)
- [x] student_id (uuid, foreign key to users.id)
- [x] completed_at (timestamp)
- [x] notes (text)

### 3.2 Integração e Tipos (Status Atual)

- [x] Tipos TypeScript definidos em `src/types/database.ts` para todas as tabelas principais
- [x] Integração Supabase pronta em `src/services/supabase/supabase.ts`
- [x] Policies RLS implementadas conforme PRD (ver seção 4)
- [x] Storage Supabase configurado para vídeos/imagens
- [x] ~~Falta implementar queries e mutations para exercícios no app (listagem, cadastro, upload)~~ **IMPLEMENTADO**

## 4. Policies de Segurança (RLS)

### 4.1 Users & Profiles

```sql
-- Usuários podem ver apenas seu próprio perfil
-- Instrutores podem ver perfis de seus alunos
-- Admins podem ver todos os perfis

-- Apenas admins podem criar instrutores
-- Apenas instrutores podem criar alunos
-- Novos usuários sempre começam como 'student'
```

### 4.2 Workouts & Exercises (Status Atual)

```sql
-- Instrutores podem criar/editar treinos apenas para seus alunos
-- Alunos podem visualizar apenas seus próprios treinos
-- Exercícios podem ser criados por qualquer instrutor
-- Exercícios são visíveis para todos os instrutores
```

### 4.3 Workout Logs

```sql
-- Alunos podem criar logs apenas para seus treinos
-- Instrutores podem visualizar logs de seus alunos
-- Admins podem visualizar todos os logs
```

## 5. Fases do Projeto

### Fase 1: Infraestrutura Base

**Duração**: 2-3 semanas

#### Task 1.1: Configuração Inicial

- [x] Criar projeto Expo
- [x] Configurar Supabase
- [x] Estruturar arquitetura de pastas
- [x] Configurar TypeScript
- [x] Instalar dependências essenciais

#### Task 1.2: Autenticação

- [x] Implementar login screen
  - [x] Criar tela de login com campos de email e senha
  - [x] Adicionar navegação para a tela de login
  - [x] Integrar botão de login com Supabase Auth
  - [x] Exibir feedback de erro/sucesso
- [x] Configurar Supabase Auth
- [x] Criar hook de autenticação
- [x] Implementar navegação baseada em roles
- [x] Configurar email templates

#### Task 1.3: Banco de Dados

- [x] Criar tabelas no Supabase
- [x] Configurar Row Level Security (RLS)
- [x] Criar functions para criação de usuários
- [x] Implementar triggers para profiles
- [x] Criar policies de segurança

### Fase 2: App Mobile - Funcionalidades Core

**Duração**: 3-4 semanas

#### Task 2.1: Interface Base

- [x] Criar sistema de navegação
  - [x] Definir estrutura de rotas e navegação global
  - [x] Implementar navegação de autenticação
    - [x] Garantir redirecionamento automático para login se não autenticado
    - [x] Redirecionar para área correta após login/logout
    - [x] Exibir loading enquanto verifica autenticação
    - [x] Exibir mensagens de erro/sucesso no login/logout
    - [x] Testar proteção de rotas e fluxo completo
  - [x] Implementar navegação baseada em role
  - [x] ~~Refatorar navegação por abas para separar claramente instructor e student~~ **IMPLEMENTADO**
    - [x] ~~Criar pasta `(tabs-student)` com `_layout.tsx` e telas específicas do aluno~~ **IMPLEMENTADO**
    - [x] ~~Criar pasta `(tabs-instructor)` com `_layout.tsx` e telas específicas do instrutor~~ **IMPLEMENTADO**
    - [x] ~~Ajustar roteamento para redirecionar para a tab correta conforme role~~ **IMPLEMENTADO**
    - [x] ~~Migrar telas existentes para as novas pastas conforme o papel~~ **IMPLEMENTADO**
    - [x] ~~Garantir que cada papel só veja as telas relevantes~~ **IMPLEMENTADO**
    - [x] ~~Testar navegação, redirecionamentos e deep linking~~ **IMPLEMENTADO**
    - [x] ~~Atualizar documentação e exemplos de navegação~~ **IMPLEMENTADO**
  - [x] Adicionar placeholders/telas iniciais para cada rota
  - [x] Testar navegação e redirecionamentos
- [x] Implementar theme provider (dark/light mode)
- [x] Criar componentes base (Button, Input, Card, etc.)
- [x] Implementar loading states
- [x] Criar error boundaries

#### Task 2.2: Telas do Instrutor

- [x] Dashboard do instrutor
- [x] Lista de alunos
- [x] Formulário de cadastro de aluno
- [x] Envio de convite por email
- [x] Gestão de alunos (editar/desativar)

#### Task 2.3: Sistema de Exercícios ✅ **CONCLUÍDO**

- [x] Banco de exercícios (**IMPLEMENTADO COMPLETAMENTE**)
  - [x] Criar tela de listagem de exercícios (com nome, grupo muscular, thumbnail)
  - [x] Implementar busca e filtros por nome e grupo muscular
  - [x] Integrar listagem com Supabase (query exercises)
  - [x] Criar tela/modal de cadastro de novo exercício
  - [x] Implementar formulário de cadastro (nome, descrição, grupo muscular, upload de mídia)
  - [x] Integrar cadastro com Supabase (insert exercises)
  - [x] Implementar upload de imagens/vídeos para Supabase Storage
  - [x] Exibir feedback de loading, erro e sucesso
  - [x] Garantir responsividade e UX mobile-first
  - [x] Adicionar testes básicos de integração e usabilidade

#### Notas de implementação (Janeiro 2025):

- ✅ Sistema de exercícios completamente funcional
- ✅ Feedback de loading, erro e sucesso implementados na listagem e cadastro de exercícios
- ✅ Cadastro de novo exercício via modal, com validação de campos obrigatórios e upload de imagem para Supabase Storage
- ✅ Teste básico de integração do formulário de exercício presente
- ✅ Acessibilidade básica garantida em botões e inputs (labels, roles)
- ✅ Filtros por grupo muscular e busca por nome funcionando
- ✅ Interface responsiva e otimizada para mobile

#### Task 2.4: Criação de Treinos ⚠️ **PARCIALMENTE IMPLEMENTADO**

- [x] Criar tela de listagem de treinos do aluno
  - [x] Integrar listagem com Supabase (query workouts)
  - [x] Exibir nome, descrição, status e data de criação
  - [x] Botão para criar novo treino *(placeholder - não funcional)*
- [ ] **PRÓXIMA PRIORIDADE**: Criar tela/modal de cadastro de novo treino
  - [ ] Formulário: nome, descrição, seleção de exercícios
  - [ ] Selecionar múltiplos exercícios do banco (com busca/filtro)
  - [ ] Definir séries, repetições, descanso e ordem para cada exercício
  - [ ] Adicionar/remover exercícios dinamicamente
  - [ ] Integrar cadastro com Supabase (insert workouts e workout_exercises)
  - [ ] Exibir feedback de loading, erro e sucesso
  - [ ] Garantir responsividade e UX mobile-first
  - [ ] Adicionar testes básicos de integração e usabilidade

### Fase 3: App Mobile - Experiência do Aluno

**Duração**: 2-3 semanas

#### Task 3.1: Telas do Aluno ⚠️ **PARCIALMENTE IMPLEMENTADO**

- [x] Dashboard do aluno *(tela básica criada)*
- [x] Lista de treinos *(listagem básica implementada)*
- [ ] **PENDENTE**: Visualização detalhada do treino
- [ ] **PENDENTE**: Player de vídeo para exercícios
- [ ] **PENDENTE**: Timer para descanso

#### Task 3.2: Execução de Treinos

- [ ] Modo de execução passo-a-passo
- [ ] Marcação de séries completadas
- [ ] Cronômetro de descanso
- [ ] Anotações durante treino
- [ ] Finalização de treino

#### Task 3.3: Histórico e Progresso

- [ ] Histórico de treinos realizados
- [ ] Estatísticas básicas
- [ ] Gráficos de progresso
- [ ] Calendário de treinos
- [ ] Notas pessoais

### Fase 4: Features Avançadas

**Duração**: 2-3 semanas

#### Task 4.1: Otimizações

- [ ] Implementar caching offline
- [ ] Otimizar performance
- [ ] Implementar push notifications
- [ ] Sincronização background
- [ ] Testes unitários

#### Task 4.2: Vídeos e Mídia

- [ ] Sistema de upload de vídeos
- [ ] Compressão de vídeos
- [ ] Thumbnails automáticos
- [ ] Integração com YouTube (opcional)
- [ ] Streaming otimizado

#### Task 4.3: UX/UI Refinements

- [ ] Animações e transições
- [ ] Feedback tátil
- [ ] Otimização para diferentes tamanhos
- [ ] Testes de usabilidade
- [ ] Acessibilidade

### Fase 5: Painel Web para Administradores

**Duração**: 2-3 semanas

#### Task 5.1: Setup Web

- [ ] Criar aplicação Next.js
- [ ] Configurar autenticação web
- [ ] Estruturar layout admin
- [ ] Implementar routing
- [ ] Conectar com Supabase

#### Task 5.2: Gestão de Instrutores

- [ ] CRUD de instrutores
- [ ] Convites por email
- [ ] Gestão de permissões
- [ ] Relatórios de atividade
- [ ] Logs de sistema

#### Task 5.3: Analytics e Relatórios

- [ ] Dashboard com métricas
- [ ] Relatórios de uso
- [ ] Estatísticas de treinos
- [ ] Exportação de dados
- [ ] Monitoramento de performance

## 6. Especificações Técnicas

### 6.1 Dependências Principais

```json
{
  "expo": "~50.0.0",
  "@supabase/supabase-js": "^2.38.0",
  "@react-navigation/native": "^6.1.0",
  "react-native-async-storage": "^1.19.0",
  "expo-av": "~13.10.0",
  "expo-image-picker": "~14.7.0",
  "react-native-paper": "^5.11.0",
  "react-hook-form": "^7.47.0",
  "zustand": "^4.4.0"
}
```
