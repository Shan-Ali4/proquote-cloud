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
      activities: {
        Row: {
          action: string
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string
          id: string
          meta: Json | null
          owner_id: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          meta?: Json | null
          owner_id: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          meta?: Json | null
          owner_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_id: string | null
          company_name: string | null
          country: string | null
          created_at: string
          credit_limit: number | null
          email: string | null
          gst_number: string | null
          id: string
          is_archived: boolean
          name: string
          notes: string | null
          owner_id: string
          pan_number: string | null
          payment_terms: string | null
          phone: string | null
          pincode: string | null
          state: string | null
          state_code: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_id?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          credit_limit?: number | null
          email?: string | null
          gst_number?: string | null
          id?: string
          is_archived?: boolean
          name: string
          notes?: string | null
          owner_id: string
          pan_number?: string | null
          payment_terms?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          state_code?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_id?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          credit_limit?: number | null
          email?: string | null
          gst_number?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          notes?: string | null
          owner_id?: string
          pan_number?: string | null
          payment_terms?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          state_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          bank_account: string | null
          bank_branch: string | null
          bank_ifsc: string | null
          bank_name: string | null
          city: string | null
          country: string | null
          created_at: string
          default_currency: string
          default_gst_rate: number
          default_notes: string | null
          default_terms: string | null
          email: string | null
          gst_number: string | null
          id: string
          invoice_prefix: string
          legal_name: string | null
          logo_url: string | null
          name: string
          owner_id: string
          pan_number: string | null
          phone: string | null
          pincode: string | null
          quotation_prefix: string
          signature_url: string | null
          state: string | null
          state_code: string | null
          updated_at: string
          upi_id: string | null
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          bank_account?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          default_currency?: string
          default_gst_rate?: number
          default_notes?: string | null
          default_terms?: string | null
          email?: string | null
          gst_number?: string | null
          id?: string
          invoice_prefix?: string
          legal_name?: string | null
          logo_url?: string | null
          name: string
          owner_id: string
          pan_number?: string | null
          phone?: string | null
          pincode?: string | null
          quotation_prefix?: string
          signature_url?: string | null
          state?: string | null
          state_code?: string | null
          updated_at?: string
          upi_id?: string | null
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          bank_account?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          default_currency?: string
          default_gst_rate?: number
          default_notes?: string | null
          default_terms?: string | null
          email?: string | null
          gst_number?: string | null
          id?: string
          invoice_prefix?: string
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          pan_number?: string | null
          phone?: string | null
          pincode?: string | null
          quotation_prefix?: string
          signature_url?: string | null
          state?: string | null
          state_code?: string | null
          updated_at?: string
          upi_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      document_items: {
        Row: {
          created_at: string
          description: string | null
          discount_percent: number
          document_id: string
          hsn_code: string | null
          id: string
          line_total: number
          name: string
          owner_id: string
          position: number
          quantity: number
          rate: number
          sku: string | null
          tax_percent: number
          unit: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percent?: number
          document_id: string
          hsn_code?: string | null
          id?: string
          line_total?: number
          name: string
          owner_id: string
          position?: number
          quantity?: number
          rate?: number
          sku?: string | null
          tax_percent?: number
          unit?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percent?: number
          document_id?: string
          hsn_code?: string | null
          id?: string
          line_total?: number
          name?: string
          owner_id?: string
          position?: number
          quantity?: number
          rate?: number
          sku?: string | null
          tax_percent?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_sequences: {
        Row: {
          doc_type: Database["public"]["Enums"]["doc_type"]
          id: string
          last_number: number
          owner_id: string
          year: number
        }
        Insert: {
          doc_type: Database["public"]["Enums"]["doc_type"]
          id?: string
          last_number?: number
          owner_id: string
          year: number
        }
        Update: {
          doc_type?: Database["public"]["Enums"]["doc_type"]
          id?: string
          last_number?: number
          owner_id?: string
          year?: number
        }
        Relationships: []
      }
      documents: {
        Row: {
          amount_paid: number
          cgst_amount: number
          client_id: string | null
          company_id: string | null
          created_at: string
          currency: string
          discount_amount: number
          discount_type: string
          discount_value: number
          doc_number: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          grand_total: number
          gst_kind: Database["public"]["Enums"]["gst_kind"]
          gst_mode: Database["public"]["Enums"]["gst_mode"]
          id: string
          igst_amount: number
          issue_date: string
          notes: string | null
          other_charge: number
          owner_id: string
          packaging_charge: number
          reference: string | null
          round_off: number
          sales_person: string | null
          sgst_amount: number
          shipping_charge: number
          status: Database["public"]["Enums"]["doc_status"]
          subtotal: number
          taxable_amount: number
          terms: string | null
          updated_at: string
          validity_date: string | null
        }
        Insert: {
          amount_paid?: number
          cgst_amount?: number
          client_id?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number
          discount_type?: string
          discount_value?: number
          doc_number: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          grand_total?: number
          gst_kind?: Database["public"]["Enums"]["gst_kind"]
          gst_mode?: Database["public"]["Enums"]["gst_mode"]
          id?: string
          igst_amount?: number
          issue_date?: string
          notes?: string | null
          other_charge?: number
          owner_id: string
          packaging_charge?: number
          reference?: string | null
          round_off?: number
          sales_person?: string | null
          sgst_amount?: number
          shipping_charge?: number
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number
          taxable_amount?: number
          terms?: string | null
          updated_at?: string
          validity_date?: string | null
        }
        Update: {
          amount_paid?: number
          cgst_amount?: number
          client_id?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number
          discount_type?: string
          discount_value?: number
          doc_number?: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          grand_total?: number
          gst_kind?: Database["public"]["Enums"]["gst_kind"]
          gst_mode?: Database["public"]["Enums"]["gst_mode"]
          id?: string
          igst_amount?: number
          issue_date?: string
          notes?: string | null
          other_charge?: number
          owner_id?: string
          packaging_charge?: number
          reference?: string | null
          round_off?: number
          sales_person?: string | null
          sgst_amount?: number
          shipping_charge?: number
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number
          taxable_amount?: number
          terms?: string | null
          updated_at?: string
          validity_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          document_id: string
          id: string
          method: string | null
          notes: string | null
          owner_id: string
          paid_on: string
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          document_id: string
          id?: string
          method?: string | null
          notes?: string | null
          owner_id: string
          paid_on?: string
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          document_id?: string
          id?: string
          method?: string | null
          notes?: string | null
          owner_id?: string
          paid_on?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      next_document_number: {
        Args: {
          _doc_type: Database["public"]["Enums"]["doc_type"]
          _prefix: string
          _year: number
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "accountant" | "viewer"
      doc_status:
        | "draft"
        | "sent"
        | "approved"
        | "rejected"
        | "expired"
        | "paid"
        | "partially_paid"
      doc_type: "quotation" | "proforma"
      gst_kind: "intra" | "inter"
      gst_mode: "exclusive" | "inclusive" | "none"
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
      app_role: ["admin", "manager", "accountant", "viewer"],
      doc_status: [
        "draft",
        "sent",
        "approved",
        "rejected",
        "expired",
        "paid",
        "partially_paid",
      ],
      doc_type: ["quotation", "proforma"],
      gst_kind: ["intra", "inter"],
      gst_mode: ["exclusive", "inclusive", "none"],
    },
  },
} as const
