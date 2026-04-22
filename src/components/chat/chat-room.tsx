"use client"

import { useMemo, useRef, useState } from "react"

import { useQuery } from "@tanstack/react-query"

import type { Message, Room, RoomMember } from "@/types/chat"
import { CURRENT_ROOM_ID, CURRENT_USER_ID } from "@/lib/chat-constants"
import useMessages from "@/hook/use-messages"
import { createClient } from "@/lib/supabase/client"

import { MemberList } from "./member-list"
import { MessageInput } from "./message-input"
import { MessageList } from "./message-list"

interface Props {
  roomId: string
}

interface RoomQueryRow {
  id: string
  name: string
  description: string | null
  user_id: string
  created_at: string
}

interface RoomMemberQueryRow {
  room_id: string
  user_id: string
  joined_at: string
  user: Array<{
    display_name: string | null
  }> | null
}

export function ChatRoom({ roomId: _roomId }: Props) {
  const supabase = useMemo(() => createClient(), [])
  // 로그인 연동 전까지는 상수 사용, 이후 session.user.id/session room으로 교체 가능
  const currentUserId = CURRENT_USER_ID
  const activeRoomId = CURRENT_ROOM_ID

  const {
    messages,
    displayNameByUserId,
    hasMorePrevious,
    isLoadingPrevious,
    loadPrevious,
    isLoadingInitial,
  } = useMessages(activeRoomId)

  const [draft, setDraft] = useState("")
  const loadPreviousLockRef = useRef(false)
  const sendMessageLockRef = useRef(false)

  const { data: room } = useQuery({
    queryKey: ["room", activeRoomId],
    queryFn: async (): Promise<Room> => {
      const { data, error } = await supabase
        .from("room")
        .select("id, name, description, user_id, created_at")
        .eq("id", activeRoomId)
        .single()
        .returns<RoomQueryRow>()

      if (error) throw error

      return {
        id: data.id,
        name: data.name,
        description: data.description ?? "",
        createdBy: data.user_id,
        createdAt: data.created_at,
      }
    },
  })

  const { data: members = [] } = useQuery({
    queryKey: ["room-members", activeRoomId],
    queryFn: async (): Promise<RoomMember[]> => {
      const { data, error } = await supabase
        .from("room_member")
        .select("room_id, user_id, joined_at, user:user_id(display_name)")
        .eq("room_id", activeRoomId)
        .order("joined_at", { ascending: true })
        .returns<RoomMemberQueryRow[]>()

      if (error) throw error

      return (data ?? []).map((member) => ({
        id: `${member.room_id}-${member.user_id}`,
        userId: member.user_id,
        name: member.user?.[0]?.display_name ?? member.user_id.slice(0, 8),
        joinedAt: member.joined_at,
      }))
    },
  })

  const handleSend = async () => {
    const trimmed = draft.trim()
    if (!trimmed || sendMessageLockRef.current) return

    sendMessageLockRef.current = true

    const next: Message = {
      id: `local-${crypto.randomUUID()}`,
      roomId: activeRoomId,
      userId: currentUserId,
      content: trimmed,
      createdAt: new Date().toISOString(),
    }

    const { error } = await supabase.from("message").insert({
      room_id: next.roomId,
      user_id: next.userId,
      content: next.content,
      created_at: next.createdAt,
    })

    if (error) {
      console.error(error)
      sendMessageLockRef.current = false
      return
    }

    setDraft("")
    sendMessageLockRef.current = false
  }

  const handleLoadPrevious = () => {
    if (loadPreviousLockRef.current || isLoadingPrevious || !hasMorePrevious) {
      return false
    }

    loadPreviousLockRef.current = true
    void loadPrevious().finally(() => {
      loadPreviousLockRef.current = false
    })

    return true
  }

  const formattedParticipants = useMemo(
    () => members.length.toLocaleString("ko-KR"),
    [members.length],
  )

  return (
    <div className="dark flex min-h-screen w-full flex-col bg-zinc-950 text-foreground md:flex-row">
      <MemberList members={members} />

      <aside className="flex min-h-0 flex-1 flex-col border-white/10 bg-background md:h-[min(100dvh,100vh)] md:w-[min(100%,380px)] md:shrink-0 md:border-l">
        <header className="shrink-0 border-b border-border px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="line-clamp-2 text-sm font-semibold leading-tight">
              {room?.name ?? "채팅방"}
            </h1>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formattedParticipants}명
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
            {room?.description ?? ""}
          </p>
        </header>

        <MessageList
          messages={messages}
          displayNameByUserId={displayNameByUserId}
          currentUserId={currentUserId}
          hasMorePrevious={hasMorePrevious}
          isLoadingPrevious={isLoadingPrevious || isLoadingInitial}
          onReachTop={handleLoadPrevious}
        />

        <MessageInput
          draft={draft}
          onDraftChange={setDraft}
          onSend={handleSend}
        />
      </aside>
    </div>
  )
}
