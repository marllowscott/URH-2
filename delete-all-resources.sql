-- ========================================
-- DELETE ALL RESOURCES FROM DATABASE
-- ========================================
-- Run this in Supabase SQL Editor
-- URL: https://yizqnzxxqokkaountehh.supabase.co
-- ========================================

-- Step 1: Check current resources (BEFORE deletion)
SELECT 
  COUNT(*) as total_resources,
  program,
  COUNT(*) as count_per_program
FROM resources
GROUP BY program
ORDER BY program;

-- ========================================
-- Step 2: DELETE ALL RESOURCES
-- ========================================
-- WARNING: This is PERMANENT and cannot be undone!
DELETE FROM resources;

-- ========================================
-- Step 3: Verify deletion (AFTER deletion)
-- ========================================
-- Should return 0 rows
SELECT COUNT(*) as remaining_resources FROM resources;

-- ========================================
-- WHAT THIS DOES:
-- ========================================
-- ✅ Deletes ALL resources from the resources table
-- ✅ Works for all programs (Software Development, Digital Marketing, Product Design)
-- ✅ Leaves table structure intact (only deletes data)
-- ✅ Does NOT delete the table itself
-- ========================================

-- ========================================
-- NEXT STEPS AFTER RUNNING THIS:
-- ========================================
-- 1. Go to Storage → resources bucket
-- 2. Select all files
-- 3. Click Delete button
-- 4. This clears both database AND storage
-- ========================================

-- ========================================
-- TO DELETE SPECIFIC PROGRAM ONLY:
-- ========================================
-- Uncomment ONE of these instead of "DELETE FROM resources;" above:

-- DELETE FROM resources WHERE program = 'Software Development';
-- DELETE FROM resources WHERE program = 'Digital Marketing';
-- DELETE FROM resources WHERE program = 'Product Design';

-- ========================================
