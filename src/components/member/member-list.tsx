import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MemberItem } from "./member-item";
import { useRoomMembers } from "@/hooks/use-room-members";

interface Props {
  roomId: string;
  currentUserId: string;
  ownerId?: string;
  className?: string;
}

export function MemberList({ roomId, currentUserId, ownerId, className }: Props) {
  const { data: members = [] } = useRoomMembers(roomId);
  const canManageMembers = !!currentUserId && currentUserId === ownerId;

  return (
    <section
      className={cn(
        "bg-background flex min-h-0 shrink-0 flex-col overflow-hidden",
        "md:border-border md:h-full md:w-80 md:shrink-0 md:border-r",
        className,
      )}
    >
      <div className="border-border/50 bg-muted/20 flex h-14 shrink-0 items-center border-b px-4">
        <span className="text-sm font-medium">채팅방 참여 인원</span>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <ul className="py-1.5" role="list">
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
