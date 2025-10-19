-- ========================================
-- STUDENT COUNT TRACKING SETUP
-- ========================================
-- This ensures the profiles table tracks user roles
-- Run this in Supabase SQL Editor
-- ========================================

-- Step 1: Check if profiles table has role column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- ========================================
-- Step 2: Create trigger to auto-create profile on signup (if not exists)
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (if not exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- Step 3: Sync existing users to profiles table
-- ========================================
-- This will add any existing users who aren't in profiles yet
INSERT INTO public.profiles (id, role, created_at)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'role', 'student') as role,
  created_at
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE profiles.id = auth.users.id
);

-- ========================================
-- Step 4: Count students by role
-- ========================================
SELECT 
  role,
  COUNT(*) as user_count
FROM profiles
GROUP BY role;

-- Should show something like:
-- role       | user_count
-- -----------|-----------
-- student    | X
-- instructor | Y

-- ========================================
-- Step 5: If profiles table doesn't have role column, add it
-- ========================================
-- Uncomment these if role column doesn't exist:

-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
-- UPDATE profiles SET role = 'student' WHERE role IS NULL;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Count all students
SELECT COUNT(*) as total_students 
FROM profiles 
WHERE role = 'student';

-- Count all instructors
SELECT COUNT(*) as total_instructors 
FROM profiles 
WHERE role = 'instructor';

-- List all users with roles
SELECT 
  id,
  role,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- ========================================
