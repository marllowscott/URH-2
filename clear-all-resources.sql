-- ========================================
-- CLEAR ALL RESOURCES FROM DATABASE
-- ========================================
-- Run this in Supabase SQL Editor
-- URL: https://yizqnzxxqokkaountehh.supabase.co

-- Delete all resources from the resources table
DELETE FROM resources;

-- ========================================
-- NOTES:
-- ========================================
-- 1. This will permanently delete ALL resources
-- 2. To also delete uploaded files, go to:
--    Storage > resources bucket > Select all files > Delete
-- 3. This action cannot be undone
-- 4. After running this, your resource count will reset to 0
-- ========================================

-- Optional: Verify deletion
-- SELECT COUNT(*) FROM resources;
-- Should return 0 if successful
