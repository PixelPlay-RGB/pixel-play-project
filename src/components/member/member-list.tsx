import { ScrollArea } from "@/components/ui/scroll-area";
import { MemberItem } from "./member-item";
import type { RoomMemberQuery } from "@/types/chat-room-member";

interface Props {
  members: RoomMemberQuery[];
}

export function MemberList({ members }: Props) {
  return (
    <section className="bg-background flex max-h-[38dvh] min-h-0 shrink-0 flex-col overflow-hidden border-white/10 md:h-full md:max-h-none md:w-[min(100%,260px)] md:shrink-0 md:border-r">
      <header className="border-border shrink-0 border-b px-3 py-2.5">
        <h2 className="text-sm leading-tight font-semibold">
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
  );
}
