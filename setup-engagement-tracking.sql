-- ========================================
-- ENGAGEMENT TRACKING SETUP
-- ========================================
-- This ensures course_progress table tracks student engagement
-- Run this in Supabase SQL Editor
-- ========================================

-- Step 1: Check course_progress table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'course_progress'
ORDER BY ordinal_position;

-- ========================================
-- Step 2: View current course progress data
-- ========================================
SELECT 
  student_id,
  course_id,
  progress_percentage,
  last_accessed,
  created_at
FROM course_progress
ORDER BY last_accessed DESC;

-- ========================================
-- Step 3: Calculate current engagement rate
-- ========================================
SELECT 
  COUNT(*) as total_enrollments,
  ROUND(AVG(progress_percentage)) as average_progress,
  COUNT(CASE WHEN progress_percentage > 0 THEN 1 END) as active_students,
  COUNT(CASE WHEN progress_percentage >= 100 THEN 1 END) as completed_courses
FROM course_progress;

-- ========================================
-- Step 4: Engagement by course
-- ========================================
SELECT 
  c.title as course_name,
  COUNT(cp.student_id) as enrolled_students,
  ROUND(AVG(cp.progress_percentage)) as avg_progress,
  COUNT(CASE WHEN cp.progress_percentage >= 100 THEN 1 END) as completed
FROM course_progress cp
LEFT JOIN courses c ON cp.course_id = c.id
GROUP BY c.id, c.title
ORDER BY avg_progress DESC;

-- ========================================
-- Step 5: Student engagement breakdown
-- ========================================
SELECT 
  CASE 
    WHEN progress_percentage = 0 THEN 'Not Started (0%)'
    WHEN progress_percentage < 25 THEN 'Low (1-24%)'
    WHEN progress_percentage < 50 THEN 'Medium (25-49%)'
    WHEN progress_percentage < 75 THEN 'Good (50-74%)'
    WHEN progress_percentage < 100 THEN 'High (75-99%)'
    ELSE 'Completed (100%)'
  END as engagement_level,
  COUNT(*) as student_count
FROM course_progress
GROUP BY engagement_level
ORDER BY MIN(progress_percentage);

-- ========================================
-- Step 6: Add sample data (OPTIONAL - for testing)
-- ========================================
-- Uncomment this if you want to add test data:

/*
-- Insert sample course progress for testing
INSERT INTO course_progress (student_id, course_id, progress_percentage, last_accessed)
SELECT 
  p.id as student_id,
  c.id as course_id,
  FLOOR(RANDOM() * 100) as progress_percentage,
  NOW() - (RANDOM() * INTERVAL '30 days') as last_accessed
FROM profiles p
CROSS JOIN courses c
WHERE p.role = 'student'
  AND NOT EXISTS (
    SELECT 1 FROM course_progress cp 
    WHERE cp.student_id = p.id AND cp.course_id = c.id
  )
LIMIT 20;
*/

-- ========================================
-- Step 7: Create function to update engagement on progress change
-- ========================================
CREATE OR REPLACE FUNCTION update_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update last_accessed
DROP TRIGGER IF EXISTS update_course_progress_timestamp ON course_progress;
CREATE TRIGGER update_course_progress_timestamp
  BEFORE UPDATE ON course_progress
  FOR EACH ROW
  WHEN (OLD.progress_percentage IS DISTINCT FROM NEW.progress_percentage)
  EXECUTE FUNCTION update_last_accessed();

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Overall engagement rate (what instructor sees)
SELECT ROUND(AVG(progress_percentage)) || '%' as engagement_rate
FROM course_progress;

-- Active students (accessed in last 7 days)
SELECT COUNT(DISTINCT student_id) as active_last_7_days
FROM course_progress
WHERE last_accessed > NOW() - INTERVAL '7 days';

-- Engagement trend (last 30 days)
SELECT 
  DATE(last_accessed) as date,
  COUNT(DISTINCT student_id) as active_students,
  ROUND(AVG(progress_percentage)) as avg_progress
FROM course_progress
WHERE last_accessed > NOW() - INTERVAL '30 days'
GROUP BY DATE(last_accessed)
ORDER BY date DESC;

-- ========================================
-- WHAT THIS TRACKS:
-- ========================================
-- ✅ Average progress across all students
-- ✅ Course completion rates
-- ✅ Active vs inactive students
-- ✅ Last access timestamps
-- ✅ Real-time engagement metrics
-- ========================================
