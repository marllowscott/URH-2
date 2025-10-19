-- ========================================
-- CREATE HELPER FUNCTIONS FOR DASHBOARD
-- ========================================
-- Run this in Supabase SQL Editor to enable proper counting
-- ========================================

-- Function 1: Count Students
-- ========================================
CREATE OR REPLACE FUNCTION count_students()
RETURNS INTEGER AS $$
DECLARE
  student_count INTEGER;
BEGIN
  -- Try to count from profiles table first
  SELECT COUNT(*) INTO student_count
  FROM profiles
  WHERE role = 'student';
  
  -- If profiles table doesn't have data, return 0
  RETURN COALESCE(student_count, 0);
EXCEPTION
  WHEN OTHERS THEN
    -- If profiles table doesn't exist, return 0
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Calculate Engagement Rate
-- ========================================
CREATE OR REPLACE FUNCTION calculate_engagement()
RETURNS INTEGER AS $$
DECLARE
  avg_progress INTEGER;
BEGIN
  -- Calculate average progress from course_progress table
  SELECT ROUND(AVG(progress_percentage))::INTEGER INTO avg_progress
  FROM course_progress;
  
  -- Return 0 if no data
  RETURN COALESCE(avg_progress, 0);
EXCEPTION
  WHEN OTHERS THEN
    -- If table doesn't exist, return 0
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 3: Count Resources by Program
-- ========================================
CREATE OR REPLACE FUNCTION count_resources_by_program(program_name TEXT)
RETURNS INTEGER AS $$
DECLARE
  resource_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO resource_count
  FROM resources
  WHERE program = program_name;
  
  RETURN COALESCE(resource_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- TEST THE FUNCTIONS
-- ========================================

-- Test student count
SELECT count_students() as total_students;

-- Test engagement rate
SELECT calculate_engagement() as engagement_rate;

-- Test resource count
SELECT 
  count_resources_by_program('Software Development') as sw_dev,
  count_resources_by_program('Digital Marketing') as marketing,
  count_resources_by_program('Product Design') as design;

-- ========================================
-- GRANT PERMISSIONS
-- ========================================
-- Allow authenticated users to call these functions
GRANT EXECUTE ON FUNCTION count_students() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_engagement() TO authenticated;
GRANT EXECUTE ON FUNCTION count_resources_by_program(TEXT) TO authenticated;

-- ========================================
-- SUCCESS!
-- ========================================
-- These functions will now work in your dashboard
-- They handle missing tables gracefully and return 0 if no data
-- ========================================
