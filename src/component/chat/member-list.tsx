"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import type { RoomMember } from "@/types/chat"

import { MemberItem } from "./member-item"

interface Props {
  members: RoomMember[]
}

export function MemberList({ members }: Props) {
  const countLabel = members.length.toLocaleString("ko-KR")

  return (
    <section className="flex min-h-[40vh] shrink-0 flex-col border-white/10 bg-background md:h-[min(100dvh,100vh)] md:min-h-0 md:w-[min(100%,260px)] md:border-r">
      <header className="shrink-0 border-b border-border px-3 py-2.5">
        <h2 className="text-sm font-semibold leading-tight">
          참여자 목록 {countLabel}명
        </h2>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <ul className="py-1" role="list">
          {members.map((member) => (
            <li key={member.id}>
              <MemberItem member={member} />
            </li>
          ))}
        </ul>
      </ScrollArea>
    </section>
  )
}
