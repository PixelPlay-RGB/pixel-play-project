"use client"

import { useQuery } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import type { Room } from "@/types/chatroom"

export function useRoom(roomId: string) {
  const supabase = createClient()

  return useQuery<Room>({
    queryKey: ["room", roomId],
    enabled: !!roomId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chatroom")
        .select("*")
        .eq("id", roomId)
        .single()

      if (error) throw error

      return data
    },
  })
}
