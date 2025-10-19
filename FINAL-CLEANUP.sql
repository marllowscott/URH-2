-- ========================================
-- FINAL CLEANUP - DELETE EVERYTHING
-- ========================================
-- This will permanently delete ALL resources
-- Run this in Supabase SQL Editor
-- URL: https://yizqnzxxqokkaountehh.supabase.co
-- ========================================

-- STEP 1: See what you have (BEFORE deletion)
-- ========================================
SELECT 
  'BEFORE DELETION' as status,
  COUNT(*) as total_resources,
  COUNT(DISTINCT program) as total_programs
FROM resources;

-- Show resources by program
SELECT 
  program,
  COUNT(*) as resource_count,
  STRING_AGG(title, ', ') as resource_titles
FROM resources
GROUP BY program;

-- ========================================
-- STEP 2: DELETE EVERYTHING
-- ========================================
-- WARNING: THIS IS PERMANENT!
-- ========================================

DELETE FROM resources;

-- ========================================
-- STEP 3: Verify deletion (AFTER)
-- ========================================

SELECT 
  'AFTER DELETION' as status,
  COUNT(*) as total_resources
FROM resources;

-- This should return 0 rows
SELECT * FROM resources;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
-- If the count shows 0, all resources are deleted!
-- Next step: Go to Storage → resources bucket → Delete all files
-- ========================================

-- ========================================
-- ALTERNATIVE: Delete specific data only
-- ========================================
-- Uncomment these if you want selective deletion:

-- Delete by program:
-- DELETE FROM resources WHERE program = 'Software Development';
-- DELETE FROM resources WHERE program = 'Digital Marketing';
-- DELETE FROM resources WHERE program = 'Product Design';

-- Delete by date (older than specific date):
-- DELETE FROM resources WHERE created_at < '2025-10-19';

-- Delete by type:
-- DELETE FROM resources WHERE type = 'PDF';
-- DELETE FROM resources WHERE type = 'Video';

-- ========================================
-- VERIFY YOUR CRUD OPERATIONS WORK
-- ========================================
-- After cleanup, test these operations:

-- 1. CREATE: Upload a new resource → Should save to database
-- 2. READ: View resources → Should show your uploads
-- 3. UPDATE: Edit a resource → Should update in database
-- 4. DELETE: Delete a resource → Should remove from database AND stay gone after refresh

-- ========================================
