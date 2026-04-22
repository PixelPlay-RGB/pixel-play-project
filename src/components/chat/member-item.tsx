"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { RoomMember } from "@/types/chat"

interface Props {
  member: RoomMember
}

export function MemberItem({ member }: Props) {
  const initials = member.name.slice(0, 2)

  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5">
      <Avatar size="sm" className="shrink-0">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 truncate text-sm text-foreground">
        {member.name}
      </span>
    </div>
  )
}
