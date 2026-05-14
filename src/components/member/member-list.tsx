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
        "flex min-h-0 shrink-0 flex-col overflow-hidden bg-background",
        "md:h-full md:w-80 md:shrink-0 md:border-r md:border-border",
        className,
      )}
    >
      <div className="flex shrink-0 items-center border-b border-border/50 bg-muted/20 px-4 py-2.5">
        <span className="text-xs font-medium text-muted-foreground">
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
