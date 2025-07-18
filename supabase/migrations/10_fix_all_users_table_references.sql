-- Fix all references to the non-existent users table
-- Update all functions to use profiles table instead

-- Fix create_instructor function
CREATE OR REPLACE FUNCTION public.create_instructor(
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
  admin_profile profiles%ROWTYPE;
BEGIN
  -- Check if caller is admin (use profiles table, not users)
  SELECT * INTO admin_profile 
  FROM profiles 
  WHERE id = auth.uid() AND role = 'admin';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only admin can create instructor';
  END IF;

  -- Check if instructor with this email already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE email = p_email) THEN
    RAISE EXCEPTION 'Instructor with email % already exists', p_email;
  END IF;

  -- Create user in auth (Supabase Auth)
  -- This will trigger the handle_new_user function to create the profile
  INSERT INTO auth.users (email, raw_user_meta_data) 
  VALUES (
    p_email, 
    jsonb_build_object('full_name', p_full_name, 'role', 'instructor')
  ) RETURNING id INTO new_user_id;

  -- Update profile with additional data
  UPDATE profiles 
  SET 
    phone = p_phone, 
    avatar_url = p_avatar_url 
  WHERE id = new_user_id;

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix role function if it exists
CREATE OR REPLACE FUNCTION public.role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix handle_new_profile_with_instructor function if it exists
CREATE OR REPLACE FUNCTION public.handle_new_profile_with_instructor()
RETURNS TRIGGER AS $$
BEGIN
  -- This function should handle profile creation with instructor assignment
  -- Since we're using the handle_new_user function now, this might not be needed
  -- But keeping it for backward compatibility
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 