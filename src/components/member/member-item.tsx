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
  const nickname = member.user.nickname;
  const photoUrl = member.user.photo_url;
  const fallbackText = getAvatarFallbackText(nickname);

  if (!canManage) {
    return (
      <div className="flex w-full items-center gap-3 rounded-md px-3 py-2">
        <Avatar size="default" className="shrink-0">
          {photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
          <AvatarFallback>{fallbackText}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 truncate text-sm text-foreground">{nickname}</span>
      </div>
    );
  }

  return (
    <MemberActionPopover roomId={roomId} member={member}>
      <Button
        variant="ghost"
        className="flex h-auto w-full items-center justify-start gap-3 rounded-md px-3 py-2 font-normal transition-colors"
      >
        <Avatar size="default" className="shrink-0">
          {photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
          <AvatarFallback>{fallbackText}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 truncate text-sm text-foreground">{nickname}</span>
      </Button>
    </MemberActionPopover>
  );
}
