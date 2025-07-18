-- Criar enum para roles de usuário
CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'student');

-- Extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função e trigger para criar usuário automaticamente
CREATE OR REPLACE FUNCTION create_user_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, role)
  VALUES (NEW.id, NEW.email, 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_after_auth_creation
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_from_auth();

-- Tabela de usuários (extends auth.users)
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de perfis
CREATE TABLE profiles (
  id UUID REFERENCES users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  instructor_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trigger para validar que instructor_id é um instrutor
CREATE OR REPLACE FUNCTION check_instructor_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.instructor_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.instructor_id AND role = 'instructor') THEN
      RAISE EXCEPTION 'instructor_id must reference a user with instructor role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_instructor_role
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_instructor_role();

-- Tabela de exercícios
CREATE TABLE exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  muscle_group TEXT NOT NULL,
  video_url TEXT,
  thumbnail_url TEXT,
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de treinos
CREATE TABLE workouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES users(id) NOT NULL,
  instructor_id UUID REFERENCES users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trigger para validar roles de instrutor e aluno
CREATE OR REPLACE FUNCTION check_workout_roles()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.instructor_id AND role = 'instructor') THEN
    RAISE EXCEPTION 'instructor_id must reference a user with instructor role';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.student_id AND role = 'student') THEN
    RAISE EXCEPTION 'student_id must reference a user with student role';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_workout_roles
  BEFORE INSERT OR UPDATE ON workouts
  FOR EACH ROW
  EXECUTE FUNCTION check_workout_roles();

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabela de exercícios do treino
CREATE TABLE workout_exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) NOT NULL,
  sets INTEGER NOT NULL,
  reps TEXT NOT NULL,
  rest_seconds INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  notes TEXT,
  UNIQUE(workout_id, order_index)
);

-- Tabela de logs de treino
CREATE TABLE workout_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) NOT NULL,
  student_id UUID REFERENCES users(id) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  notes TEXT
);

-- Policies de segurança (RLS)

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

-- Função e trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, SPLIT_PART(NEW.email, '@', 1));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_profile_after_user_creation
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();

-- Policies para users
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Instructors can view their students" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.instructor_id = auth.uid()
      AND profiles.id = users.id
    )
  );

CREATE POLICY "Admins can view all users" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Policies para profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Instructors can view their students profiles" ON profiles
  FOR SELECT USING (instructor_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Policies para exercises
CREATE POLICY "Exercises are viewable by all authenticated users" ON exercises
  FOR SELECT USING (auth.role() IS NOT NULL);

CREATE POLICY "Instructors can create exercises" ON exercises
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'instructor')
  );

CREATE POLICY "Users can only update their own exercises" ON exercises
  FOR UPDATE USING (created_by = auth.uid());

-- Policies para workouts
CREATE POLICY "Students can view their own workouts" ON workouts
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Instructors can view workouts they created" ON workouts
  FOR SELECT USING (instructor_id = auth.uid());

CREATE POLICY "Instructors can create workouts for their students" ON workouts
  FOR INSERT WITH CHECK (
    instructor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = student_id
      AND profiles.instructor_id = auth.uid()
    )
  );

-- Policies para workout_exercises
CREATE POLICY "Users can view exercises from their workouts" ON workout_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_id
      AND (workouts.student_id = auth.uid() OR workouts.instructor_id = auth.uid())
    )
  );

-- Policies para workout_logs
CREATE POLICY "Students can view their own logs" ON workout_logs
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Instructors can view their students logs" ON workout_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_id
      AND workouts.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Students can create their own logs" ON workout_logs
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Função para admin criar instrutor
CREATE OR REPLACE FUNCTION public.create_instructor(
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Verifica se quem chama é admin
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Apenas admin pode criar instrutor';
  END IF;

  -- Cria usuário no auth (Supabase Auth)
  INSERT INTO auth.users (email) VALUES (p_email) RETURNING id INTO new_user_id;

  -- Atualiza role para 'instructor' na tabela users
  UPDATE users SET role = 'instructor' WHERE id = new_user_id;

  -- Atualiza perfil
  UPDATE profiles SET full_name = p_full_name, phone = p_phone, avatar_url = p_avatar_url WHERE id = new_user_id;

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para instrutor criar aluno
CREATE OR REPLACE FUNCTION public.create_student(
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Verifica se quem chama é instrutor
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'instructor') THEN
    RAISE EXCEPTION 'Apenas instrutor pode criar aluno';
  END IF;

  -- Cria usuário no auth (Supabase Auth)
  INSERT INTO auth.users (email) VALUES (p_email) RETURNING id INTO new_user_id;

  -- O trigger já cria o usuário como 'student' na tabela users
  -- Atualiza perfil com dados e vincula ao instrutor
  UPDATE profiles SET full_name = p_full_name, phone = p_phone, avatar_url = p_avatar_url, instructor_id = auth.uid() WHERE id = new_user_id;

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;