"use client"

import { useMemo, useState } from "react"

import type { Message, Room, RoomMember } from "@/types/chat"

import { MemberList } from "./member-list"
import { MessageInput } from "./message-input"
import { MessageList } from "./message-list"

interface Props {
  roomId: string
}

const currentUserId = "userSelf"

const displayNameByUserId: Record<string, string> = {
  [currentUserId]: "나",
  streamer01: "스트리머",
  viewerKim: "김치좋아",
  viewerLee: "이펙트",
  viewerPark: "박물관",
}

function buildDummyRoom(roomId: string): Room {
  return {
    id: roomId,
    name: "저녁 랭크 같이 가요 🎮",
    description: "즐겜만 하시길",
    createdBy: "streamer01",
    createdAt: "2026-04-01T12:00:00.000Z",
  }
}

function buildDummyMembers(roomId: string): RoomMember[] {
  return [
    {
      id: `${roomId}-m1`,
      userId: "streamer01",
      name: "스트리머",
      joinedAt: "2026-04-21T10:00:00.000Z",
    },
    {
      id: `${roomId}-m2`,
      userId: "viewerKim",
      name: "김치좋아",
      joinedAt: "2026-04-21T10:05:00.000Z",
    },
    {
      id: `${roomId}-m3`,
      userId: "viewerLee",
      name: "이펙트",
      joinedAt: "2026-04-21T10:06:00.000Z",
    },
    {
      id: `${roomId}-m4`,
      userId: "viewerPark",
      name: "박물관",
      joinedAt: "2026-04-21T10:07:00.000Z",
    },
    {
      id: `${roomId}-m5`,
      userId: "userSelf",
      name: "나",
      joinedAt: "2026-04-21T10:08:00.000Z",
    },
    {
      id: `${roomId}-m6`,
      userId: "guestOwl",
      name: "부엉이",
      joinedAt: "2026-04-21T10:09:00.000Z",
    },
  ]
}

function buildInitialMessages(roomId: string): Message[] {
  const base = Date.now()
  return [
    {
      id: "m1",
      roomId,
      userId: "streamer01",
      content: "오늘도 같이 즐겁게 놀아요 ~",
      createdAt: new Date(base - 3600000).toISOString(),
    },
    {
      id: "m2",
      roomId,
      userId: "viewerKim",
      content: "방송 언제까지 해요?",
      createdAt: new Date(base - 3500000).toISOString(),
    },
    {
      id: "m3",
      roomId,
      userId: "viewerLee",
      content: "오늘 컨텐츠 미쳤다 ㅋㅋ",
      createdAt: new Date(base - 3400000).toISOString(),
    },
    {
      id: "m4",
      roomId,
      userId: currentUserId,
      content: "저도 한판만 같이 할게요!",
      createdAt: new Date(base - 3300000).toISOString(),
    },
    {
      id: "m5",
      roomId,
      userId: "viewerPark",
      content: "ㄱㄱㄱ 하이라이트 각이다",
      createdAt: new Date(base - 3200000).toISOString(),
    },
  ]
}

export function ChatRoom({ roomId }: Props) {
  const room = useMemo(() => buildDummyRoom(roomId), [roomId])
  const members = useMemo(() => buildDummyMembers(roomId), [roomId])
  const [participantCount] = useState(12847)
  const [messages, setMessages] = useState<Message[]>(() =>
    buildInitialMessages(roomId),
  )
  const [draft, setDraft] = useState("")

  const handleSend = () => {
    const trimmed = draft.trim()
    if (!trimmed) return

    const next: Message = {
      id: `local-${crypto.randomUUID()}`,
      roomId,
      userId: currentUserId,
      content: trimmed,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, next])
    setDraft("")
  }

  const formattedParticipants = useMemo(
    () => participantCount.toLocaleString("ko-KR"),
    [participantCount],
  )

  return (
    <div className="dark flex min-h-screen w-full flex-col bg-zinc-950 text-foreground md:flex-row">
      <MemberList members={members} />

      <aside className="flex min-h-0 flex-1 flex-col border-white/10 bg-background md:h-[min(100dvh,100vh)] md:w-[min(100%,380px)] md:shrink-0 md:border-l">
        <header className="shrink-0 border-b border-border px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="line-clamp-2 text-sm font-semibold leading-tight">
              {room.name}
            </h1>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formattedParticipants}명
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
            {room.description}
          </p>
        </header>

        <MessageList
          messages={messages}
          displayNameByUserId={displayNameByUserId}
          currentUserId={currentUserId}
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
