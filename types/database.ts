// Generated from the live Supabase schema — do not edit by hand.
// Regenerate after any migration (Supabase CLI: `supabase gen types typescript`).

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
      custom_foods: {
        Row: {
          barcode: string | null
          brand: string | null
          calories: number
          carbs: number
          created_at: string
          fat: number
          id: string
          name: string
          protein: number
          serving_description: string | null
          serving_size: number
          user_id: string
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          calories: number
          carbs?: number
          created_at?: string
          fat?: number
          id?: string
          name: string
          protein?: number
          serving_description?: string | null
          serving_size: number
          user_id: string
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          id?: string
          name?: string
          protein?: number
          serving_description?: string | null
          serving_size?: number
          user_id?: string
        }
        Relationships: []
      }
      fatsecret_food_cache: {
        Row: {
          fetched_at: string
          food_id: string
          payload: Json
        }
        Insert: {
          fetched_at?: string
          food_id: string
          payload: Json
        }
        Update: {
          fetched_at?: string
          food_id?: string
          payload?: Json
        }
        Relationships: []
      }
      meal_items: {
        Row: {
          amount_unit: string
          brand: string | null
          calories: number | null
          carbs: number | null
          created_at: string
          external_food_id: string | null
          external_serving_id: string | null
          fat: number | null
          food_name: string | null
          grams: number | null
          id: string
          is_estimate: boolean
          meal_id: string
          protein: number | null
          servings: number
          source: string
          user_id: string
        }
        Insert: {
          amount_unit?: string
          brand?: string | null
          calories?: number | null
          carbs?: number | null
          created_at?: string
          external_food_id?: string | null
          external_serving_id?: string | null
          fat?: number | null
          food_name?: string | null
          grams?: number | null
          id?: string
          is_estimate?: boolean
          meal_id: string
          protein?: number | null
          servings?: number
          source: string
          user_id: string
        }
        Update: {
          amount_unit?: string
          brand?: string | null
          calories?: number | null
          carbs?: number | null
          created_at?: string
          external_food_id?: string | null
          external_serving_id?: string | null
          fat?: number | null
          food_name?: string | null
          grams?: number | null
          id?: string
          is_estimate?: boolean
          meal_id?: string
          protein?: number | null
          servings?: number
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_items_meal_id_user_id_fkey"
            columns: ["meal_id", "user_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string
          eaten_at: string
          id: string
          meal_type: string
          name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          eaten_at?: string
          id?: string
          meal_type: string
          name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          eaten_at?: string
          id?: string
          meal_type?: string
          name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nutrition_goals: {
        Row: {
          calorie_goal: number
          carbs_goal: number
          created_at: string
          fat_goal: number
          id: string
          protein_goal: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calorie_goal: number
          carbs_goal: number
          created_at?: string
          fat_goal: number
          id?: string
          protein_goal: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calorie_goal?: number
          carbs_goal?: number
          created_at?: string
          fat_goal?: number
          id?: string
          protein_goal?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          avatar_url: string | null
          birth_year: number | null
          created_at: string
          display_name: string | null
          height_cm: number | null
          id: string
          onboarding_completed_at: string | null
          sex: string | null
          updated_at: string
          weight_goal: string | null
        }
        Insert: {
          activity_level?: string | null
          avatar_url?: string | null
          birth_year?: number | null
          created_at?: string
          display_name?: string | null
          height_cm?: number | null
          id: string
          onboarding_completed_at?: string | null
          sex?: string | null
          updated_at?: string
          weight_goal?: string | null
        }
        Update: {
          activity_level?: string | null
          avatar_url?: string | null
          birth_year?: number | null
          created_at?: string
          display_name?: string | null
          height_cm?: number | null
          id?: string
          onboarding_completed_at?: string | null
          sex?: string | null
          updated_at?: string
          weight_goal?: string | null
        }
        Relationships: []
      }
      saved_meal_items: {
        Row: {
          amount_unit: string
          brand: string | null
          calories: number | null
          carbs: number | null
          created_at: string
          external_food_id: string | null
          external_serving_id: string | null
          fat: number | null
          food_name: string | null
          grams: number | null
          id: string
          is_estimate: boolean
          protein: number | null
          saved_meal_id: string
          servings: number
          source: string
          user_id: string
        }
        Insert: {
          amount_unit?: string
          brand?: string | null
          calories?: number | null
          carbs?: number | null
          created_at?: string
          external_food_id?: string | null
          external_serving_id?: string | null
          fat?: number | null
          food_name?: string | null
          grams?: number | null
          id?: string
          is_estimate?: boolean
          protein?: number | null
          saved_meal_id: string
          servings?: number
          source: string
          user_id: string
        }
        Update: {
          amount_unit?: string
          brand?: string | null
          calories?: number | null
          carbs?: number | null
          created_at?: string
          external_food_id?: string | null
          external_serving_id?: string | null
          fat?: number | null
          food_name?: string | null
          grams?: number | null
          id?: string
          is_estimate?: boolean
          protein?: number | null
          saved_meal_id?: string
          servings?: number
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_meal_items_saved_meal_id_user_id_fkey"
            columns: ["saved_meal_id", "user_id"]
            isOneToOne: false
            referencedRelation: "saved_meals"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      saved_meals: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_entries: {
        Row: {
          created_at: string
          id: string
          recorded_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          recorded_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          recorded_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_onboarding: {
        Args: {
          p_activity_level: string
          p_birth_year: number
          p_calorie_goal: number
          p_carbs_goal: number
          p_display_name?: string
          p_fat_goal: number
          p_height_cm: number
          p_protein_goal: number
          p_sex: string
          p_weight_goal: string
          p_weight_kg: number
        }
        Returns: undefined
      }
      delete_my_account: { Args: never; Returns: undefined }
      log_meal: {
        Args: {
          p_eaten_at: string
          p_items: Json
          p_meal_type: string
          p_name?: string
        }
        Returns: string
      }
      move_meal_item: {
        Args: { p_item_id: string; p_meal_type: string }
        Returns: string
      }
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
