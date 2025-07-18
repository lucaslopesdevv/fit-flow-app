# FitFlow - Database (Estado Real via MCP)

## Extensões instaladas relevantes

- uuid-ossp (para UUID)

## Tabelas ativas

### auth.users

- instance_id: uuid
- id: uuid (PK)
- aud: varchar
- role: varchar
- email: varchar
- encrypted_password: varchar
- email_confirmed_at: timestamptz
- invited_at: timestamptz
- confirmation_token: varchar
- confirmation_sent_at: timestamptz
- recovery_token: varchar
- recovery_sent_at: timestamptz
- email_change_token_new: varchar
- email_change: varchar
- email_change_sent_at: timestamptz
- last_sign_in_at: timestamptz
- raw_app_meta_data: jsonb
- raw_user_meta_data: jsonb
- is_super_admin: boolean
- created_at: timestamptz
- updated_at: timestamptz
- phone: text (unique)
- phone_confirmed_at: timestamptz
- phone_change: text
- phone_change_token: varchar
- phone_change_sent_at: timestamptz
- confirmed_at: timestamptz (generated)
- email_change_token_current: varchar
- email_change_confirm_status: smallint
- banned_until: timestamptz
- reauthentication_token: varchar
- reauthentication_sent_at: timestamptz
- is_sso_user: boolean
- deleted_at: timestamptz
- is_anonymous: boolean

### public.profiles

- id: uuid (PK, FK auth.users)
- full_name: text
- phone: text
- avatar_url: text
- instructor_id: uuid (FK auth.users)
- created_at: timestamptz (default timezone('utc', now()))
- updated_at: timestamptz (default timezone('utc', now()))
- role: text (check: admin/instructor/student)
- email: text (unique, not null)

### public.exercises

- id: uuid (PK, default uuid_generate_v4())
- name: text (not null)
- description: text
- muscle_group: text (not null)
- video_url: text
- thumbnail_url: text
- created_by: uuid (FK auth.users, not null)
- created_at: timestamptz (default timezone('utc', now()))

### public.workouts

- id: uuid (PK, default uuid_generate_v4())
- student_id: uuid (FK auth.users, not null)
- instructor_id: uuid (FK auth.users, not null)
- name: text (not null)
- description: text
- created_at: timestamptz (default timezone('utc', now()))
- updated_at: timestamptz (default timezone('utc', now()))

### public.workout_exercises

- id: uuid (PK, default uuid_generate_v4())
- workout_id: uuid (FK public.workouts, not null)
- exercise_id: uuid (FK public.exercises, not null)
- sets: integer (not null)
- reps: text (not null)
- rest_seconds: integer (not null)
- order_index: integer (not null)
- notes: text

### public.workout_logs

- id: uuid (PK, default uuid_generate_v4())
- workout_id: uuid (FK public.workouts, not null)
- student_id: uuid (FK auth.users, not null)
- completed_at: timestamptz (default timezone('utc', now()))
- notes: text

## Functions ativas (via MCP)

| Schema | Nome                               | Tipo     | Retorno |
| ------ | ---------------------------------- | -------- | ------- | -------- |
| auth   | email                              | FUNCTION | text    |
| auth   | jwt                                | FUNCTION | jsonb   |
| auth   | role                               | FUNCTION | text    |
| auth   | uid                                | FUNCTION | uuid    |
| public | create_instructor                  | FUNCTION | uuid    |
| public | create_student                     | FUNCTION | uuid    |
| public | handle_new_profile_with_instructor | FUNCTION | trigger |
| public | update_updated_at_column           | FUNCTION | trigger |
| public | role                               | FUNCTION | text    | <-- NOVA |

### Função public.role()

```sql
CREATE OR REPLACE FUNCTION public.role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;
```

## Policies RLS relevantes

### INSERT em exercises (apenas instrutores)

```sql
CREATE POLICY "Only instructors can insert exercises (public.role)"
ON public.exercises
FOR INSERT
TO authenticated
WITH CHECK (public.role() = 'instructor');
```

## Triggers ativas (estado real)

| Schema   | Nome                       | Tabela       |
| -------- | -------------------------- | ------------ |
| auth     | on_auth_user_created       | users        |
| public   | update_profiles_updated_at | profiles     |
| public   | update_workouts_updated_at | workouts     |
| realtime | tr_check_filters           | subscription |
| storage  | update_objects_updated_at  | objects      |
