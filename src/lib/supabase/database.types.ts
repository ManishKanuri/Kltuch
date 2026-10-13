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
    PostgrestVersion: "14.18"
  }
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
      assessments: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          ratings: Json
          student_name: string
          term: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date: string
          id?: string
          ratings: Json
          student_name: string
          term: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          ratings?: Json
          student_name?: string
          term?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          class_name: string
          coach_id: string
          created_at: string
          id: string
          school_id: string
          section: string
          sport: Database["public"]["Enums"]["sport"]
          updated_at: string
        }
        Insert: {
          class_name: string
          coach_id: string
          created_at?: string
          id?: string
          school_id: string
          section: string
          sport: Database["public"]["Enums"]["sport"]
          updated_at?: string
        }
        Update: {
          class_name?: string
          coach_id?: string
          created_at?: string
          id?: string
          school_id?: string
          section?: string
          sport?: Database["public"]["Enums"]["sport"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          assigned_school_id: string
          created_at: string
          id: string
          name: string
          phone: string
          rating: number
          status: Database["public"]["Enums"]["coach_status"]
          updated_at: string
        }
        Insert: {
          assigned_school_id: string
          created_at?: string
          id?: string
          name: string
          phone: string
          rating?: number
          status?: Database["public"]["Enums"]["coach_status"]
          updated_at?: string
        }
        Update: {
          assigned_school_id?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string
          rating?: number
          status?: Database["public"]["Enums"]["coach_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaches_assigned_school_id_fkey"
            columns: ["assigned_school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fitness_assessments: {
        Row: {
          age: number
          attendance_rate: number
          bmi: number
          class_name: string
          created_at: string
          curls: number
          date: string
          gender: Database["public"]["Enums"]["gender"]
          grade: number
          height_cm: number
          id: string
          push_ups: number
          school_id: string
          section: Database["public"]["Enums"]["fitness_section"]
          sessions_finished: number
          sessions_missed: number
          sessions_scheduled: number
          speed_50m_seconds: number
          stamina_600m_seconds: number
          student_id: string
          student_name: string
          toe_touch_cm: number
          updated_at: string
          weight_kg: number
        }
        Insert: {
          age: number
          attendance_rate: number
          bmi: number
          class_name: string
          created_at?: string
          curls: number
          date: string
          gender: Database["public"]["Enums"]["gender"]
          grade: number
          height_cm: number
          id?: string
          push_ups: number
          school_id: string
          section: Database["public"]["Enums"]["fitness_section"]
          sessions_finished?: number
          sessions_missed?: number
          sessions_scheduled?: number
          speed_50m_seconds: number
          stamina_600m_seconds: number
          student_id: string
          student_name: string
          toe_touch_cm: number
          updated_at?: string
          weight_kg: number
        }
        Update: {
          age?: number
          attendance_rate?: number
          bmi?: number
          class_name?: string
          created_at?: string
          curls?: number
          date?: string
          gender?: Database["public"]["Enums"]["gender"]
          grade?: number
          height_cm?: number
          id?: string
          push_ups?: number
          school_id?: string
          section?: Database["public"]["Enums"]["fitness_section"]
          sessions_finished?: number
          sessions_missed?: number
          sessions_scheduled?: number
          speed_50m_seconds?: number
          stamina_600m_seconds?: number
          student_id?: string
          student_name?: string
          toe_touch_cm?: number
          updated_at?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "fitness_assessments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          coach_id: string | null
          created_at: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["role"]
          school_id: string | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role: Database["public"]["Enums"]["role"]
          school_id?: string | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["role"]
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string
          contact_person: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          address: string
          contact_person: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          address?: string
          contact_person?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      coach_status: "Active" | "Inactive"
      fitness_section: "A" | "B" | "C"
      gender: "Female" | "Male"
      role: "admin" | "coach" | "school"
      sport: "Football" | "Basketball" | "Tennis"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      coach_status: ["Active", "Inactive"],
      fitness_section: ["A", "B", "C"],
      gender: ["Female", "Male"],
      role: ["admin", "coach", "school"],
      sport: ["Football", "Basketball", "Tennis"],
    },
  },
} as const
