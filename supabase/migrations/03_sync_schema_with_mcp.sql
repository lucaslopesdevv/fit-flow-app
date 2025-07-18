-- Migration: Sincronizar schema com estado real detectado via MCP
-- Garante existência de extensões, tabelas e colunas principais

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela auth.users (já gerenciada pelo Supabase Auth, não criar manualmente)
-- Tabela public.profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  phone text,
  avatar_url text,
  instructor_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  role text CHECK (role IN ('admin','instructor','student')),
  email text UNIQUE NOT NULL
);

-- Tabela public.exercises
CREATE TABLE IF NOT EXISTS public.exercises (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  muscle_group text NOT NULL,
  video_url text,
  thumbnail_url text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

-- Tabela public.workouts
CREATE TABLE IF NOT EXISTS public.workouts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES auth.users(id),
  instructor_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

-- Tabela public.workout_exercises
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id uuid NOT NULL REFERENCES public.workouts(id),
  exercise_id uuid NOT NULL REFERENCES public.exercises(id),
  sets integer NOT NULL,
  reps text NOT NULL,
  rest_seconds integer NOT NULL,
  order_index integer NOT NULL,
  notes text
);

-- Tabela public.workout_logs
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id uuid NOT NULL REFERENCES public.workouts(id),
  student_id uuid NOT NULL REFERENCES auth.users(id),
  completed_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  notes text
); 