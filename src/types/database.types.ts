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
      creator_studio_setting: {
        Row: {
          alert_sound_enabled: boolean
          alert_sound_key: string
          alert_volume: number
          channel_bio: string
          chat_donation_message_enabled: boolean
          chat_overlay_version: number
          chat_rule_text: string
          chat_rule_version: number
          chat_scope: Database["public"]["Enums"]["live_chat_scope"]
          created_at: string
          creator_id: string
          default_tags: string[]
          default_title: string
          donation_alert_duration_seconds: number
          donation_alert_version: number
          donation_amount_visible: boolean
          donation_enabled: boolean
          donation_min_amount: number
          donation_ranking_visible: boolean
          follower_wait_seconds: number
          forbidden_words: string[]
          link_blocked: boolean
          modified_at: string
          settlement_demo: Json
          slow_mode_enabled: boolean
          slow_mode_seconds: number
          social_links: Json
          stream_key_version: number
          tts_enabled: boolean
          tts_rate: number
          tts_voice_uri: string
          tts_volume: number
        }
        Insert: {
          alert_sound_enabled?: boolean
          alert_sound_key?: string
          alert_volume?: number
          channel_bio?: string
          chat_donation_message_enabled?: boolean
          chat_overlay_version?: number
          chat_rule_text?: string
          chat_rule_version?: number
          chat_scope?: Database["public"]["Enums"]["live_chat_scope"]
          created_at?: string
          creator_id: string
          default_tags?: string[]
          default_title?: string
          donation_alert_duration_seconds?: number
          donation_alert_version?: number
          donation_amount_visible?: boolean
          donation_enabled?: boolean
          donation_min_amount?: number
          donation_ranking_visible?: boolean
          follower_wait_seconds?: number
          forbidden_words?: string[]
          link_blocked?: boolean
          modified_at?: string
          settlement_demo?: Json
          slow_mode_enabled?: boolean
          slow_mode_seconds?: number
          social_links?: Json
          stream_key_version?: number
          tts_enabled?: boolean
          tts_rate?: number
          tts_voice_uri?: string
          tts_volume?: number
        }
        Update: {
          alert_sound_enabled?: boolean
          alert_sound_key?: string
          alert_volume?: number
          channel_bio?: string
          chat_donation_message_enabled?: boolean
          chat_overlay_version?: number
          chat_rule_text?: string
          chat_rule_version?: number
          chat_scope?: Database["public"]["Enums"]["live_chat_scope"]
          created_at?: string
          creator_id?: string
          default_tags?: string[]
          default_title?: string
          donation_alert_duration_seconds?: number
          donation_alert_version?: number
          donation_amount_visible?: boolean
          donation_enabled?: boolean
          donation_min_amount?: number
          donation_ranking_visible?: boolean
          follower_wait_seconds?: number
          forbidden_words?: string[]
          link_blocked?: boolean
          modified_at?: string
          settlement_demo?: Json
          slow_mode_enabled?: boolean
          slow_mode_seconds?: number
          social_links?: Json
          stream_key_version?: number
          tts_enabled?: boolean
          tts_rate?: number
          tts_voice_uri?: string
          tts_volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "creator_studio_setting_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      donation: {
        Row: {
          amount: number
          broadcast_id: string
          created_at: string
          creator_id: string
          donor_id: string
          id: string
          is_anonymous: boolean
          message: string
          wallet_transaction_id: string
        }
        Insert: {
          amount: number
          broadcast_id: string
          created_at?: string
          creator_id: string
          donor_id: string
          id?: string
          is_anonymous?: boolean
          message?: string
          wallet_transaction_id: string
        }
        Update: {
          amount?: number
          broadcast_id?: string
          created_at?: string
          creator_id?: string
          donor_id?: string
          id?: string
          is_anonymous?: boolean
          message?: string
          wallet_transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "live_broadcast"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: true
            referencedRelation: "wallet_transaction"
            referencedColumns: ["id"]
          },
        ]
      }
      live_broadcast: {
        Row: {
          chat_message_count: number
          created_at: string
          creator_id: string
          current_viewer_count: number
          donation_amount_total: number
          donation_count: number
          ended_at: string | null
          id: string
          modified_at: string
          peak_viewer_count: number
          started_at: string
          tags: string[]
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          chat_message_count?: number
          created_at?: string
          creator_id: string
          current_viewer_count?: number
          donation_amount_total?: number
          donation_count?: number
          ended_at?: string | null
          id?: string
          modified_at?: string
          peak_viewer_count?: number
          started_at?: string
          tags?: string[]
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          chat_message_count?: number
          created_at?: string
          creator_id?: string
          current_viewer_count?: number
          donation_amount_total?: number
          donation_count?: number
          ended_at?: string | null
          id?: string
          modified_at?: string
          peak_viewer_count?: number
          started_at?: string
          tags?: string[]
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_broadcast_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      live_message: {
        Row: {
          broadcast_id: string
          content: string
          created_at: string
          donation_id: string | null
          id: string
          message_type: Database["public"]["Enums"]["live_message_type"]
          metadata: Json
          sender_id: string | null
        }
        Insert: {
          broadcast_id: string
          content: string
          created_at?: string
          donation_id?: string | null
          id?: string
          message_type?: Database["public"]["Enums"]["live_message_type"]
          metadata?: Json
          sender_id?: string | null
        }
        Update: {
          broadcast_id?: string
          content?: string
          created_at?: string
          donation_id?: string | null
          id?: string
          message_type?: Database["public"]["Enums"]["live_message_type"]
          metadata?: Json
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_message_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "live_broadcast"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_message_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: true
            referencedRelation: "donation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_message_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      live_poll: {
        Row: {
          broadcast_id: string
          created_at: string
          ended_at: string | null
          ends_at: string | null
          id: string
          modified_at: string
          options: Json
          title: string
        }
        Insert: {
          broadcast_id: string
          created_at?: string
          ended_at?: string | null
          ends_at?: string | null
          id?: string
          modified_at?: string
          options: Json
          title: string
        }
        Update: {
          broadcast_id?: string
          created_at?: string
          ended_at?: string | null
          ends_at?: string | null
          id?: string
          modified_at?: string
          options?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_poll_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "live_broadcast"
            referencedColumns: ["id"]
          },
        ]
      }
      live_poll_vote: {
        Row: {
          created_at: string
          option_id: string
          poll_id: string
          voter_id: string
        }
        Insert: {
          created_at?: string
          option_id: string
          poll_id: string
          voter_id: string
        }
        Update: {
          created_at?: string
          option_id?: string
          poll_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_poll_vote_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "live_poll"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_poll_vote_voter_id_fkey"
            columns: ["voter_id"]
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
      viewer_creator_relation: {
        Row: {
          chat_rule_accepted_at: string | null
          chat_rule_accepted_version: number | null
          created_at: string
          creator_id: string
          followed_at: string | null
          modified_at: string
          viewer_id: string
        }
        Insert: {
          chat_rule_accepted_at?: string | null
          chat_rule_accepted_version?: number | null
          created_at?: string
          creator_id: string
          followed_at?: string | null
          modified_at?: string
          viewer_id: string
        }
        Update: {
          chat_rule_accepted_at?: string | null
          chat_rule_accepted_version?: number | null
          created_at?: string
          creator_id?: string
          followed_at?: string | null
          modified_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viewer_creator_relation_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewer_creator_relation_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_account: {
        Row: {
          balance_amount: number
          created_at: string
          modified_at: string
          user_id: string
        }
        Insert: {
          balance_amount?: number
          created_at?: string
          modified_at?: string
          user_id: string
        }
        Update: {
          balance_amount?: number
          created_at?: string
          modified_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_account_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transaction: {
        Row: {
          amount_delta: number
          balance_after: number | null
          created_at: string
          id: string
          idempotency_key: string | null
          metadata: Json
          modified_at: string
          order_id: string | null
          payment_key: string | null
          transaction_status: Database["public"]["Enums"]["wallet_transaction_status"]
          transaction_type: Database["public"]["Enums"]["wallet_transaction_type"]
          user_id: string
        }
        Insert: {
          amount_delta: number
          balance_after?: number | null
          created_at?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          modified_at?: string
          order_id?: string | null
          payment_key?: string | null
          transaction_status?: Database["public"]["Enums"]["wallet_transaction_status"]
          transaction_type: Database["public"]["Enums"]["wallet_transaction_type"]
          user_id: string
        }
        Update: {
          amount_delta?: number
          balance_after?: number | null
          created_at?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          modified_at?: string
          order_id?: string | null
          payment_key?: string | null
          transaction_status?: Database["public"]["Enums"]["wallet_transaction_status"]
          transaction_type?: Database["public"]["Enums"]["wallet_transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transaction_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_live_chat_rule: {
        Args: { p_actor_user_id: string; p_creator_id: string }
        Returns: number
      }
      check_email_exists: { Args: { target_email: string }; Returns: boolean }
      confirm_wallet_charge: {
        Args: {
          p_actor_user_id: string
          p_amount: number
          p_idempotency_key: string
          p_metadata?: Json
          p_order_id?: string
          p_payment_key?: string
        }
        Returns: Json
      }
      create_chat_room: {
        Args: {
          p_actor_user_id: string
          p_description?: string
          p_max_capacity?: number
          p_title: string
        }
        Returns: string
      }
      create_live_poll: {
        Args: {
          p_actor_user_id: string
          p_broadcast_id: string
          p_ends_at?: string
          p_options: Json
          p_title: string
        }
        Returns: string
      }
      end_live_broadcast: {
        Args: { p_actor_user_id: string; p_broadcast_id?: string }
        Returns: string
      }
      end_live_poll: {
        Args: { p_actor_user_id: string; p_poll_id: string }
        Returns: undefined
      }
      follow_creator: {
        Args: { p_actor_user_id: string; p_creator_id: string }
        Returns: undefined
      }
      get_chat_room_detail: {
        Args: { p_room_id: string }
        Returns: {
          members: Json
          membership: Json
          room: Json
        }[]
      }
      get_chat_room_list: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_query?: string
          p_sort_option?: string
          p_tab_type: string
        }
        Returns: {
          joined_count: number
          not_joined_count: number
          owned_count: number
          rooms: Json
          total_count: number
        }[]
      }
      get_creator_donation_dashboard: {
        Args: {
          p_actor_user_id: string
          p_limit?: number
          p_month?: number
          p_offset?: number
          p_year?: number
        }
        Returns: Json
      }
      get_creator_studio_snapshot: {
        Args: { p_actor_user_id: string }
        Returns: Json
      }
      get_following_channel_list: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_landing_snapshot: { Args: never; Returns: Json }
      get_live_chat_overlay_snapshot: {
        Args: { p_creator_id: string; p_limit?: number }
        Returns: Json
      }
      get_live_donation_alert_overlay_snapshot: {
        Args: { p_creator_id: string }
        Returns: Json
      }
      get_live_hero: { Args: never; Returns: Json }
      get_live_list: {
        Args: {
          p_excluded_live_id?: string
          p_filter?: string
          p_limit?: number
          p_offset?: number
          p_query?: string
          p_sort?: string
          p_viewer_id?: string
        }
        Returns: Json
      }
      get_live_popular_keywords: { Args: { p_limit?: number }; Returns: Json }
      get_live_watch: {
        Args: { p_creator_id: string; p_viewer_id?: string }
        Returns: Json
      }
      get_live_watch_count: { Args: { p_creator_id: string }; Returns: Json }
      get_public_chat_room_metadata: {
        Args: { p_room_id: string }
        Returns: {
          description: string
          id: string
          title: string
        }[]
      }
      get_user_donation_snapshot: {
        Args: { p_actor_user_id: string }
        Returns: Json
      }
      join_chat_room: {
        Args: { p_actor_user_id: string; p_room_id: string }
        Returns: undefined
      }
      kick_chat_room_member: {
        Args: {
          p_actor_user_id: string
          p_room_id: string
          p_target_user_id: string
        }
        Returns: undefined
      }
      leave_chat_room: {
        Args: { p_actor_user_id: string; p_room_id: string }
        Returns: undefined
      }
      mark_room_read: {
        Args: { p_actor_user_id: string; p_room_id: string }
        Returns: undefined
      }
      rotate_live_security_token_version: {
        Args: { p_actor_user_id: string; p_token_kind: string }
        Returns: Json
      }
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
      search_live_results: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_query: string
          p_section?: string
        }
        Returns: {
          broadcast_id: string
          creator_id: string
          creator_nickname: string
          creator_photo_url: string
          current_viewer_count: number
          follower_count: number
          has_more: boolean
          is_following: boolean
          is_live: boolean
          section: string
          started_at: string
          tags: string[]
          thumbnail_url: string
          title: string
        }[]
      }
      send_chat_message: {
        Args: { p_actor_user_id: string; p_content: string; p_room_id: string }
        Returns: string
      }
      send_live_donation: {
        Args: {
          p_actor_user_id: string
          p_amount: number
          p_broadcast_id: string
          p_idempotency_key?: string
          p_is_anonymous?: boolean
          p_message?: string
        }
        Returns: Json
      }
      send_live_message: {
        Args: {
          p_actor_user_id: string
          p_broadcast_id: string
          p_content: string
        }
        Returns: string
      }
      start_live_broadcast: {
        Args: {
          p_actor_user_id: string
          p_tags?: string[]
          p_thumbnail_url?: string
          p_title?: string
        }
        Returns: string
      }
      transfer_chat_room_owner: {
        Args: {
          p_actor_user_id: string
          p_room_id: string
          p_target_user_id: string
        }
        Returns: undefined
      }
      unfollow_creator: {
        Args: { p_actor_user_id: string; p_creator_id: string }
        Returns: undefined
      }
      upsert_creator_studio_setting: {
        Args: {
          p_actor_user_id: string
          p_alert_sound_enabled?: boolean
          p_alert_sound_key?: string
          p_alert_volume?: number
          p_chat_donation_message_enabled?: boolean
          p_chat_rule_text?: string
          p_chat_scope?: Database["public"]["Enums"]["live_chat_scope"]
          p_default_tags?: string[]
          p_default_title?: string
          p_donation_alert_duration_seconds?: number
          p_donation_amount_visible?: boolean
          p_donation_enabled?: boolean
          p_donation_min_amount?: number
          p_follower_wait_seconds?: number
          p_forbidden_words?: string[]
          p_link_blocked?: boolean
          p_settlement_demo?: Json
          p_slow_mode_enabled?: boolean
          p_slow_mode_seconds?: number
          p_tts_enabled?: boolean
          p_tts_rate?: number
          p_tts_voice_uri?: string
          p_tts_volume?: number
        }
        Returns: Json
      }
      vote_live_poll: {
        Args: {
          p_actor_user_id: string
          p_option_id: string
          p_poll_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      gender: "male" | "female" | "none"
      live_chat_scope: "authenticated" | "follower" | "manager"
      live_message_type: "chat" | "moderation_notice" | "donation"
      message_type: "text" | "system"
      oauth_provider: "google" | "github" | "email"
      wallet_transaction_status: "pending" | "succeeded" | "failed" | "canceled"
      wallet_transaction_type: "charge" | "donation_spend" | "refund"
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
      live_chat_scope: ["authenticated", "follower", "manager"],
      live_message_type: ["chat", "moderation_notice", "donation"],
      message_type: ["text", "system"],
      oauth_provider: ["google", "github", "email"],
      wallet_transaction_status: ["pending", "succeeded", "failed", "canceled"],
      wallet_transaction_type: ["charge", "donation_spend", "refund"],
    },
  },
} as const
