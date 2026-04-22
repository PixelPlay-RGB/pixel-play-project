import { createBrowserClient } from "@supabase/ssr"

type Gender = "male" | "female" | "other"

export interface Database {
  public: {
    Tables: {
      user: {
        Row: {
          id: string
          oauth_id: string | null
          email: string | null
          name: string | null
          birth: string | null
          phone: string | null
          gender: Gender | null
          created_at: string
          modified_at: string
        }
        Insert: {
          id?: string
          oauth_id?: string | null
          email?: string | null
          name?: string | null
          birth?: string | null
          phone?: string | null
          gender?: Gender | null
          created_at?: string
          modified_at?: string
        }
        Update: {
          id?: string
          oauth_id?: string | null
          email?: string | null
          name?: string | null
          birth?: string | null
          phone?: string | null
          gender?: Gender | null
          created_at?: string
          modified_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          room_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
      room_members: {
        Row: {
          room_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          room_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          room_id?: string
          user_id?: string
          joined_at?: string
        }
      }
    }
  }
}

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}
