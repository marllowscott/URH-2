export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      course_progress: {
        Row: {
          course_id: string
          progress_percent: number
          student_id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          progress_percent?: number
          student_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          progress_percent?: number
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      courses: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration: string | null
          expiry_date: string | null
          id: string
          program: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: string | null
          expiry_date?: string | null
          id?: string
          program: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: string | null
          expiry_date?: string | null
          id?: string
          program?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      lesson_progress: {
        Row: {
          completed_notes: boolean
          completed_quiz: boolean
          completed_video: boolean
          lesson_id: string
          progress_percent: number
          student_id: string
          updated_at: string
        }
        Insert: {
          completed_notes?: boolean
          completed_quiz?: boolean
          completed_video?: boolean
          lesson_id: string
          progress_percent?: number
          student_id: string
          updated_at?: string
        }
        Update: {
          completed_notes?: boolean
          completed_quiz?: boolean
          completed_video?: boolean
          lesson_id?: string
          progress_percent?: number
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      lessons: {
        Row: {
          created_at: string
          id: string
          module_id: string
          notes: string | null
          position: number
          quiz: Json | null
          title: string
          updated_at: string
          video_url: string | null
          weight_notes: number
          weight_quiz: number
          weight_video: number
          xp_reward: number
        }
        Insert: {
          created_at?: string
          id?: string
          module_id: string
          notes?: string | null
          position?: number
          quiz?: Json | null
          title: string
          updated_at?: string
          video_url?: string | null
          weight_notes?: number
          weight_quiz?: number
          weight_video?: number
          xp_reward?: number
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string
          notes?: string | null
          position?: number
          quiz?: Json | null
          title?: string
          updated_at?: string
          video_url?: string | null
          weight_notes?: number
          weight_quiz?: number
          weight_video?: number
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          }
        ]
      }
      modules: {
        Row: {
          created_at: string
          expiry_date: string | null
          file_path: string | null
          id: string
          position: number
          resource_url: string | null
          time_limit_minutes: number | null
          title: string
          updated_at: string
          course_id: string
          duration_minutes: number
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          file_path?: string | null
          id?: string
          position?: number
          resource_url?: string | null
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
          course_id: string
          duration_minutes?: number
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          file_path?: string | null
          id?: string
          position?: number
          resource_url?: string | null
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
          course_id?: string
          duration_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          program: string | null
          read: boolean
          student_id: string | null
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          program?: string | null
          read?: boolean
          student_id?: string | null
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          program?: string | null
          read?: boolean
          student_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      resources: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          expiry_date: string | null
          file_path: string | null
          id: string
          program: string
          title: string
          type: string
          url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          expiry_date?: string | null
          file_path?: string | null
          id?: string
          program: string
          title: string
          type: string
          url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          expiry_date?: string | null
          file_path?: string | null
          id?: string
          program?: string
          title?: string
          type?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      streaks: {
        Row: {
          current_streak: number
          last_active_date: string | null
          longest_streak: number
          student_id: string
        }
        Insert: {
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          student_id: string
        }
        Update: {
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streaks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      submissions: {
        Row: {
          answers: Json | null
          content_url: string | null
          course_id: string | null
          created_at: string
          graded_at: string | null
          id: string
          lesson_id: string | null
          score: number | null
          status: string
          student_id: string
          task_id: string | null
        }
        Insert: {
          answers?: Json | null
          content_url?: string | null
          course_id?: string | null
          created_at?: string
          graded_at?: string | null
          id?: string
          lesson_id?: string | null
          score?: number | null
          status?: string
          student_id: string
          task_id?: string | null
        }
        Update: {
          answers?: Json | null
          content_url?: string | null
          course_id?: string | null
          created_at?: string
          graded_at?: string | null
          id?: string
          lesson_id?: string | null
          score?: number | null
          status?: string
          student_id?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      task_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          student_id: string
          task_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          student_id: string
          task_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          student_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          attachment_path: string | null
          attachment_url: string | null
          course_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          program: string
          schedule: string
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          attachment_path?: string | null
          attachment_url?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          program: string
          schedule: string
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          attachment_path?: string | null
          attachment_url?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          program?: string
          schedule?: string
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      xp_events: {
        Row: {
          created_at: string
          id: string
          program: string | null
          reason: string
          student_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          id?: string
          program?: string | null
          reason: string
          student_id: string
          xp: number
        }
        Update: {
          created_at?: string
          id?: string
          program?: string | null
          reason?: string
          student_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
