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
      alerts: {
        Row: {
          created_at: string
          id: string
          location: string
          patient_name: string
          phone: string
          severity: string
          source: string
          status: string
          symptom: string
          updated_at: string
          alert_type: string
          patient_id: string | null
          responded_by: string | null
          response_notes: string | null
          responded_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          location: string
          patient_name: string
          phone: string
          severity: string
          source?: string
          status?: string
          symptom: string
          updated_at?: string
          alert_type?: string
          patient_id?: string | null
          responded_by?: string | null
          response_notes?: string | null
          responded_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          patient_name?: string
          phone?: string
          severity?: string
          source?: string
          status?: string
          symptom?: string
          updated_at?: string
          alert_type?: string
          patient_id?: string | null
          responded_by?: string | null
          response_notes?: string | null
          responded_at?: string | null
        }
        Relationships: []
      }
      jirani_network: {
        Row: {
          id: string
          patient_id: string
          contact_name: string
          contact_phone: string
          contact_type: string
          priority: number
          location: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          contact_name: string
          contact_phone: string
          contact_type: string
          priority?: number
          location?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          contact_name?: string
          contact_phone?: string
          contact_type?: string
          priority?: number
          location?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jirani_network_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      afya_id_tokens: {
        Row: {
          id: string
          patient_id: string
          pin_code: string
          expires_at: string
          is_revoked: boolean
          used_by_doctor: string | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          pin_code: string
          expires_at: string
          is_revoked?: boolean
          used_by_doctor?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          pin_code?: string
          expires_at?: string
          is_revoked?: boolean
          used_by_doctor?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "afya_id_tokens_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          id: string
          alert_id: string | null
          recipient_phone: string
          recipient_name: string | null
          notification_type: string
          message_content: string | null
          status: string
          provider_response: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          alert_id?: string | null
          recipient_phone: string
          recipient_name?: string | null
          notification_type: string
          message_content?: string | null
          status?: string
          provider_response?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          alert_id?: string | null
          recipient_phone?: string
          recipient_name?: string | null
          notification_type?: string
          message_content?: string | null
          status?: string
          provider_response?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_vitals: {
        Row: {
          id: string
          patient_id: string
          bp_systolic: number | null
          bp_diastolic: number | null
          weight_kg: number | null
          height_cm: number | null
          pulse: number | null
          temperature: number | null
          blood_sugar: number | null
          oxygen_saturation: number | null
          recorded_by: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          bp_systolic?: number | null
          bp_diastolic?: number | null
          weight_kg?: number | null
          height_cm?: number | null
          pulse?: number | null
          temperature?: number | null
          blood_sugar?: number | null
          oxygen_saturation?: number | null
          recorded_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          bp_systolic?: number | null
          bp_diastolic?: number | null
          weight_kg?: number | null
          height_cm?: number | null
          pulse?: number | null
          temperature?: number | null
          blood_sugar?: number | null
          oxygen_saturation?: number | null
          recorded_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_vitals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      health_records: {
        Row: {
          code: string
          created_at: string
          id: string
          patient_id: string
          recorded_at: string
          resource_type: string
          sha256_hash: string
          value: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          patient_id: string
          recorded_at?: string
          resource_type: string
          sha256_hash: string
          value: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          patient_id?: string
          recorded_at?: string
          resource_type?: string
          sha256_hash?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          age: number | null
          created_at: string
          gender: string | null
          id: string
          last_visit: string | null
          location: string | null
          name: string
          phone: string
          updated_at: string
          upi: string
          sha_no: string | null
          ward: string | null
          nid: string | null
          language_pref: string | null
        }
        Insert: {
          age?: number | null
          created_at?: string
          gender?: string | null
          id?: string
          last_visit?: string | null
          location?: string | null
          name: string
          phone: string
          updated_at?: string
          upi: string
          sha_no?: string | null
          ward?: string | null
          nid?: string | null
          language_pref?: string | null
        }
        Update: {
          age?: number | null
          created_at?: string
          gender?: string | null
          id?: string
          last_visit?: string | null
          location?: string | null
          name?: string
          phone?: string
          updated_at?: string
          upi?: string
          sha_no?: string | null
          ward?: string | null
          nid?: string | null
          language_pref?: string | null
        }
        Relationships: []
      }
      ussd_sessions: {
        Row: {
          conversation_log: Json | null
          created_at: string
          current_menu: string
          id: string
          phone_number: string
          service_code: string | null
          session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          conversation_log?: Json | null
          created_at?: string
          current_menu?: string
          id?: string
          phone_number: string
          service_code?: string | null
          session_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          conversation_log?: Json | null
          created_at?: string
          current_menu?: string
          id?: string
          phone_number?: string
          service_code?: string | null
          session_id?: string
          status?: string
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
