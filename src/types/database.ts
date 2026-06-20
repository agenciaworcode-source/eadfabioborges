export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          deadline: string | null
          id: string
          instructions: string | null
          lesson_id: string
          title: string
        }
        Insert: {
          deadline?: string | null
          id?: string
          instructions?: string | null
          lesson_id: string
          title: string
        }
        Update: {
          deadline?: string | null
          id?: string
          instructions?: string | null
          lesson_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          course_id: string
          id: string
          issued_at: string
          pdf_url: string | null
          user_id: string
          verified: boolean
        }
        Insert: {
          course_id: string
          id?: string
          issued_at?: string
          pdf_url?: string | null
          user_id: string
          verified?: boolean
        }
        Update: {
          course_id?: string
          id?: string
          issued_at?: string
          pdf_url?: string | null
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          access_days: number | null
          access_type: string
          certificate_enabled: boolean
          created_at: string
          description: string | null
          id: string
          intro_video_url: string | null
          is_vip: boolean
          level: string
          category: string | null
          max_students: number
          price: number | null
          published: boolean
          requirements: string[]
          slug: string
          tags: string[]
          target_audience: string | null
          thumbnail_url: string | null
          title: string
          what_you_learn: string[]
        }
        Insert: {
          access_days?: number | null
          access_type?: string
          certificate_enabled?: boolean
          created_at?: string
          description?: string | null
          id?: string
          intro_video_url?: string | null
          is_vip?: boolean
          level?: string
          category?: string | null
          max_students?: number
          price?: number | null
          published?: boolean
          requirements?: string[]
          slug: string
          tags?: string[]
          target_audience?: string | null
          thumbnail_url?: string | null
          title: string
          what_you_learn?: string[]
        }
        Update: {
          access_days?: number | null
          access_type?: string
          certificate_enabled?: boolean
          created_at?: string
          description?: string | null
          id?: string
          intro_video_url?: string | null
          is_vip?: boolean
          level?: string
          category?: string | null
          max_students?: number
          price?: number | null
          published?: boolean
          requirements?: string[]
          slug?: string
          tags?: string[]
          target_audience?: string | null
          thumbnail_url?: string | null
          title?: string
          what_you_learn?: string[]
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          expires_at: string | null
          id: string
          status: Database["public"]["Enums"]["enrollment_status"]
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean
          id: string
          lesson_id: string
          resume_position_secs: number
          updated_at: string
          user_id: string
          watched_secs: number
        }
        Insert: {
          completed?: boolean
          id?: string
          lesson_id: string
          resume_position_secs?: number
          updated_at?: string
          user_id: string
          watched_secs?: number
        }
        Update: {
          completed?: boolean
          id?: string
          lesson_id?: string
          resume_position_secs?: number
          updated_at?: string
          user_id?: string
          watched_secs?: number
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
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          attachments: Json | null
          completion_percent: number
          content_body: string | null
          duration_secs: number | null
          embed_url: string | null
          id: string
          is_free_preview: boolean
          module_id: string
          order: number
          pdf_url: string | null
          title: string
          type: Database["public"]["Enums"]["lesson_type"]
          video_thumbnail_url: string | null
          vimeo_id: string | null
          youtube_url: string | null
        }
        Insert: {
          attachments?: Json | null
          completion_percent?: number
          content_body?: string | null
          duration_secs?: number | null
          embed_url?: string | null
          id?: string
          is_free_preview?: boolean
          module_id: string
          order?: number
          pdf_url?: string | null
          title: string
          type?: Database["public"]["Enums"]["lesson_type"]
          video_thumbnail_url?: string | null
          vimeo_id?: string | null
          youtube_url?: string | null
        }
        Update: {
          attachments?: Json | null
          completion_percent?: number
          content_body?: string | null
          duration_secs?: number | null
          embed_url?: string | null
          id?: string
          is_free_preview?: boolean
          module_id?: string
          order?: number
          pdf_url?: string | null
          title?: string
          type?: Database["public"]["Enums"]["lesson_type"]
          video_thumbnail_url?: string | null
          vimeo_id?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          description: string | null
          id: string
          is_free_preview: boolean
          order: number
          title: string
        }
        Insert: {
          course_id: string
          description?: string | null
          id?: string
          is_free_preview?: boolean
          order?: number
          title: string
        }
        Update: {
          course_id?: string
          description?: string | null
          id?: string
          is_free_preview?: boolean
          order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          id: string
          is_active: boolean
          name: string
          price_annual: number
          price_monthly: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          id: string
          is_active?: boolean
          name: string
          price_annual?: number
          price_monthly?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
          price_annual?: number
          price_monthly?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          body: string
          correct_answer: string | null
          id: string
          options: Json | null
          question_order: number
          quiz_id: string
          type: Database["public"]["Enums"]["question_type"]
        }
        Insert: {
          body: string
          correct_answer?: string | null
          id?: string
          options?: Json | null
          question_order?: number
          quiz_id: string
          type?: Database["public"]["Enums"]["question_type"]
        }
        Update: {
          body?: string
          correct_answer?: string | null
          id?: string
          options?: Json | null
          question_order?: number
          quiz_id?: string
          type?: Database["public"]["Enums"]["question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          created_at: string
          id: string
          passed: boolean
          quiz_id: string
          score: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          created_at?: string
          id?: string
          passed?: boolean
          quiz_id: string
          score?: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          created_at?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          attempts_allowed: number
          course_id: string | null
          feedback_mode: string
          id: string
          lesson_id: string | null
          max_questions_shown: number
          pass_score: number
          randomize_questions: boolean
          scope: string
          time_limit_secs: number
          title: string
        }
        Insert: {
          attempts_allowed?: number
          course_id?: string | null
          feedback_mode?: string
          id?: string
          lesson_id?: string | null
          max_questions_shown?: number
          pass_score?: number
          randomize_questions?: boolean
          scope?: string
          time_limit_secs?: number
          title: string
        }
        Update: {
          attempts_allowed?: number
          course_id?: string | null
          feedback_mode?: string
          id?: string
          lesson_id?: string | null
          max_questions_shown?: number
          pass_score?: number
          randomize_questions?: boolean
          scope?: string
          time_limit_secs?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          assignment_id: string
          created_at: string
          feedback: string | null
          file_url: string | null
          grade: number | null
          graded_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          grade?: number | null
          graded_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          grade?: number | null
          graded_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          grace_period_end: string | null
          id: string
          mp_payment_id: string | null
          period_end: string | null
          period_start: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_sub_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          grace_period_end?: string | null
          id?: string
          mp_payment_id?: string | null
          period_end?: string | null
          period_start?: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_sub_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          grace_period_end?: string | null
          id?: string
          mp_payment_id?: string | null
          period_end?: string | null
          period_start?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_sub_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string
          id: string
          name: string
          plan: string
          role: string
          specialty: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          plan?: string
          role?: string
          specialty?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          plan?: string
          role?: string
          specialty?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_lesson_access: { Args: { p_lesson_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      enrollment_status: "active" | "completed" | "cancelled" | "expired"
      lesson_type: "video" | "text" | "pdf" | "embed"
      question_type: "multiple_choice" | "true_false" | "open" | "fill_in_blanks" | "short_answer" | "matching" | "ordering" | "image_choice"
      subscription_plan: "monthly" | "annual" | "lifetime"
      subscription_status: "active" | "past_due" | "cancelled" | "trialing"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      enrollment_status: ["active", "completed", "cancelled", "expired"],
      lesson_type: ["video", "text", "pdf", "embed"],
      question_type: ["multiple_choice", "true_false", "open", "fill_in_blanks", "short_answer", "matching", "ordering", "image_choice"],
      subscription_plan: ["monthly", "annual", "lifetime"],
      subscription_status: ["active", "past_due", "cancelled", "trialing"],
    },
  },
} as const
