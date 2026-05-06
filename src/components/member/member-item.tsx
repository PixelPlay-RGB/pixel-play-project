
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { RoomMemberQuery } from "@/types/chat-room-member"

interface Props {
  member: RoomMemberQuery
}

export function MemberItem({ member }: Props) {
  const nickname = member.user?.nickname || member.user_id.slice(0, 8)
  const photoUrl = member.user?.photo_url ?? null
  const initials = nickname.slice(0, 2)

  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5">
      <Avatar size="sm" className="shrink-0">
        {photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 truncate text-sm text-foreground">
        {nickname}
      </span>
    </div>
  )
}
