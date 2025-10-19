-- ========================================
-- CLEAR ALL DATA FROM SUPABASE DATABASE
-- ========================================
-- Run this in Supabase SQL Editor
-- URL: https://yizqnzxxqokkaountehh.supabase.co

-- Clear all resources
DELETE FROM resources;

-- Clear all tasks  
DELETE FROM tasks;

-- Clear all courses
DELETE FROM courses;

-- Clear all students
DELETE FROM students;

-- Clear all notifications
DELETE FROM notifications;

-- Clear all course progress
DELETE FROM course_progress;

-- Clear all lesson progress
DELETE FROM lesson_progress;

-- Clear all xp events (if table exists)
DELETE FROM xp_events;

-- Reset auto-increment sequences (optional)
-- ALTER SEQUENCE resources_id_seq RESTART WITH 1;
-- ALTER SEQUENCE tasks_id_seq RESTART WITH 1;

-- ========================================
-- NOTES:
-- ========================================
-- 1. This will delete ALL data from your tables
-- 2. To clear uploaded files, go to:
--    Storage > resources bucket > Select all > Delete
-- 3. Auth users will remain (students/instructors can still login)
-- 4. To delete auth users, go to Authentication > Users > Delete manually
-- ========================================
