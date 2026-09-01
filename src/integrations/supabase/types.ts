export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string;
          id: string;
          metadata: Json;
          path: string | null;
          referrer: string | null;
          title: string | null;
          type: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          metadata?: Json;
          path?: string | null;
          referrer?: string | null;
          title?: string | null;
          type: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          metadata?: Json;
          path?: string | null;
          referrer?: string | null;
          title?: string | null;
          type?: string;
        };
        Relationships: [];
      };
      blocked_dates: {
        Row: {
          created_at: string;
          end_date: string;
          id: string;
          reason: string | null;
          start_date: string;
        };
        Insert: {
          created_at?: string;
          end_date: string;
          id?: string;
          reason?: string | null;
          start_date: string;
        };
        Update: {
          created_at?: string;
          end_date?: string;
          id?: string;
          reason?: string | null;
          start_date?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          adults: number;
          check_in: string;
          check_out: string;
          children: number;
          children_ages: number[] | null;
          created_at: string;
          dogs: number;
          email: string;
          guest_name: string;
          guests: number;
          id: string;
          message: string | null;
          personal_data_redacted_at: string | null;
          phone: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          adults?: number;
          check_in: string;
          check_out: string;
          children?: number;
          children_ages?: number[] | null;
          created_at?: string;
          dogs?: number;
          email: string;
          guest_name: string;
          guests?: number;
          id?: string;
          message?: string | null;
          personal_data_redacted_at?: string | null;
          phone?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          adults?: number;
          check_in?: string;
          check_out?: string;
          children?: number;
          children_ages?: number[] | null;
          created_at?: string;
          dogs?: number;
          email?: string;
          guest_name?: string;
          guests?: number;
          id?: string;
          message?: string | null;
          personal_data_redacted_at?: string | null;
          phone?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      gallery_images: {
        Row: {
          category: string;
          created_at: string;
          external_url: string | null;
          id: string;
          sort_order: number;
          storage_path: string | null;
          title: string | null;
        };
        Insert: {
          category?: string;
          created_at?: string;
          external_url?: string | null;
          id?: string;
          sort_order?: number;
          storage_path?: string | null;
          title?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string;
          external_url?: string | null;
          id?: string;
          sort_order?: number;
          storage_path?: string | null;
          title?: string | null;
        };
        Relationships: [];
      };
      pricing_settings: {
        Row: {
          adult_price: number;
          booking_enabled: boolean;
          child_price: number;
          created_at: string;
          dog_price: number;
          id: string;
          ifa_per_adult: number;
          min_nights_default: number;
          single_night_surcharge_percent: number;
          toddler_price: number;
          updated_at: string;
        };
        Insert: {
          adult_price?: number;
          booking_enabled?: boolean;
          child_price?: number;
          created_at?: string;
          dog_price?: number;
          id?: string;
          ifa_per_adult?: number;
          min_nights_default?: number;
          single_night_surcharge_percent?: number;
          toddler_price?: number;
          updated_at?: string;
        };
        Update: {
          adult_price?: number;
          booking_enabled?: boolean;
          child_price?: number;
          created_at?: string;
          dog_price?: number;
          id?: string;
          ifa_per_adult?: number;
          min_nights_default?: number;
          single_night_surcharge_percent?: number;
          toddler_price?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      pricing_special_periods: {
        Row: {
          adult_price: number;
          child_price: number;
          created_at: string;
          end_date: string;
          id: string;
          is_active: boolean;
          min_nights: number;
          name: string;
          recurrence: "none" | "yearly" | "once";
          start_date: string;
          updated_at: string;
        };
        Insert: {
          adult_price?: number;
          child_price?: number;
          created_at?: string;
          end_date: string;
          id?: string;
          is_active?: boolean;
          min_nights?: number;
          name: string;
          recurrence?: "none" | "yearly" | "once";
          start_date: string;
          updated_at?: string;
        };
        Update: {
          adult_price?: number;
          child_price?: number;
          created_at?: string;
          end_date?: string;
          id?: string;
          is_active?: boolean;
          min_nights?: number;
          name?: string;
          recurrence?: "none" | "yearly" | "once";
          start_date?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      programs: {
        Row: {
          created_at: string;
          date_text: string | null;
          description: string | null;
          external_id: string | null;
          id: string;
          image_url: string | null;
          location: string | null;
          sort_order: number;
          source: string;
          source_url: string | null;
          starts_at: string | null;
          storage_path: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          date_text?: string | null;
          description?: string | null;
          external_id?: string | null;
          id?: string;
          image_url?: string | null;
          location?: string | null;
          sort_order?: number;
          source?: string;
          source_url?: string | null;
          starts_at?: string | null;
          storage_path?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          date_text?: string | null;
          description?: string | null;
          external_id?: string | null;
          id?: string;
          image_url?: string | null;
          location?: string | null;
          sort_order?: number;
          source?: string;
          source_url?: string | null;
          starts_at?: string | null;
          storage_path?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
    },
  },
} as const;
