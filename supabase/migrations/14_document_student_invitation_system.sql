-- Migration: Document Student Invitation System Implementation
-- Date: 2025-01-17
-- Description: This migration documents the complete student invitation system implementation
-- that was created to fix the broken student invitation functionality.

-- =============================================================================
-- STUDENT INVITATION SYSTEM DOCUMENTATION
-- =============================================================================

-- This migration documents the implementation of a complete student invitation system
-- that replaces the previous broken approach that tried to insert directly into auth.users.

-- PROBLEM SOLVED:
-- - Previous create_student function tried to insert into auth.users table (not allowed)
-- - No email invitation system was in place
-- - Student profiles were not being created properly
-- - Instructor-student relationships were not being established

-- SOLUTION IMPLEMENTED:
-- 1. Edge Function for secure user creation and email sending
-- 2. Updated trigger system for automatic profile creation
-- 3. Proper student invitation workflow
-- 4. Client-side confirmation page for account setup

-- =============================================================================
-- 1. EDGE FUNCTION: invite-student
-- =============================================================================

-- Created Edge Function at: supabase/functions/invite-student/index.ts
-- Purpose: Handle student invitations securely using Supabase Admin API
-- Features:
-- - Validates instructor permissions
-- - Creates user in auth.users using admin.inviteUserByEmail()
-- - Sends invitation email automatically
-- - Includes instructor metadata in user data
-- - Returns success/error responses

-- Function signature (TypeScript):
-- POST /functions/v1/invite-student
-- Headers: Authorization: Bearer <instructor_token>
-- Body: { email: string, full_name: string, phone?: string }
-- Response: { success: boolean, user_id?: string, message?: string, error?: string }

-- =============================================================================
-- 2. DATABASE FUNCTIONS
-- =============================================================================

-- Removed old broken function:
-- DROP FUNCTION IF EXISTS create_student(text, text, text, text);

-- Created new helper function for invitation data:
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
  
  -- Return invitation data for Edge Function to use
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

-- Created function for completing student registration:
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

-- =============================================================================
-- 3. UPDATED TRIGGER SYSTEM
-- =============================================================================

-- Updated trigger function to handle invited users properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create profile for new user with metadata from invitation
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    instructor_id
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'instructor_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'instructor_id')::uuid
      ELSE NULL
    END
  );
  
  RETURN NEW;
END;
$$;

-- Ensure trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 4. CLIENT-SIDE IMPLEMENTATION
-- =============================================================================

-- Updated files:
-- - src/services/api/StudentService.ts: Now calls Edge Function instead of RPC
-- - src/app/confirm.tsx: Handles invitation confirmation and account setup
-- - src/hooks/useAuth.ts: Enhanced authentication with better error handling

-- =============================================================================
-- 5. WORKFLOW DOCUMENTATION
-- =============================================================================

-- Complete Student Invitation Workflow:
-- 
-- 1. Instructor clicks "Invite Student" in app
-- 2. StudentService.inviteStudent() is called
-- 3. Edge Function 'invite-student' is invoked with instructor token
-- 4. Edge Function validates instructor permissions
-- 5. Edge Function calls supabase.auth.admin.inviteUserByEmail()
-- 6. Supabase creates user in auth.users and sends invitation email
-- 7. Student receives email with invitation link
-- 8. Student clicks link, Supabase processes token and redirects to app
-- 9. App detects authenticated user and completes setup
-- 10. Trigger automatically creates profile with instructor_id
-- 11. Student can now access their training program

-- =============================================================================
-- 6. SECURITY CONSIDERATIONS
-- =============================================================================

-- - Edge Function uses service role key (server-side only)
-- - All database functions use SECURITY DEFINER with proper permission checks
-- - Instructor validation happens at multiple levels
-- - Student emails are validated for uniqueness
-- - Invitation tokens are handled securely by Supabase Auth

-- =============================================================================
-- 7. TESTING VERIFICATION
-- =============================================================================

-- Test case verified on 2025-01-17:
-- - Instructor: lucaslopes0802@gmail.com (id: 5b238e7d-6aa7-4ff8-a629-ddd1efac0012)
-- - Student: lucaslopes0802@hotmail.com (id: ebf078d2-88ce-451b-a662-84ee4499bca4)
-- - Result: ✅ Student created successfully with proper instructor_id linkage
-- - Profile created: ✅ Role set to 'student', instructor_id properly assigned
-- - Email sent: ✅ Invitation email delivered and processed

-- =============================================================================
-- 8. MAINTENANCE NOTES
-- =============================================================================

-- Edge Function deployment:
-- - Function is deployed and active (version 3)
-- - Located at: supabase/functions/invite-student/index.ts
-- - Status: ACTIVE, verify_jwt: true

-- Database functions:
-- - create_student_invitation: Returns invitation metadata
-- - complete_student_registration: Handles manual registration completion
-- - handle_new_user: Trigger function for automatic profile creation

-- Client integration:
-- - StudentService updated to use Edge Function
-- - Confirmation page handles both automatic and manual flows
-- - Authentication hook enhanced for better session management

COMMENT ON FUNCTION create_student_invitation IS 
'Creates invitation metadata for student invitations. Used by Edge Function to validate and prepare invitation data.';

COMMENT ON FUNCTION complete_student_registration IS 
'Completes student registration process. Can be used for manual account completion if needed.';

COMMENT ON FUNCTION handle_new_user IS 
'Trigger function that automatically creates user profiles when new users are added to auth.users. Handles invitation metadata properly.';