"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { ERROR_MESSAGES } from "@/constants/errors"
import { createClient } from "@/lib/supabase/client"
import useMessages from "@/hooks/use-messages"
import { useUser } from "@/hooks/use-profile"
import { useRoom } from "@/hooks/use-room"
import { useRoomMembers } from "@/hooks/use-room-members"

export function useChatRoom(roomId: string) {
  const supabase = createClient()
  const { data: profile, isPending: profilePending } = useUser()

  const {
    messages,
    hasMorePrevious,
    isLoadingPrevious,
    loadPrevious,
    isLoadingInitial,
  } = useMessages(roomId)

  const [draft, setDraft] = useState("")
  const loadPreviousLockRef = useRef(false)
  const sendMessageLockRef = useRef(false)

  const {
    data: room,
    error: roomError,
    isPending: roomPending,
    isFetched: roomFetched,
  } = useRoom(roomId)

  const { data: members = [] } = useRoomMembers(roomId)

  const formattedParticipants = useMemo(
    () => members.length.toLocaleString("ko-KR"),
    [members.length],
  )

  const currentUserId = profile?.id ?? ""

  const handleSend = useCallback(async () => {
    const trimmed = draft.trim()
    if (
      !trimmed ||
      sendMessageLockRef.current ||
      !currentUserId ||
      !roomId
    ) {
      return
    }

    sendMessageLockRef.current = true

    const { error } = await supabase.from("message").insert({
      chat_room_id: roomId,
      user_id: currentUserId,
      content: trimmed,
    })

    if (error) {
      console.error(error)
      const errorConfig =
        ERROR_MESSAGES[error.code] || ERROR_MESSAGES.DEFAULT
      toast.error(errorConfig.title, {
        description: errorConfig.description,
      })
      sendMessageLockRef.current = false
      return
    }

    setDraft("")
    sendMessageLockRef.current = false
  }, [currentUserId, draft, roomId, supabase])

  const handleLoadPrevious = useCallback((): boolean => {
    if (loadPreviousLockRef.current || isLoadingPrevious || !hasMorePrevious) {
      return false
    }

    loadPreviousLockRef.current = true
    void loadPrevious().finally(() => {
      loadPreviousLockRef.current = false
    })

    return true
  }, [hasMorePrevious, isLoadingPrevious, loadPrevious])

  const roomMissing =
    !!roomId && roomFetched && (roomError != null || room == null)

  const inputLocked = profilePending || !currentUserId

  return {
    profilePending,
    currentUserId,
    messages,
    hasMorePrevious,
    isLoadingPrevious,
    isLoadingInitial,
    room,
    roomError,
    roomPending,
    roomFetched,
    formattedParticipants,
    draft,
    setDraft,
    handleSend,
    handleLoadPrevious,
    roomMissing,
    inputLocked,
  }
}
