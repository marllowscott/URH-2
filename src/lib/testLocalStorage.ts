// Test script to validate localStorage implementation
import { 
  addResource, 
  getResources, 
  addCourse, 
  getCourses,
  addStudent,
  getStudents,
  addNotification,
  getNotifications,
  updateCourseProgress,
  getCourseProgress,
  initializeDefaultData
} from './localStorage';

export function testLocalStorageImplementation() {
  console.log('🧪 Testing localStorage Implementation...');
  
  try {
    // Initialize default data
    initializeDefaultData();
    console.log('✅ Default data initialized');

    // Test resource operations
    const testResource = addResource({
      title: 'Test Resource',
      description: 'A test resource for validation',
      type: 'pdf',
      fileOrUrl: 'data:application/pdf;base64,test',
      program: 'Software Development'
    });
    console.log('✅ Resource added:', testResource.id);

    const resources = getResources();
    console.log('✅ Resources retrieved:', resources.length);

    // Test course operations
    const testCourse = addCourse({
      title: 'Test Course',
      description: 'A test course for validation',
      thumbnail: 'data:image/png;base64,test',
      program: 'Software Development',
      modules: [{
        id: 'module-1',
        title: 'Test Module',
        resources: [testResource.id],
        time: 30,
        XP: 50
      }]
    });
    console.log('✅ Course added:', testCourse.id);

    const courses = getCourses();
    console.log('✅ Courses retrieved:', courses.length);

    // Test student operations
    const testStudent = addStudent({
      name: 'Test Student',
      XP: 0,
      enrolledCourses: [testCourse.id]
    });
    console.log('✅ Student added:', testStudent.id);

    const students = getStudents();
    console.log('✅ Students retrieved:', students.length);

    // Test progress tracking
    const progress = updateCourseProgress({
      studentId: testStudent.id,
      courseId: testCourse.id,
      moduleId: 'module-1',
      completed: true,
      earnedXP: 50,
      completedAt: new Date().toISOString()
    });
    console.log('✅ Progress updated');

    const allProgress = getCourseProgress();
    console.log('✅ Progress retrieved:', allProgress.length);

    // Test notifications
    const notification = addNotification({
      program: 'Software Development',
      type: 'course',
      title: 'Test Notification'
    });
    console.log('✅ Notification added:', notification.id);

    const notifications = getNotifications();
    console.log('✅ Notifications retrieved:', notifications.length);

    console.log('🎉 All localStorage tests passed!');
    return true;
  } catch (error) {
    console.error('❌ localStorage test failed:', error);
    return false;
  }
}

// Auto-run test if this file is imported
if (typeof window !== 'undefined') {
  testLocalStorageImplementation();
}
