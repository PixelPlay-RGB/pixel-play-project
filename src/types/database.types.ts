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
      chat_room: {
        Row: {
          created_at: string
          current_member: number
          description: string | null
          id: string
          max_capacity: number
          modified_at: string
          owner_id: string
          title: string
        }
        Insert: {
          created_at?: string
          current_member?: number
          description?: string | null
          id?: string
          max_capacity: number
          modified_at?: string
          owner_id?: string
          title: string
        }
        Update: {
          created_at?: string
          current_member?: number
          description?: string | null
          id?: string
          max_capacity?: number
          modified_at?: string
          owner_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_member: {
        Row: {
          chat_room_id: string
          created_at: string
          id: string
          is_banned: boolean
          last_joined_at: string | null
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          chat_room_id: string
          created_at?: string
          id?: string
          is_banned?: boolean
          last_joined_at?: string | null
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          chat_room_id?: string
          created_at?: string
          id?: string
          is_banned?: boolean
          last_joined_at?: string | null
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_member_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_room"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_room_member_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      message: {
        Row: {
          chat_room_id: string
          content: string
          created_at: string
          id: string
          message_type: Database["public"]["Enums"]["message_type"]
          modified_at: string
          user_id: string
        }
        Insert: {
          chat_room_id: string
          content: string
          created_at?: string
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          modified_at?: string
          user_id: string
        }
        Update: {
          chat_room_id?: string
          content?: string
          created_at?: string
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          modified_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_room"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          birth: string
          created_at: string
          email: string
          gender: Database["public"]["Enums"]["gender"]
          id: string
          linked_providers: Database["public"]["Enums"]["oauth_provider"][]
          modified_at: string
          name: string
          nickname: string
          phone: string
          photo_url: string | null
        }
        Insert: {
          birth: string
          created_at?: string
          email: string
          gender: Database["public"]["Enums"]["gender"]
          id: string
          linked_providers?: Database["public"]["Enums"]["oauth_provider"][]
          modified_at?: string
          name: string
          nickname: string
          phone: string
          photo_url?: string | null
        }
        Update: {
          birth?: string
          created_at?: string
          email?: string
          gender?: Database["public"]["Enums"]["gender"]
          id?: string
          linked_providers?: Database["public"]["Enums"]["oauth_provider"][]
          modified_at?: string
          name?: string
          nickname?: string
          phone?: string
          photo_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_email_exists: { Args: { target_email: string }; Returns: boolean }
      check_nickname_exists: {
        Args: { target_nickname: string }
        Returns: boolean
      }
      get_room_counts_by_user: {
        Args: { p_user_id: string }
        Returns: {
          joined: number
          not_joined: number
          owned: number
        }[]
      }
      get_rooms_by_tab_count: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_sort_option?: string
          p_tab_type: string
          p_user_id: string
        }
        Returns: {
          created_at: string
          current_member: number
          description: string
          id: string
          max_capacity: number
          owner_id: string
          owner_nickname: string
          title: string
          unread_count: number
        }[]
      }
      join_chat_room: { Args: { p_room_id: string }; Returns: undefined }
      kick_chat_room_member: {
        Args: { p_room_id: string; p_target_user_id: string }
        Returns: undefined
      }
      leave_chat_room: { Args: { p_room_id: string }; Returns: undefined }
      mark_room_read: { Args: { p_room_id: string }; Returns: undefined }
      search_chat_rooms: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_query: string
          p_section?: string
        }
        Returns: {
          created_at: string
          current_member: number
          description: string
          has_more: boolean
          id: string
          max_capacity: number
          owner_id: string
          owner_nickname: string
          section: string
          title: string
        }[]
      }
      transfer_chat_room_owner: {
        Args: { p_room_id: string; p_target_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      gender: "male" | "female" | "none"
      message_type: "text" | "system"
      oauth_provider: "google" | "github" | "email"
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
      gender: ["male", "female", "none"],
      message_type: ["text", "system"],
      oauth_provider: ["google", "github", "email"],
    },
  },
} as const
