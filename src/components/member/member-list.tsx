import { ScrollArea } from "@/components/ui/scroll-area";
import { MemberItem } from "./member-item";
import { useRoomMembers } from "@/hooks/use-room-members";

interface Props {
  roomId: string;
  currentUserId: string;
  ownerId?: string;
}

export function MemberList({ roomId, currentUserId, ownerId }: Props) {
  const { data: members = [] } = useRoomMembers(roomId);
  const canManageMembers = !!currentUserId && currentUserId === ownerId;

  return (
    <section className="flex max-h-[38dvh] min-h-0 shrink-0 flex-col overflow-hidden border-border bg-background md:h-full md:max-h-none md:w-[min(100%,260px)] md:shrink-0 md:border-r">
      <div className="border-border flex shrink-0 items-center border-b px-3 py-2.5">
        <span className="text-muted-foreground text-xs font-medium">
          참여자 {members.length.toLocaleString("ko-KR")}명
        </span>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <ul className="py-1" role="list">
          {members.map((member) => (
            <li key={`${member.chat_room_id}-${member.user_id}`}>
              <MemberItem
                roomId={roomId}
                member={member}
                canManage={canManageMembers && member.user_id !== currentUserId}
              />
            </li>
          ))}
        </ul>
      </ScrollArea>
    </section>
  );
}
