
import { ScrollArea } from "@/components/ui/scroll-area"
import { MemberItem } from "./member-item"
import { useRoomMembers } from "@/hooks/use-room-members"

interface Props {
  roomId: string
}

export function MemberList({ roomId }: Props) {
  const { data: members = [] } = useRoomMembers(roomId)

  return (
    <section className="flex max-h-[38dvh] min-h-0 shrink-0 flex-col overflow-hidden border-white/10 bg-background md:max-h-none md:h-full md:w-[min(100%,260px)] md:shrink-0 md:border-r">
      <header className="shrink-0 border-b border-border px-3 py-2.5">
        <h2 className="text-sm font-semibold leading-tight">
          참여자 목록 {members.length.toLocaleString("ko-KR")}명
        </h2>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <ul className="py-1" role="list">
          {members.map((member) => (
            <li key={`${member.chat_room_id}-${member.user_id}`}>
              <MemberItem member={member} />
            </li>
          ))}
        </ul>
      </ScrollArea>
    </section>
  )
}
