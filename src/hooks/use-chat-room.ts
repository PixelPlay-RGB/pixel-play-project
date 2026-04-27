"use client"

import { useCallback, useMemo, useRef } from "react"

import { useUser } from "@/hooks/use-profile"
import { useRoom } from "@/hooks/use-room"
import { useRoomMembers } from "@/hooks/use-room-members"
import useMessages from "@/hooks/use-messages"

export function useChatRoom(roomId: string) {
  const { data: profile, isPending: profilePending } = useUser()

  const {
    messages,
    hasMorePrevious,
    isLoadingPrevious,
    loadPrevious,
    isLoadingInitial,
  } = useMessages(roomId)

  const loadPreviousLockRef = useRef(false)

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
    handleLoadPrevious,
    roomMissing,
    inputLocked,
  }
}
