export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_devices: {
        Row: {
          browser_label: string
          clerk_user_id: string
          created_at: string
          device_hash: string
          id: string
          last_seen: string
          platform_label: string
          updated_at: string
        }
        Insert: {
          browser_label?: string
          clerk_user_id: string
          created_at?: string
          device_hash: string
          id?: string
          last_seen?: string
          platform_label?: string
          updated_at?: string
        }
        Update: {
          browser_label?: string
          clerk_user_id?: string
          created_at?: string
          device_hash?: string
          id?: string
          last_seen?: string
          platform_label?: string
          updated_at?: string
        }
        Relationships: []
      }
      account_link_codes: {
        Row: {
          clerk_user_id: string
          code: string
          created_at: string
          device_hash: string
          email: string
          id: string
          linked_at: string | null
          telegram_user_id: number | null
          updated_at: string
        }
        Insert: {
          clerk_user_id: string
          code: string
          created_at?: string
          device_hash: string
          email?: string
          id?: string
          linked_at?: string | null
          telegram_user_id?: number | null
          updated_at?: string
        }
        Update: {
          clerk_user_id?: string
          code?: string
          created_at?: string
          device_hash?: string
          email?: string
          id?: string
          linked_at?: string | null
          telegram_user_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      account_sessions: {
        Row: {
          clerk_user_id: string
          created_at: string
          device_hash: string
          expires_at: string
          id: string
          last_seen: string
          session_hash: string
          status: string
          updated_at: string
        }
        Insert: {
          clerk_user_id: string
          created_at?: string
          device_hash: string
          expires_at: string
          id?: string
          last_seen?: string
          session_hash: string
          status?: string
          updated_at?: string
        }
        Update: {
          clerk_user_id?: string
          created_at?: string
          device_hash?: string
          expires_at?: string
          id?: string
          last_seen?: string
          session_hash?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_entitlements: {
        Row: {
          clerk_user_id: string
          course_id: string
          created_at: string
          expires_at: string | null
          id: string
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          clerk_user_id: string
          course_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          clerk_user_id?: string
          course_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_entitlements_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          cover_key: string
          created_at: string
          doctor_ar: string
          doctor_en: string
          id: string
          is_popular: boolean
          module_id: string | null
          sort_order: number
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          cover_key?: string
          created_at?: string
          doctor_ar?: string
          doctor_en?: string
          id?: string
          is_popular?: boolean
          module_id?: string | null
          sort_order?: number
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          cover_key?: string
          created_at?: string
          doctor_ar?: string
          doctor_en?: string
          id?: string
          is_popular?: boolean
          module_id?: string | null
          sort_order?: number
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          accent: string
          code: string
          created_at: string
          id: string
          name_ar: string
          name_en: string
          sort_order: number
          university_id: string
          updated_at: string
        }
        Insert: {
          accent?: string
          code: string
          created_at?: string
          id?: string
          name_ar: string
          name_en: string
          sort_order?: number
          university_id: string
          updated_at?: string
        }
        Update: {
          accent?: string
          code?: string
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
          sort_order?: number
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_assets: {
        Row: {
          asset_type: string
          byte_size: number | null
          created_at: string
          id: string
          is_active: boolean
          lesson_id: string
          mime_type: string
          storage_bucket: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          asset_type: string
          byte_size?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          lesson_id: string
          mime_type: string
          storage_bucket?: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          asset_type?: string
          byte_size?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          lesson_id?: string
          mime_type?: string
          storage_bucket?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_assets_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_contents: {
        Row: {
          created_at: string
          lesson_id: string
          summary_ar: string
          summary_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          lesson_id: string
          summary_ar?: string
          summary_en?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          lesson_id?: string
          summary_ar?: string
          summary_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_contents_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          course_id: string
          created_at: string
          id: string
          sort_order: number
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          sort_order?: number
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          accent: string
          code: string
          created_at: string
          department_id: string
          id: string
          name_ar: string
          name_en: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          accent?: string
          code: string
          created_at?: string
          department_id: string
          id?: string
          name_ar: string
          name_en: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          accent?: string
          code?: string
          created_at?: string
          department_id?: string
          id?: string
          name_ar?: string
          name_en?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      playback_grants: {
        Row: {
          asset_id: string
          clerk_user_id: string
          created_at: string
          device_hash: string
          expires_at: string
          id: string
          lesson_id: string
          revoked_at: string | null
          token_hash: string
          ua_hash: string
        }
        Insert: {
          asset_id: string
          clerk_user_id: string
          created_at?: string
          device_hash: string
          expires_at: string
          id?: string
          lesson_id: string
          revoked_at?: string | null
          token_hash: string
          ua_hash?: string
        }
        Update: {
          asset_id?: string
          clerk_user_id?: string
          created_at?: string
          device_hash?: string
          expires_at?: string
          id?: string
          lesson_id?: string
          revoked_at?: string | null
          token_hash?: string
          ua_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "playback_grants_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "lesson_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playback_grants_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      playback_sessions: {
        Row: {
          asset_id: string
          clerk_user_id: string
          created_at: string
          device_hash: string
          expires_at: string
          id: string
          last_seen: string
          lesson_id: string
          session_hash: string
          status: string
          updated_at: string
        }
        Insert: {
          asset_id: string
          clerk_user_id: string
          created_at?: string
          device_hash: string
          expires_at: string
          id?: string
          last_seen?: string
          lesson_id: string
          session_hash: string
          status?: string
          updated_at?: string
        }
        Update: {
          asset_id?: string
          clerk_user_id?: string
          created_at?: string
          device_hash?: string
          expires_at?: string
          id?: string
          last_seen?: string
          lesson_id?: string
          session_hash?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playback_sessions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "lesson_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playback_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          dark_mode: boolean
          display_name: string
          preferred_language: string
          university_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          dark_mode?: boolean
          display_name?: string
          preferred_language?: string
          university_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          dark_mode?: boolean
          display_name?: string
          preferred_language?: string
          university_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          clerk_user_id: string | null
          created_at: string
          device_hash: string | null
          event_type: string
          id: string
          metadata: Json
          severity: string
        }
        Insert: {
          clerk_user_id?: string | null
          created_at?: string
          device_hash?: string | null
          event_type: string
          id?: string
          metadata?: Json
          severity?: string
        }
        Update: {
          clerk_user_id?: string | null
          created_at?: string
          device_hash?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          severity?: string
        }
        Relationships: []
      }
      sms_catalog: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          platform: string
          price_override: number | null
          provider_service_id: number
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          platform: string
          price_override?: number | null
          provider_service_id: number
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          platform?: string
          price_override?: number | null
          provider_service_id?: number
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sms_orders: {
        Row: {
          category: string | null
          charge: number
          created_at: string
          error: string | null
          id: string
          link: string
          provider_order_id: string | null
          quantity: number
          remains: number | null
          service_id: number
          service_name: string
          start_count: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          charge: number
          created_at?: string
          error?: string | null
          id?: string
          link: string
          provider_order_id?: string | null
          quantity: number
          remains?: number | null
          service_id: number
          service_name: string
          start_count?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          charge?: number
          created_at?: string
          error?: string | null
          id?: string
          link?: string
          provider_order_id?: string | null
          quantity?: number
          remains?: number | null
          service_id?: number
          service_name?: string
          start_count?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "sms_users"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_services: {
        Row: {
          cancel: boolean
          category: string
          created_at: string
          is_active: boolean
          max_quantity: number
          min_quantity: number
          name: string
          rate: number
          refill: boolean
          service_id: number
          synced_at: string
          type: string
          updated_at: string
        }
        Insert: {
          cancel?: boolean
          category?: string
          created_at?: string
          is_active?: boolean
          max_quantity?: number
          min_quantity?: number
          name: string
          rate?: number
          refill?: boolean
          service_id: number
          synced_at?: string
          type?: string
          updated_at?: string
        }
        Update: {
          cancel?: boolean
          category?: string
          created_at?: string
          is_active?: boolean
          max_quantity?: number
          min_quantity?: number
          name?: string
          rate?: number
          refill?: boolean
          service_id?: number
          synced_at?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      sms_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          meta: Json
          reference: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          meta?: Json
          reference?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          meta?: Json
          reference?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "sms_users"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_users: {
        Row: {
          auth_user_id: string | null
          balance: number
          clerk_user_id: string | null
          created_at: string
          email: string | null
          guest_token: string | null
          id: string
          is_guest: boolean
          name: string | null
          phone: string | null
          phone_verified_at: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          balance?: number
          clerk_user_id?: string | null
          created_at?: string
          email?: string | null
          guest_token?: string | null
          id?: string
          is_guest?: boolean
          name?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          balance?: number
          clerk_user_id?: string | null
          created_at?: string
          email?: string | null
          guest_token?: string | null
          id?: string
          is_guest?: boolean
          name?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sms_whatsapp_verifications: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          sms_user_id: string | null
          status: string
          verified_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          phone: string
          sms_user_id?: string | null
          status?: string
          verified_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          sms_user_id?: string | null
          status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_whatsapp_verifications_sms_user_id_fkey"
            columns: ["sms_user_id"]
            isOneToOne: false
            referencedRelation: "sms_users"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_devices: {
        Row: {
          app_version: string
          created_at: string
          device_hash: string
          first_name: string
          first_seen: string
          id: string
          last_seen: string
          platform: string
          telegram_user_id: number
          updated_at: string
          username: string
          verified: boolean
        }
        Insert: {
          app_version?: string
          created_at?: string
          device_hash: string
          first_name?: string
          first_seen?: string
          id?: string
          last_seen?: string
          platform?: string
          telegram_user_id: number
          updated_at?: string
          username?: string
          verified?: boolean
        }
        Update: {
          app_version?: string
          created_at?: string
          device_hash?: string
          first_name?: string
          first_seen?: string
          id?: string
          last_seen?: string
          platform?: string
          telegram_user_id?: number
          updated_at?: string
          username?: string
          verified?: boolean
        }
        Relationships: []
      }
      telegram_lesson_media: {
        Row: {
          caption: string
          created_at: string
          duration_seconds: number
          file_id: string
          id: string
          is_active: boolean
          lesson_id: string
          updated_at: string
        }
        Insert: {
          caption?: string
          created_at?: string
          duration_seconds?: number
          file_id: string
          id?: string
          is_active?: boolean
          lesson_id: string
          updated_at?: string
        }
        Update: {
          caption?: string
          created_at?: string
          duration_seconds?: number
          file_id?: string
          id?: string
          is_active?: boolean
          lesson_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_lesson_media_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_sent_videos: {
        Row: {
          chat_id: number
          created_at: string
          delete_at: string
          deleted_at: string | null
          id: string
          lesson_id: string | null
          message_id: number
        }
        Insert: {
          chat_id: number
          created_at?: string
          delete_at: string
          deleted_at?: string | null
          id?: string
          lesson_id?: string | null
          message_id: number
        }
        Update: {
          chat_id?: number
          created_at?: string
          delete_at?: string
          deleted_at?: string | null
          id?: string
          lesson_id?: string | null
          message_id?: number
        }
        Relationships: []
      }
      telegram_subscriptions: {
        Row: {
          clerk_user_id: string | null
          course_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          module_id: string | null
          status: string
          telegram_user_id: number
          updated_at: string
        }
        Insert: {
          clerk_user_id?: string | null
          course_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          module_id?: string | null
          status?: string
          telegram_user_id: number
          updated_at?: string
        }
        Update: {
          clerk_user_id?: string | null
          course_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          module_id?: string | null
          status?: string
          telegram_user_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_subscriptions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telegram_subscriptions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          code: string
          created_at: string
          id: string
          name_ar: string
          name_en: string
          sort_order: number
          tagline_ar: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name_ar: string
          name_en: string
          sort_order?: number
          tagline_ar?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
          sort_order?: number
          tagline_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_clerk_user_id: { Args: never; Returns: string }
      current_user_id: { Args: never; Returns: string }
      sms_credit_deposit: { Args: { _reference: string }; Returns: Json }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
