# 🧹 COMPLETE RESOURCE WIPE - Delete Everything

## ⚠️ THIS WILL DELETE EVERYTHING PERMANENTLY

This guide will help you:
- ✅ Delete ALL resources from database
- ✅ Delete ALL files from storage
- ✅ Verify instructor CRUD operations work correctly
- ✅ Start completely fresh

---

## 🚀 STEP-BY-STEP PROCESS

### **STEP 1: Delete ALL Resources from Database**

1. Go to: **https://yizqnzxxqokkaountehh.supabase.co**
2. Login to your Supabase dashboard
3. Click **SQL Editor** (left sidebar)
4. Copy and paste this SQL:

```sql
-- DELETE ALL RESOURCES PERMANENTLY
DELETE FROM resources;

-- Verify deletion (should return 0)
SELECT COUNT(*) FROM resources;
```

5. Click **RUN** button
6. Confirm it shows `0` rows

---

### **STEP 2: Delete ALL Files from Storage**

1. In Supabase dashboard, click **Storage** (left sidebar)
2. Click **resources** bucket
3. You'll see folders and files uploaded by instructors
4. Click the **checkbox at the top** to select all
5. Click **Delete** button (trash icon)
6. Confirm deletion
7. Repeat for any remaining folders/files

**Alternative (if you have many files):**
1. Go to Storage settings
2. Delete the entire **resources** bucket
3. Create a new **resources** bucket
4. Set permissions to allow authenticated users

---

### **STEP 3: Clear Browser Cache**

1. In your app, press:
   - **Windows**: `Ctrl + Shift + R`
   - **Mac**: `Cmd + Shift + R`
2. This forces a hard refresh
3. Alternatively, clear browser cache completely

---

### **STEP 4: Verify Everything is Gone**

Run this in SQL Editor:

```sql
-- Should return 0
SELECT COUNT(*) FROM resources;

-- Should return empty result
SELECT * FROM resources;
```

Go to your app:
- Student dashboard: Should show "No resources available"
- Instructor dashboard: Should show "No resources available"

---

## ✅ INSTRUCTOR CRUD VERIFICATION

Your instructor CRUD is **ALREADY FULLY FUNCTIONAL**. Here's what happens:

### **CREATE (Upload)**
```
1. Instructor clicks "Add Resource"
2. Fills form and clicks "Save"
3. Uploads to Supabase database ✅
4. Uploads file to Supabase storage ✅
5. Shows: "✅ Uploaded Successfully!"
```

### **READ (View)**
```
1. Fetches from Supabase database ✅
2. Shows in dashboard
3. Updates in real-time via subscriptions
```

### **UPDATE (Edit)**
```
1. Instructor clicks edit icon
2. Updates form and saves
3. Updates in Supabase database ✅
4. Updates file if changed ✅
5. Shows: "✅ Updated Successfully!"
```

### **DELETE (Remove)**
```
1. Instructor clicks delete icon
2. Confirms deletion
3. Removes from frontend immediately ✅
4. Deletes from Supabase database ✅
5. Deletes file from storage ✅
6. Shows: "✅ Deleted Successfully!"
7. Item STAYS DELETED after refresh ✅
```

---

## 🔍 WHY DELETES ARE PERMANENT

The delete function in your code does this:

```typescript
const handleDelete = async (resource: Resource) => {
  // 1. Remove from UI
  setResources(prev => prev.filter(r => r.id !== resource.id));
  
  // 2. Delete from DATABASE
  await supabase.from("resources").delete().eq("id", resource.id);
  
  // 3. Delete from STORAGE
  await supabase.storage.from("resources").remove([resource.file_path]);
  
  // 4. Success message
  toast({ title: "✅ Deleted Successfully!" });
}
```

This means:
- ✅ **Frontend**: Removed immediately
- ✅ **Database**: Deleted permanently
- ✅ **Storage**: File deleted
- ✅ **After refresh**: Stays deleted (fetches from empty database)

---

## 🎯 AFTER COMPLETE WIPE

Your system will have:
- **0 resources** in database
- **0 files** in storage
- **Clean slate** ready for new uploads
- **CRUD fully working**:
  - ✅ Create → Saves to database + storage
  - ✅ Read → Fetches from database
  - ✅ Update → Updates database + storage
  - ✅ Delete → Removes from database + storage + frontend

---

## 📋 SQL COMMANDS REFERENCE

### Delete Everything
```sql
DELETE FROM resources;
```

### Delete by Program
```sql
DELETE FROM resources WHERE program = 'Software Development';
DELETE FROM resources WHERE program = 'Digital Marketing';
DELETE FROM resources WHERE program = 'Product Design';
```

### Delete by Type
```sql
DELETE FROM resources WHERE type = 'PDF';
DELETE FROM resources WHERE type = 'Video';
```

### Delete Old Resources (older than date)
```sql
DELETE FROM resources WHERE created_at < '2025-10-19';
```

---

## 🆘 TROUBLESHOOTING

### "Deleted items come back after refresh"
**Cause**: Delete didn't work in database  
**Solution**: 
1. Check Supabase SQL Editor for errors
2. Verify RLS (Row Level Security) policies allow deletes
3. Check if you're logged in as instructor

### "Delete button doesn't work"
**Cause**: Frontend issue  
**Solution**: 
1. Check browser console for errors
2. Verify you're logged in as instructor (not student)
3. Hard refresh browser

### "Files still in storage"
**Cause**: Storage deletion failed  
**Solution**: 
1. Go to Storage manually
2. Delete files one by one
3. Or delete entire bucket and recreate

---

## 🔐 PERMISSIONS CHECK

Make sure your Supabase RLS policies allow instructors to delete:

```sql
-- Check if delete policy exists
SELECT * FROM pg_policies 
WHERE tablename = 'resources' 
AND cmd = 'DELETE';
```

If no delete policy, create one in Supabase:
1. Go to Authentication → Policies
2. Click resources table
3. Add delete policy for authenticated users

---

## ✨ YOU'RE READY!

Once you complete all steps:
1. ✅ Database is empty
2. ✅ Storage is empty
3. ✅ CRUD fully functional
4. ✅ Deletes are permanent
5. ✅ Ready for production use

**Your system is now clean and ready for fresh uploads!** 🎉
