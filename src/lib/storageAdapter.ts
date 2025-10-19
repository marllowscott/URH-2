// Storage adapter that mimics Supabase API structure for localStorage
import { 
  getResources, 
  addResource, 
  updateResource, 
  deleteResource,
  getCourses,
  addCourse,
  updateCourse,
  deleteCourse,
  getStudents,
  getStudent,
  addStudent,
  updateStudent,
  getCourseProgress,
  getStudentProgress,
  updateCourseProgress,
  getNotifications,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  fileToBase64,
  storageEvents,
  initializeDefaultData,
  type Resource,
  type Course,
  type Student,
  type CourseProgress,
  type Notification
} from './localStorage';

// Initialize default data on import
initializeDefaultData();

// Mock auth object that reads from existing Supabase auth
const mockAuth = {
  async getUser() {
    // Try to get user from Supabase auth if available
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data } = await supabase.auth.getUser();
        return data;
      }
    } catch (error) {
      console.log('Supabase auth not available, using mock user');
    }
    
    // Fallback to mock user
    return {
      data: {
        user: {
          id: 'mock-user-id',
          email: 'demo@example.com',
          user_metadata: {
            role: 'instructor' // Default to instructor for demo
          }
        }
      }
    };
  },

  async getSession() {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data } = await supabase.auth.getSession();
        return data;
      }
    } catch (error) {
      console.log('Supabase auth not available, using mock session');
    }
    
    // Fallback to mock session
    return {
      data: {
        session: {
          user: {
            id: 'mock-user-id',
            email: 'demo@example.com',
            user_metadata: {
              role: 'instructor'
            }
          }
        }
      }
    };
  },

  async signUp(credentials: { email: string; password: string; options?: any }) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        return await supabase.auth.signUp(credentials);
      }
    } catch (error) {
      console.log('Supabase auth not available, using mock signUp');
    }
    
    // Fallback to mock signup
    const role = credentials.options?.data?.role || 'instructor';
    return {
      data: {
        user: {
          id: 'mock-user-' + Date.now(),
          email: credentials.email,
          user_metadata: { role },
          email_confirmed_at: null
        },
        session: null
      },
      error: null
    };
  },

  async signInWithPassword(credentials: { email: string; password: string }) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        return await supabase.auth.signInWithPassword(credentials);
      }
    } catch (error) {
      console.log('Supabase auth not available, using mock signIn');
    }
    
    // Fallback to mock signin
    return {
      data: {
        user: {
          id: 'mock-user-id',
          email: credentials.email,
          user_metadata: { role: 'instructor' }
        },
        session: {
          user: {
            id: 'mock-user-id',
            email: credentials.email,
            user_metadata: { role: 'instructor' }
          }
        }
      },
      error: null
    };
  },

  async signOut() {
    // In localStorage mode, simply resolve without error
    return { error: null } as any;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    // Mock auth state change - just call with current session
    this.getSession().then(({ session }) => {
      callback('SIGNED_IN', session);
    });
    
    return {
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    };
  }
};

// Mock storage object that mimics Supabase storage
const mockStorage = {
  from(bucket: string) {
    return {
      async upload(path: string, file: File, options?: any) {
        try {
          const base64 = await fileToBase64(file);
          return {
            data: { path },
            error: null
          };
        } catch (error) {
          return {
            data: null,
            error: { message: error instanceof Error ? error.message : 'Upload failed' }
          };
        }
      },

      getPublicUrl(path: string) {
        // For localStorage, we'll return the base64 data directly
        return {
          data: { publicUrl: `data:application/octet-stream;base64,${path}` }
        };
      },

      async remove(paths: string[]) {
        return {
          data: paths,
          error: null
        };
      }
    };
  }
};

// Query builder class that mimics Supabase query structure
class QueryBuilder<T> {
  private table: string;
  private filters: Array<{ column: string; operator: string; value: any }> = [];
  private orderBy?: { column: string; ascending: boolean };
  private limitCount?: number;
  private selectColumns?: string[];
  private isSingle = false;
  private isUpsert = false;
  private isInsert = false;
  private isUpdate = false;
  private isDelete = false;
  private updateData?: any;
  private insertData?: any;
  private upsertData?: any;
  private deleteId?: string;

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string) {
    this.selectColumns = columns ? columns.split(',').map(c => c.trim()) : undefined;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  insert(data: any) {
    this.isInsert = true;
    this.insertData = data;
    return this;
  }

  update(data: any) {
    this.isUpdate = true;
    this.updateData = data;
    return this;
  }

  upsert(data: any) {
    this.isUpsert = true;
    this.upsertData = data;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  async execute() {
    // Handle insert operations
    if (this.isInsert) {
      try {
        let result;
        switch (this.table) {
          case 'resources':
            result = addResource(this.insertData);
            break;
          case 'courses':
            result = addCourse(this.insertData);
            break;
          case 'students':
            result = addStudent(this.insertData);
            break;
          case 'notifications':
            result = addNotification(this.insertData);
            break;
          case 'course_progress':
          case 'lesson_progress':
            result = updateCourseProgress(this.insertData);
            break;
          default:
            throw new Error(`Unknown table: ${this.table}`);
        }
        return { data: result, error: null };
      } catch (error) {
        return { data: null, error: { message: error instanceof Error ? error.message : 'Insert failed' } };
      }
    }

    // Handle update operations
    if (this.isUpdate) {
      try {
        const filter = this.filters.find(f => f.operator === 'eq');
        if (!filter) {
          return { data: null, error: { message: 'Update requires eq filter' } };
        }

        let result;
        switch (this.table) {
          case 'resources':
            result = updateResource(filter.value, this.updateData);
            break;
          case 'courses':
            result = updateCourse(filter.value, this.updateData);
            break;
          case 'students':
            result = updateStudent(filter.value, this.updateData);
            break;
          case 'notifications':
            result = markNotificationAsRead(filter.value);
            break;
          default:
            throw new Error(`Unknown table: ${this.table}`);
        }
        return { data: result, error: null };
      } catch (error) {
        return { data: null, error: { message: error instanceof Error ? error.message : 'Update failed' } };
      }
    }

    // Handle upsert operations
    if (this.isUpsert) {
      try {
        let result;
        switch (this.table) {
          case 'course_progress':
          case 'lesson_progress':
            result = updateCourseProgress(this.upsertData);
            break;
          default:
            // For other tables, try update first, then insert
            if (this.upsertData.id) {
              const updateResult = await this.update(this.upsertData).eq('id', this.upsertData.id).execute();
              if (updateResult.data) {
                result = updateResult.data;
              } else {
                const insertResult = await this.insert(this.upsertData).execute();
                result = insertResult.data;
              }
            } else {
              const insertResult = await this.insert(this.upsertData).execute();
              result = insertResult.data;
            }
            break;
        }
        return { data: result, error: null };
      } catch (error) {
        return { data: null, error: { message: error instanceof Error ? error.message : 'Upsert failed' } };
      }
    }

    // Handle delete operations
    if (this.isDelete) {
      try {
        const filter = this.filters.find(f => f.operator === 'eq');
        if (!filter) {
          return { data: null, error: { message: 'Delete requires eq filter' } };
        }

        let result;
        switch (this.table) {
          case 'resources':
            result = deleteResource(filter.value);
            break;
          case 'courses':
            result = deleteCourse(filter.value);
            break;
          default:
            throw new Error(`Unknown table: ${this.table}`);
        }
        return { data: result, error: null };
      } catch (error) {
        return { data: null, error: { message: error instanceof Error ? error.message : 'Delete failed' } };
      }
    }

    // Handle select operations
    let data: any[] = [];

    // Get data based on table
    switch (this.table) {
      case 'resources':
        data = getResources();
        break;
      case 'courses':
        data = getCourses();
        break;
      case 'students':
        data = getStudents();
        break;
      case 'course_progress':
        data = getCourseProgress();
        break;
      case 'lesson_progress':
        data = getCourseProgress(); // Map lesson progress to course progress
        break;
      case 'notifications':
        data = getNotifications();
        break;
      case 'xp_events':
        // XP events are derived from course progress
        data = getCourseProgress().map(p => ({
          id: `${p.studentId}-${p.courseId}-${p.moduleId}`,
          student_id: p.studentId,
          program: 'Software Development', // Default program
          reason: `Completed module in course`,
          xp: p.earnedXP,
          created_at: p.completedAt || new Date().toISOString()
        }));
        break;
      case 'modules':
        // Get modules from courses
        data = getCourses().flatMap(course => 
          course.modules?.map((module: any, index: number) => ({
            id: module.id,
            course_id: course.id,
            title: module.title,
            duration_minutes: module.time,
            position: index + 1,
            created_at: course.createdAt,
            updated_at: course.createdAt
          })) || []
        );
        break;
      case 'lessons':
        // Get lessons from course modules
        data = getCourses().flatMap(course => 
          course.modules?.flatMap((module: any, moduleIndex: number) => 
            module.resources?.map((resource: any, lessonIndex: number) => ({
              id: `${course.id}-${module.id}-${lessonIndex}`,
              module_id: module.id,
              title: resource.title || module.title,
              video_url: resource.fileOrUrl || null,
              notes: resource.description || null,
              xp_reward: module.XP || 0,
              position: lessonIndex + 1,
              weight_video: 1,
              weight_notes: 0,
              weight_quiz: 0,
              quiz: null,
              created_at: course.createdAt,
              updated_at: course.createdAt
            })) || []
          ) || []
        );
        break;
      default:
        data = [];
    }

    // Apply filters
    data = data.filter(item => {
      return this.filters.every(filter => {
        const value = item[filter.column];
        switch (filter.operator) {
          case 'eq':
            return value === filter.value;
          case 'neq':
            return value !== filter.value;
          default:
            return true;
        }
      });
    });

    // Apply ordering
    if (this.orderBy) {
      data.sort((a, b) => {
        const aVal = a[this.orderBy!.column];
        const bVal = b[this.orderBy!.column];
        if (this.orderBy!.ascending) {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    // Apply limit
    if (this.limitCount) {
      data = data.slice(0, this.limitCount);
    }

    // Apply column selection
    if (this.selectColumns) {
      data = data.map(item => {
        const selected: any = {};
        this.selectColumns!.forEach(col => {
          selected[col] = item[col];
        });
        return selected;
      });
    }

    // Handle single result
    if (this.isSingle) {
      return {
        data: data[0] || null,
        error: data.length === 0 ? { message: 'No rows found' } : null
      };
    }

    return { data, error: null };
  }
}

// Main storage adapter class
class StorageAdapter {
  auth = mockAuth;
  storage = mockStorage;

  from(table: string) {
    const queryBuilder = new QueryBuilder(table);
    
    // Add execute method to the query builder
    const execute = async () => {
      return await queryBuilder.execute();
    };
    
    // Return the query builder with execute method
    return Object.assign(queryBuilder, { execute });
  }

  // Insert operations
  async insert(data: any, options?: { table: string }) {
    const table = options?.table || 'resources';
    
    try {
      let result;
      switch (table) {
        case 'resources':
          result = addResource(data);
          // Create notification
          addNotification({
            program: data.program,
            type: 'resource',
            title: `New Resource: ${data.title}`
          });
          break;
        case 'courses':
          result = addCourse(data);
          // Create notification
          addNotification({
            program: data.program,
            type: 'course',
            title: `New Course: ${data.title}`
          });
          break;
        case 'students':
          result = addStudent(data);
          break;
        case 'course_progress':
        case 'lesson_progress':
          result = updateCourseProgress(data);
          break;
        case 'notifications':
          result = addNotification(data);
          break;
        case 'xp_events':
          // XP events are handled through course progress
          result = { id: generateId(), ...data };
          break;
        default:
          throw new Error(`Unknown table: ${table}`);
      }

      return {
        data: result,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Insert failed' }
      };
    }
  }

  // Update operations
  async update(data: any, options?: { table: string; id: string }) {
    const table = options?.table || 'resources';
    const id = options?.id;
    
    if (!id) {
      return {
        data: null,
        error: { message: 'ID is required for update' }
      };
    }

    try {
      let result;
      switch (table) {
        case 'resources':
          result = updateResource(id, data);
          break;
        case 'courses':
          result = updateCourse(id, data);
          break;
        case 'students':
          result = updateStudent(id, data);
          break;
        case 'notifications':
          result = markNotificationAsRead(id);
          break;
        default:
          throw new Error(`Unknown table: ${table}`);
      }

      return {
        data: result,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Update failed' }
      };
    }
  }

  // Delete operations
  async delete(options?: { table: string; id: string }) {
    const table = options?.table || 'resources';
    const id = options?.id;
    
    if (!id) {
      return {
        data: null,
        error: { message: 'ID is required for delete' }
      };
    }

    try {
      let result;
      switch (table) {
        case 'resources':
          result = deleteResource(id);
          break;
        case 'courses':
          result = deleteCourse(id);
          break;
        default:
          throw new Error(`Unknown table: ${table}`);
      }

      return {
        data: result,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Delete failed' }
      };
    }
  }

  // Upsert operations
  async upsert(data: any, options?: { table: string }) {
    const table = options?.table || 'resources';
    
    try {
      let result;
      switch (table) {
        case 'course_progress':
        case 'lesson_progress':
          result = updateCourseProgress(data);
          break;
        default:
          // For other tables, try update first, then insert
          if (data.id) {
            const updateResult = await this.update(data, { table, id: data.id });
            if (updateResult.data) {
              result = updateResult.data;
            } else {
              const insertResult = await this.insert(data, { table });
              result = insertResult.data;
            }
          } else {
            const insertResult = await this.insert(data, { table });
            result = insertResult.data;
          }
          break;
      }

      return {
        data: result,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Upsert failed' }
      };
    }
  }

  // Real-time subscriptions
  channel(name: string) {
    return {
      on(event: string, filter: any, callback: Function) {
        // Listen for storage events
        const eventName = `${filter.table}_updated`;
        storageEvents.on(eventName, callback);
        
        return {
          subscribe: () => {
            // Return unsubscribe function
            return () => {
              storageEvents.off(eventName, callback);
            };
          }
        };
      }
    };
  }

  removeChannel(channel: any) {
    // Channel cleanup is handled by the unsubscribe function
  }
}

// Utility function for generating IDs
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Create and export the storage adapter instance
export const storageAdapter = new StorageAdapter();

// Export the adapter as the default export to match Supabase import pattern
export default storageAdapter;
