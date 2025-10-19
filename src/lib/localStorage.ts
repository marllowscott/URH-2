// localStorage utility functions for URH Resource Hub
// Implements data structures matching the spec

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileOrUrl: string; // base64 string for files or URL
  program: string;
  createdAt: string;
}

export interface Module {
  id: string;
  title: string;
  resources: string[]; // array of resource IDs
  time: number; // duration in minutes
  XP: number;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string; // base64 string
  modules: Module[];
  program: string;
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  XP: number;
  enrolledCourses: string[]; // array of course IDs
}

export interface CourseProgress {
  studentId: string;
  courseId: string;
  moduleId: string;
  completed: boolean;
  earnedXP: number;
  completedAt?: string;
}

export interface Notification {
  id: string;
  program: string;
  type: 'resource' | 'course';
  title: string;
  createdAt: string;
  read: boolean;
}

// Storage keys
const STORAGE_KEYS = {
  RESOURCES: 'resources',
  COURSES: 'courses',
  STUDENTS: 'students',
  COURSE_PROGRESS: 'courseProgress',
  NOTIFICATIONS: 'notifications'
} as const;

// Event emitter for real-time updates
class StorageEventEmitter {
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

export const storageEvents = new StorageEventEmitter();

// Generic CRUD operations
export function getItem<T>(key: string): T[] {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return [];
  }
}

export function setItem<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    storageEvents.emit(`${key}_updated`, data);
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
}

export function addItem<T extends { id: string }>(key: string, item: T): T {
  const items = getItem<T>(key);
  items.push(item);
  setItem(key, items);
  return item;
}

export function updateItem<T extends { id: string }>(key: string, id: string, updates: Partial<T>): T | null {
  const items = getItem<T>(key);
  const index = items.findIndex(item => item.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    setItem(key, items);
    return items[index];
  }
  return null;
}

export function deleteItem<T extends { id: string }>(key: string, id: string): boolean {
  const items = getItem<T>(key);
  const filteredItems = items.filter(item => item.id !== id);
  if (filteredItems.length !== items.length) {
    setItem(key, filteredItems);
    return true;
  }
  return false;
}

// Resource operations
export function getResources(): Resource[] {
  return getItem<Resource>(STORAGE_KEYS.RESOURCES);
}

export function addResource(resource: Omit<Resource, 'id' | 'createdAt'>): Resource {
  const newResource: Resource = {
    ...resource,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  return addItem(STORAGE_KEYS.RESOURCES, newResource);
}

export function updateResource(id: string, updates: Partial<Resource>): Resource | null {
  return updateItem(STORAGE_KEYS.RESOURCES, id, updates);
}

export function deleteResource(id: string): boolean {
  return deleteItem(STORAGE_KEYS.RESOURCES, id);
}

// Course operations
export function getCourses(): Course[] {
  return getItem<Course>(STORAGE_KEYS.COURSES);
}

export function addCourse(course: Omit<Course, 'id' | 'createdAt'>): Course {
  const newCourse: Course = {
    ...course,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  return addItem(STORAGE_KEYS.COURSES, newCourse);
}

export function updateCourse(id: string, updates: Partial<Course>): Course | null {
  return updateItem(STORAGE_KEYS.COURSES, id, updates);
}

export function deleteCourse(id: string): boolean {
  return deleteItem(STORAGE_KEYS.COURSES, id);
}

// Student operations
export function getStudents(): Student[] {
  return getItem<Student>(STORAGE_KEYS.STUDENTS);
}

export function getStudent(id: string): Student | null {
  const students = getStudents();
  return students.find(student => student.id === id) || null;
}

export function addStudent(student: Omit<Student, 'id'>): Student {
  const newStudent: Student = {
    ...student,
    id: generateId()
  };
  return addItem(STORAGE_KEYS.STUDENTS, newStudent);
}

export function updateStudent(id: string, updates: Partial<Student>): Student | null {
  return updateItem(STORAGE_KEYS.STUDENTS, id, updates);
}

// Course progress operations
export function getCourseProgress(): CourseProgress[] {
  return getItem<CourseProgress>(STORAGE_KEYS.COURSE_PROGRESS);
}

export function getStudentProgress(studentId: string, courseId?: string): CourseProgress[] {
  const progress = getCourseProgress();
  return progress.filter(p => 
    p.studentId === studentId && 
    (courseId ? p.courseId === courseId : true)
  );
}

export function updateCourseProgress(progress: CourseProgress): CourseProgress {
  const allProgress = getCourseProgress();
  const existingIndex = allProgress.findIndex(p => 
    p.studentId === progress.studentId && 
    p.courseId === progress.courseId && 
    p.moduleId === progress.moduleId
  );

  if (existingIndex !== -1) {
    allProgress[existingIndex] = progress;
  } else {
    allProgress.push(progress);
  }

  setItem(STORAGE_KEYS.COURSE_PROGRESS, allProgress);
  return progress;
}

// Notification operations
export function getNotifications(): Notification[] {
  return getItem<Notification>(STORAGE_KEYS.NOTIFICATIONS);
}

export function addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Notification {
  const newNotification: Notification = {
    ...notification,
    id: generateId(),
    createdAt: new Date().toISOString(),
    read: false
  };
  return addItem(STORAGE_KEYS.NOTIFICATIONS, newNotification);
}

export function markNotificationAsRead(id: string): Notification | null {
  return updateItem(STORAGE_KEYS.NOTIFICATIONS, id, { read: true });
}

export function markAllNotificationsAsRead(): void {
  const notifications = getNotifications();
  const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
  setItem(STORAGE_KEYS.NOTIFICATIONS, updatedNotifications);
}

// File handling utilities
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

// Utility functions
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Initialize default data if localStorage is empty
export function initializeDefaultData(): void {
  const hasResources = localStorage.getItem(STORAGE_KEYS.RESOURCES);
  const hasCourses = localStorage.getItem(STORAGE_KEYS.COURSES);
  const hasStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  const hasNotifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);

  if (!hasResources) {
    setItem(STORAGE_KEYS.RESOURCES, []);
  }
  if (!hasCourses) {
    setItem(STORAGE_KEYS.COURSES, []);
  }
  if (!hasStudents) {
    setItem(STORAGE_KEYS.STUDENTS, []);
  }
  if (!hasNotifications) {
    setItem(STORAGE_KEYS.NOTIFICATIONS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.COURSE_PROGRESS)) {
    setItem(STORAGE_KEYS.COURSE_PROGRESS, []);
  }
}

// Listen for storage changes across tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && Object.values(STORAGE_KEYS).includes(e.key as any)) {
      storageEvents.emit(`${e.key}_updated`);
    }
  });
}
