-- Fix triggers and create_student function after removing users table
-- This migration ensures proper profile creation and student creation

-- Drop any old triggers that reference the non-existent users table
DROP TRIGGER IF EXISTS create_user_after_auth_creation ON auth.users;
DROP TRIGGER IF EXISTS create_profile_after_user_creation ON users;
DROP FUNCTION IF EXISTS create_user_from_auth();
DROP FUNCTION IF EXISTS create_profile_for_new_user();

-- Create function to automatically create profile when user is created in auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update create_student function to work with the new structure
CREATE OR REPLACE FUNCTION public.create_student(
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
  instructor_profile profiles%ROWTYPE;
BEGIN
  -- Check if caller is instructor
  SELECT * INTO instructor_profile 
  FROM profiles 
  WHERE id = auth.uid() AND role = 'instructor';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only instructor can create student';
  END IF;

  -- Check if student with this email already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE email = p_email) THEN
    RAISE EXCEPTION 'Student with email % already exists', p_email;
  END IF;
  
  -- Create user in auth (Supabase Auth)
  -- This will trigger the handle_new_user function to create the profile
  INSERT INTO auth.users (email, raw_user_meta_data) 
  VALUES (
    p_email, 
    jsonb_build_object('full_name', p_full_name, 'role', 'student')
  ) RETURNING id INTO new_user_id;

  -- Update profile with additional data and link to instructor
  UPDATE profiles 
  SET 
    phone = p_phone, 
    avatar_url = p_avatar_url, 
    instructor_id = auth.uid() 
  WHERE id = new_user_id;

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 