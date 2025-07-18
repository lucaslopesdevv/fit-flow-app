-- Fix create_student function to use profiles table instead of non-existent users table
-- This function creates a pending student invitation record
CREATE OR REPLACE FUNCTION public.create_student(
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_invitation_id UUID;
  instructor_profile profiles%ROWTYPE;
BEGIN
  -- Check if caller is instructor (use profiles table, not users)
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
  
  -- Generate a new UUID for the invitation
  new_invitation_id := gen_random_uuid();
  
  -- Create a pending student profile that will be activated when they sign up
  INSERT INTO profiles (
    id,
    email,
    full_name,
    phone,
    avatar_url,
    role,
    instructor_id,
    is_active
  ) VALUES (
    new_invitation_id,
    p_email,
    p_full_name,
    p_phone,
    p_avatar_url,
    'student',
    auth.uid(),
    false  -- Set to false until they complete signup
  );

  RETURN new_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;