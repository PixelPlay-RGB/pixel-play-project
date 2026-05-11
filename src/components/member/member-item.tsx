// 채팅방 참여자 목록의 단일 항목을 표시하는 컴포넌트
import { MemberActionPopover } from "@/components/member/member-action-popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { RoomMemberQuery } from "@/types/chat-room-member";
import { getAvatarFallbackText } from "@/utils/avatar";

interface Props {
  roomId: string;
  member: RoomMemberQuery;
  canManage: boolean;
}

export function MemberItem({ roomId, member, canManage }: Props) {
  const displayName = member.user?.nickname ?? member.user_id.slice(0, 8);
  const photoUrl = member.user?.photo_url ?? null;
  const fallbackText = getAvatarFallbackText(displayName);

  if (!canManage) {
    return (
      <div className="flex w-full items-center gap-2.5 px-2 py-1.5 text-left transition-colors">
        <Avatar size="sm" className="shrink-0">
          {photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
          <AvatarFallback>{fallbackText}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 truncate text-sm text-foreground">
          {displayName}
        </span>
      </div>
    );
  }

  return (
    <MemberActionPopover roomId={roomId} member={member}>
      <Button
        variant="ghost"
        className="flex h-auto w-full items-center gap-2.5 justify-start rounded-md px-2 py-1.5 font-normal transition-colors"
      >
        <Avatar size="sm" className="shrink-0">
          {photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
          <AvatarFallback>{fallbackText}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 truncate text-sm text-foreground">
          {displayName}
        </span>
      </Button>
    </MemberActionPopover>
  );
}
