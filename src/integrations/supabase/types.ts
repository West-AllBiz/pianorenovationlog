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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action_description: string
          changed_field: string | null
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          piano_id: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action_description: string
          changed_field?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          piano_id?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action_description?: string
          changed_field?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          piano_id?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_piano_id_fkey"
            columns: ["piano_id"]
            isOneToOne: false
            referencedRelation: "pianos"
            referencedColumns: ["id"]
          },
        ]
      }
      character_notes: {
        Row: {
          action_feel: string[] | null
          cabinet_character: string[] | null
          created_at: string
          custom_shop_notes: string | null
          id: string
          musical_suitability: string[] | null
          piano_id: string
          tonal_character: string[] | null
          updated_at: string
        }
        Insert: {
          action_feel?: string[] | null
          cabinet_character?: string[] | null
          created_at?: string
          custom_shop_notes?: string | null
          id?: string
          musical_suitability?: string[] | null
          piano_id: string
          tonal_character?: string[] | null
          updated_at?: string
        }
        Update: {
          action_feel?: string[] | null
          cabinet_character?: string[] | null
          created_at?: string
          custom_shop_notes?: string | null
          id?: string
          musical_suitability?: string[] | null
          piano_id?: string
          tonal_character?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_notes_piano_id_fkey"
            columns: ["piano_id"]
            isOneToOne: true
            referencedRelation: "pianos"
            referencedColumns: ["id"]
          },
        ]
      }
      client_records: {
        Row: {
          balance_due: number | null
          client_contact: string | null
          client_name: string
          created_at: string
          deposit_received: number | null
          estimate: number | null
          id: string
          invoice_total: number | null
          labor_hours: number | null
          parts_used: string | null
          piano_id: string
          pickup_date: string | null
          updated_at: string
          work_authorized: boolean | null
        }
        Insert: {
          balance_due?: number | null
          client_contact?: string | null
          client_name: string
          created_at?: string
          deposit_received?: number | null
          estimate?: number | null
          id?: string
          invoice_total?: number | null
          labor_hours?: number | null
          parts_used?: string | null
          piano_id: string
          pickup_date?: string | null
          updated_at?: string
          work_authorized?: boolean | null
        }
        Update: {
          balance_due?: number | null
          client_contact?: string | null
          client_name?: string
          created_at?: string
          deposit_received?: number | null
          estimate?: number | null
          id?: string
          invoice_total?: number | null
          labor_hours?: number | null
          parts_used?: string | null
          piano_id?: string
          pickup_date?: string | null
          updated_at?: string
          work_authorized?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "client_records_piano_id_fkey"
            columns: ["piano_id"]
            isOneToOne: true
            referencedRelation: "pianos"
            referencedColumns: ["id"]
          },
        ]
      }
      condition_inspections: {
        Row: {
          action: number | null
          action_wear: boolean | null
          bridge_separation: boolean | null
          bridges: number | null
          cabinet: number | null
          casters: number | null
          created_at: string
          dampers: number | null
          hammers: number | null
          id: string
          initial_assessment: string | null
          keytops: number | null
          loose_joints: boolean | null
          loose_tuning_pins: boolean | null
          pedal_problems: boolean | null
          pedals: number | null
          piano_id: string
          pinblock: number | null
          priority_level: string | null
          recommended_work: string | null
          rust: boolean | null
          soundboard: number | null
          soundboard_cracks: boolean | null
          strings: number | null
          trapwork: number | null
          tuning_pins: number | null
          updated_at: string
          water_damage: boolean | null
        }
        Insert: {
          action?: number | null
          action_wear?: boolean | null
          bridge_separation?: boolean | null
          bridges?: number | null
          cabinet?: number | null
          casters?: number | null
          created_at?: string
          dampers?: number | null
          hammers?: number | null
          id?: string
          initial_assessment?: string | null
          keytops?: number | null
          loose_joints?: boolean | null
          loose_tuning_pins?: boolean | null
          pedal_problems?: boolean | null
          pedals?: number | null
          piano_id: string
          pinblock?: number | null
          priority_level?: string | null
          recommended_work?: string | null
          rust?: boolean | null
          soundboard?: number | null
          soundboard_cracks?: boolean | null
          strings?: number | null
          trapwork?: number | null
          tuning_pins?: number | null
          updated_at?: string
          water_damage?: boolean | null
        }
        Update: {
          action?: number | null
          action_wear?: boolean | null
          bridge_separation?: boolean | null
          bridges?: number | null
          cabinet?: number | null
          casters?: number | null
          created_at?: string
          dampers?: number | null
          hammers?: number | null
          id?: string
          initial_assessment?: string | null
          keytops?: number | null
          loose_joints?: boolean | null
          loose_tuning_pins?: boolean | null
          pedal_problems?: boolean | null
          pedals?: number | null
          piano_id?: string
          pinblock?: number | null
          priority_level?: string | null
          recommended_work?: string | null
          rust?: boolean | null
          soundboard?: number | null
          soundboard_cracks?: boolean | null
          strings?: number | null
          trapwork?: number | null
          tuning_pins?: number | null
          updated_at?: string
          water_damage?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "condition_inspections_piano_id_fkey"
            columns: ["piano_id"]
            isOneToOne: false
            referencedRelation: "pianos"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_records: {
        Row: {
          created_at: string
          delivery_date: string | null
          donation_recipient: string | null
          donation_status: string | null
          donation_value: number | null
          id: string
          notes: string | null
          piano_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_date?: string | null
          donation_recipient?: string | null
          donation_status?: string | null
          donation_value?: number | null
          id?: string
          notes?: string | null
          piano_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_date?: string | null
          donation_recipient?: string | null
          donation_status?: string | null
          donation_value?: number | null
          id?: string
          notes?: string | null
          piano_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_records_piano_id_fkey"
            columns: ["piano_id"]
            isOneToOne: true
            referencedRelation: "pianos"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          actual_sale_price: number | null
          created_at: string
          estimated_sale_price: number | null
          id: string
          labor_cost: number | null
          labor_hours: number | null
          marketing_cost: number | null
          moving_cost: number | null
          notes: string | null
          parts_cost: number | null
          piano_id: string
          purchase_price: number | null
          updated_at: string
        }
        Insert: {
          actual_sale_price?: number | null
          created_at?: string
          estimated_sale_price?: number | null
          id?: string
          labor_cost?: number | null
          labor_hours?: number | null
          marketing_cost?: number | null
          moving_cost?: number | null
          notes?: string | null
          parts_cost?: number | null
          piano_id: string
          purchase_price?: number | null
          updated_at?: string
        }
        Update: {
          actual_sale_price?: number | null
          created_at?: string
          estimated_sale_price?: number | null
          id?: string
          labor_cost?: number | null
          labor_hours?: number | null
          marketing_cost?: number | null
          moving_cost?: number | null
          notes?: string | null
          parts_cost?: number | null
          piano_id?: string
          purchase_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_piano_id_fkey"
            columns: ["piano_id"]
            isOneToOne: false
            referencedRelation: "pianos"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_profiles: {
        Row: {
          created_at: string
          humidity_sensitivity: string | null
          id: string
          last_tuning_date: string | null
          piano_id: string
          pitch_level: string | null
          pitch_raise_required: boolean | null
          regulation_status: string | null
          updated_at: string
          voicing_status: string | null
        }
        Insert: {
          created_at?: string
          humidity_sensitivity?: string | null
          id?: string
          last_tuning_date?: string | null
          piano_id: string
          pitch_level?: string | null
          pitch_raise_required?: boolean | null
          regulation_status?: string | null
          updated_at?: string
          voicing_status?: string | null
        }
        Update: {
          created_at?: string
          humidity_sensitivity?: string | null
          id?: string
          last_tuning_date?: string | null
          piano_id?: string
          pitch_level?: string | null
          pitch_raise_required?: boolean | null
          regulation_status?: string | null
          updated_at?: string
          voicing_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_profiles_piano_id_fkey"
            columns: ["piano_id"]
            isOneToOne: true
            referencedRelation: "pianos"
            referencedColumns: ["id"]
          },
        ]
      }
      pianos: {
        Row: {
          asking_price: number | null
          bench_included: boolean | null
          brand: string
          buyer_contact: string | null
          buyer_name: string | null
          color_tag: string | null
          country_of_origin: string | null
          created_at: string
          finish: string | null
          finish_plan: string | null
          friction_score: number | null
          id: string
          inventory_id: string
          lane: string | null
          model: string | null
          ownership_category: string
          percent_complete: number | null
          piano_type: string
          pickup_date: string | null
          pickup_location: string | null
          pricing_notes: string | null
          private_notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          roi_health: string | null
          selling_channel: string | null
          serial_number: string | null
          sold_date: string | null
          sold_price: number | null
          source: string | null
          status: string
          tag: string | null
          tags: string[] | null
          transport_company: string | null
          updated_at: string
          year_built: string | null
          year_estimated: boolean | null
        }
        Insert: {
          asking_price?: number | null
          bench_included?: boolean | null
          brand: string
          buyer_contact?: string | null
          buyer_name?: string | null
          color_tag?: string | null
          country_of_origin?: string | null
          created_at?: string
          finish?: string | null
          finish_plan?: string | null
          friction_score?: number | null
          id?: string
          inventory_id: string
          lane?: string | null
          model?: string | null
          ownership_category?: string
          percent_complete?: number | null
          piano_type?: string
          pickup_date?: string | null
          pickup_location?: string | null
          pricing_notes?: string | null
          private_notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          roi_health?: string | null
          selling_channel?: string | null
          serial_number?: string | null
          sold_date?: string | null
          sold_price?: number | null
          source?: string | null
          status?: string
          tag?: string | null
          tags?: string[] | null
          transport_company?: string | null
          updated_at?: string
          year_built?: string | null
          year_estimated?: boolean | null
        }
        Update: {
          asking_price?: number | null
          bench_included?: boolean | null
          brand?: string
          buyer_contact?: string | null
          buyer_name?: string | null
          color_tag?: string | null
          country_of_origin?: string | null
          created_at?: string
          finish?: string | null
          finish_plan?: string | null
          friction_score?: number | null
          id?: string
          inventory_id?: string
          lane?: string | null
          model?: string | null
          ownership_category?: string
          percent_complete?: number | null
          piano_type?: string
          pickup_date?: string | null
          pickup_location?: string | null
          pricing_notes?: string | null
          private_notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          roi_health?: string | null
          selling_channel?: string | null
          serial_number?: string | null
          sold_date?: string | null
          sold_price?: number | null
          source?: string | null
          status?: string
          tag?: string | null
          tags?: string[] | null
          transport_company?: string | null
          updated_at?: string
          year_built?: string | null
          year_estimated?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      restoration_tasks: {
        Row: {
          assignee: string | null
          category: string | null
          completion_date: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          labor_hours: number | null
          notes: string | null
          parts_used: string | null
          piano_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee?: string | null
          category?: string | null
          completion_date?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          labor_hours?: number | null
          notes?: string | null
          parts_used?: string | null
          piano_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee?: string | null
          category?: string | null
          completion_date?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          labor_hours?: number | null
          notes?: string | null
          parts_used?: string | null
          piano_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restoration_tasks_piano_id_fkey"
            columns: ["piano_id"]
            isOneToOne: false
            referencedRelation: "pianos"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          active: boolean | null
          category: string
          created_at: string | null
          default_status: string | null
          id: string
          sort_order: number | null
          task_name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string | null
          default_status?: string | null
          id?: string
          sort_order?: number | null
          task_name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string | null
          default_status?: string | null
          id?: string
          sort_order?: number | null
          task_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "contributor" | "viewer"
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
    Enums: {
      app_role: ["admin", "contributor", "viewer"],
    },
  },
} as const
