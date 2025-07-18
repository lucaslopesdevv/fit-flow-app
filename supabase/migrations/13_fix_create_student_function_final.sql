-- Drop the existing create_student function
DROP FUNCTION IF EXISTS create_student(text, text, text, text);

-- Create a new approach: create_student_invitation function
-- This function creates a pending student record and returns invitation info
CREATE OR REPLACE FUNCTION create_student_invitation(
  p_email text,
  p_full_name text,
  p_phone text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  instructor_profile profiles%ROWTYPE;
  invitation_record jsonb;
BEGIN
  -- Check if caller is instructor
  SELECT * INTO instructor_profile 
  FROM profiles 
  WHERE id = auth.uid() AND role = 'instructor';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only instructors can create student invitations';
  END IF;

  -- Check if student with this email already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE email = p_email) THEN
    RAISE EXCEPTION 'Student with email % already exists', p_email;
  END IF;
  
  -- For now, we'll return the invitation data that the client can use
  -- to send an email invitation through Supabase Auth
  invitation_record := jsonb_build_object(
    'email', p_email,
    'full_name', p_full_name,
    'phone', p_phone,
    'avatar_url', p_avatar_url,
    'instructor_id', auth.uid(),
    'instructor_name', instructor_profile.full_name,
    'instructor_email', instructor_profile.email
  );

  RETURN invitation_record;
END;
$$;

-- Also create a function to complete student registration after they sign up
CREATE OR REPLACE FUNCTION complete_student_registration(
  p_full_name text,
  p_phone text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_instructor_email text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  instructor_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Find instructor by email if provided
  IF p_instructor_email IS NOT NULL THEN
    SELECT id INTO instructor_id 
    FROM profiles 
    WHERE email = p_instructor_email AND role = 'instructor';
  END IF;

  -- Update or insert profile
  INSERT INTO profiles (
    id, 
    email, 
    full_name, 
    phone, 
    avatar_url, 
    instructor_id, 
    role
  ) VALUES (
    current_user_id,
    auth.email(),
    p_full_name,
    p_phone,
    p_avatar_url,
    instructor_id,
    'student'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    avatar_url = EXCLUDED.avatar_url,
    instructor_id = COALESCE(EXCLUDED.instructor_id, profiles.instructor_id),
    role = 'student',
    updated_at = timezone('utc'::text, now());

  RETURN current_user_id;
END;
$$;