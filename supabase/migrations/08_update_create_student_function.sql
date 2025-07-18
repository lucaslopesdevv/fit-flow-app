-- Update create_student function to use profiles table instead of users table
-- This function creates a student profile that will be linked to the instructor
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
  
  -- Create user in auth (Supabase Auth)
  INSERT INTO auth.users (email) VALUES (p_email) RETURNING id INTO new_user_id;

  -- The trigger will create the user profile automatically
  -- Update profile with additional data and link to instructor
  UPDATE profiles 
  SET 
    full_name = p_full_name, 
    phone = p_phone, 
    avatar_url = p_avatar_url, 
    instructor_id = auth.uid() 
  WHERE id = new_user_id;

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 