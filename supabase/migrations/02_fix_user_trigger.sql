-- Migration: Fix user creation trigger to avoid duplicate key error

-- Drop the old trigger function if it exists
DROP FUNCTION IF EXISTS create_user_from_auth() CASCADE;

-- Recreate the trigger function with existence check
CREATE OR REPLACE FUNCTION create_user_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.id) THEN
    INSERT INTO users (id, email, role)
    VALUES (NEW.id, NEW.email, 'student');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger to ensure it's using the new function
DROP TRIGGER IF EXISTS create_user_after_auth_creation ON auth.users;
CREATE TRIGGER create_user_after_auth_creation
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_from_auth();

-- (Re)create function for admin to create instructor
CREATE OR REPLACE FUNCTION public.create_instructor(
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Only admin can create instructor
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admin can create instructor';
  END IF;

  INSERT INTO auth.users (email) VALUES (p_email) RETURNING id INTO new_user_id;
  UPDATE users SET role = 'instructor' WHERE id = new_user_id;
  UPDATE profiles SET full_name = p_full_name, phone = p_phone, avatar_url = p_avatar_url WHERE id = new_user_id;
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- (Re)create function for instructor to create student
CREATE OR REPLACE FUNCTION public.create_student(
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Only instructor can create student
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'instructor') THEN
    RAISE EXCEPTION 'Only instructor can create student';
  END IF;

  INSERT INTO auth.users (email) VALUES (p_email) RETURNING id INTO new_user_id;
  -- The trigger already creates the user as 'student' in users
  UPDATE profiles SET full_name = p_full_name, phone = p_phone, avatar_url = p_avatar_url, instructor_id = auth.uid() WHERE id = new_user_id;
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 