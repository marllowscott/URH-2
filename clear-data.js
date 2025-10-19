// Clear all local storage data
console.log('🧹 Clearing all local storage data...');
localStorage.clear();
console.log('✅ Local storage cleared!');

// Clear session storage
sessionStorage.clear();
console.log('✅ Session storage cleared!');

console.log('\n📋 To clear Supabase database:');
console.log('1. Go to: https://yizqnzxxqokkaountehh.supabase.co');
console.log('2. Navigate to SQL Editor');
console.log('3. Run these commands:\n');
console.log('-- Clear all resources');
console.log('DELETE FROM resources;');
console.log('\n-- Clear all tasks');
console.log('DELETE FROM tasks;');
console.log('\n-- Clear all courses');
console.log('DELETE FROM courses;');
console.log('\n-- Clear all students');
console.log('DELETE FROM students;');
console.log('\n-- Clear all notifications');
console.log('DELETE FROM notifications;');
console.log('\n-- Clear all course_progress');
console.log('DELETE FROM course_progress;');
console.log('\n-- Clear storage bucket (files)');
console.log('-- Go to Storage > resources bucket > Delete all files');

console.log('\n✨ System is now ready for fresh use!');
