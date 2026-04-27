"use client"

import Link from "next/link"

import { useChatRoom } from "@/hooks/use-chat-room"
import { Spinner } from "@/components/ui/spinner"

import { MemberList } from "./member-list"
import { MessageInput } from "./message-input"
import { MessageList } from "./message-list"

interface Props {
  roomId: string
}

export function ChatRoom({ roomId }: Props) {
  const {
    profilePending,
    currentUserId,
    messages,
    hasMorePrevious,
    isLoadingPrevious,
    isLoadingInitial,
    room,
    roomPending,
    formattedParticipants,
    handleLoadPrevious,
    roomMissing,
    inputLocked,
  } = useChatRoom(roomId)

  if (profilePending) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    )
  }

  if (!roomId) {
    return (
      <div className="dark flex h-full min-h-0 flex-col items-center justify-center gap-3 bg-zinc-950 px-4 text-center text-zinc-200">
        <p className="text-sm">방 정보가 없습니다.</p>
        <Link href="/" className="text-sm underline">
          처음으로
        </Link>
      </div>
    )
  }

  if (roomMissing) {
    return (
      <div className="dark flex h-full min-h-0 flex-col items-center justify-center gap-3 bg-zinc-950 px-4 text-center text-zinc-200">
        <p className="text-sm">존재하지 않는 채팅방이거나 불러올 수 없습니다.</p>
        <Link href="/" className="text-sm underline">
          처음으로
        </Link>
      </div>
    )
  }

  return (
    <div className="dark flex h-full min-h-0 w-full flex-col overflow-hidden bg-zinc-950 text-foreground md:flex-row">
      <MemberList roomId={roomId} />

      <aside className="flex min-h-0 flex-1 flex-col border-white/10 bg-background md:w-[min(100%,380px)] md:shrink-0 md:border-l">
        <header className="shrink-0 border-b border-border px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="line-clamp-2 text-sm font-semibold leading-tight">
              {roomPending ? "불러오는 중…" : (room?.title ?? "채팅방")}
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
          currentUserId={currentUserId}
          hasMorePrevious={hasMorePrevious}
          isLoadingPrevious={isLoadingPrevious || isLoadingInitial}
          onReachTop={handleLoadPrevious}
        />

        <MessageInput
          roomId={roomId}
          currentUserId={currentUserId}
          disabled={inputLocked}
          disabledHint={
            profilePending
              ? "프로필을 불러오는 중입니다."
              : "로그인 프로필을 확인할 수 없습니다."
          }
        />
      </aside>
    </div>
  )
}
