# 🧹 Clear All Resources - Instructions

## Quick Start

Follow these steps to clear all resources and start fresh:

### Step 1: Clear Database
1. Go to: https://yizqnzxxqokkaountehh.supabase.co
2. Login to your Supabase dashboard
3. Click **SQL Editor** in the left sidebar
4. Copy and paste the SQL from `clear-all-resources.sql`
5. Click **Run** button

### Step 2: Clear Storage Files
1. In Supabase dashboard, go to **Storage**
2. Click **resources** bucket
3. Select all files (use checkbox at top)
4. Click **Delete** button
5. Confirm deletion

### Step 3: Clear Browser Cache (Optional)
1. In your app, press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. This hard refreshes the page and clears cache

---

## ✅ You're Done!

Your system is now completely clean:
- ✅ All resources deleted from database
- ✅ All files deleted from storage
- ✅ Ready to upload new resources

---

## 🎯 Features Now Active

### Duplicate Prevention
- Cannot upload resources with the same title in the same program
- Prevents accidental duplicate uploads

### Upload Feedback
- Button disabled during upload
- Shows "Uploading..." text
- Success message with checkmark: "✅ Uploaded Successfully!"
- Clear error messages if something fails

### No More Multiple Clicks
- Button becomes disabled immediately on click
- Prevents submitting the form multiple times
- No more duplicates from multiple clicks!

---

## 📋 SQL to Clear Specific Program

If you only want to delete resources from one program:

```sql
-- Delete only Software Development resources
DELETE FROM resources WHERE program = 'Software Development';

-- Delete only Digital Marketing resources
DELETE FROM resources WHERE program = 'Digital Marketing';

-- Delete only Product Design resources
DELETE FROM resources WHERE program = 'Product Design';
```

---

## 🔍 Verify Deletion

Run this in SQL Editor to check:

```sql
-- Count remaining resources
SELECT COUNT(*) as total_resources FROM resources;

-- Count by program
SELECT program, COUNT(*) as count 
FROM resources 
GROUP BY program;
```

Should return 0 if all resources are deleted.
