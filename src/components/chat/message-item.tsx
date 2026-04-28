"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Message } from "@/types/message"
import { cn } from "@/lib/utils"

import type { MemberDisplayByUserId } from "@/types/chatroommember"

interface Props {
  message: Message
  isOwn: boolean
  memberDisplayByUserId: MemberDisplayByUserId
}

export function MessageItem({
  message,
  isOwn,
  memberDisplayByUserId,
}: Props) {
  const display = memberDisplayByUserId[message.user_id]
  const nickname = display?.nickname ?? message.user_id.slice(0, 8)
  const photoUrl = display?.photoUrl ?? null
  const initials = nickname.slice(0, 2)

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
        {photoUrl ? (
          <AvatarImage src={photoUrl} alt="" />
        ) : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 text-xs font-medium text-[#94eaff]">{nickname}</div>
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
