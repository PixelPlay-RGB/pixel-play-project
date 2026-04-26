"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Message } from "@/types/chat"
import { cn } from "@/lib/utils"
import { useRoomMembers } from "@/hooks/use-room-members"

interface Props {
  message: Message
  isOwn: boolean
}

export function MessageItem({ message, isOwn }: Props) {
  const { data: members = [] } = useRoomMembers(message.chat_room_id)

  const member = members.find((m) => m.user_id === message.user_id)
  const displayName = member?.user?.nickname?.trim() || message.user_id.slice(0, 8)
  const initials = displayName.slice(0, 2)

  if (isOwn) {
    return (
      <div className="flex justify-end px-2 py-0.5">
        <div
          className={cn(
            "max-w-[88%] rounded-lg px-2.5 py-1.5 text-sm leading-snug",
            "bg-primary text-primary-foreground",
          )}
        >
          <span className="break-words">{message.content}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 px-2 py-0.5">
      <Avatar size="sm" className="mt-0.5">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 text-xs font-medium text-[#94eaff]">{displayName}</div>
        <div
          className={cn(
            "inline-block max-w-full rounded-md px-2 py-1 text-sm leading-snug",
            "bg-muted/60 text-foreground",
          )}
        >
          <span className="break-words">{message.content}</span>
        </div>
      </div>
    </div>
  )
}
