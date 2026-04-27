
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { RoomMemberQuery } from "@/types/chatroommember"

interface Props {
  member: RoomMemberQuery
}

export function MemberItem({ member }: Props) {
  const displayName = member.user?.nickname?.trim() || member.user_id.slice(0, 8)
  const initials = displayName.slice(0, 2)

  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5">
      <Avatar size="sm" className="shrink-0">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 truncate text-sm text-foreground">
        {displayName}
      </span>
    </div>
  )
}
