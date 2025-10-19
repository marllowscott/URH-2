-- ========================================
-- REMOVE DUPLICATE RESOURCES
-- ========================================
-- This keeps the NEWEST version of each duplicate
-- and deletes the older ones

-- Step 1: See duplicates first (OPTIONAL - for review)
SELECT title, program, COUNT(*) as duplicate_count
FROM resources
GROUP BY title, program
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: DELETE duplicates (keeps newest one)
DELETE FROM resources
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY title, program 
             ORDER BY created_at DESC
           ) as row_num
    FROM resources
  ) as ranked
  WHERE row_num > 1
);

-- Step 3: Verify deletion
SELECT 
  program,
  COUNT(*) as total_resources,
  COUNT(DISTINCT title) as unique_titles
FROM resources
GROUP BY program;

-- ========================================
-- WHAT THIS DOES:
-- ========================================
-- 1. Finds all resources with same title + program
-- 2. Keeps the NEWEST one (most recent created_at)
-- 3. Deletes all older duplicates
-- 4. Shows you final count per program
-- ========================================
