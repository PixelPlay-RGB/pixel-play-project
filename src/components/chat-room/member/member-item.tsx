// 채팅방 참여자 목록의 단일 항목을 표시하는 컴포넌트
import { MemberActionPopover } from "@/components/chat-room/member/member-action-popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RoomMemberQuery } from "@/types/chat-room-member";
import { getAvatarFallbackText } from "@/utils/avatar";
import { Crown } from "lucide-react";

interface Props {
  roomId: string;
  member: RoomMemberQuery;
  isOwner: boolean;
  canManage: boolean;
}

function OwnerBadge() {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5",
        "bg-brand/10 text-brand dark:bg-brand/15",
        "text-xs leading-none font-black tracking-tight",
      )}
    >
      <Crown className="size-2.5" aria-hidden />
      방장
    </span>
  );
}

function MemberContent({
  photoUrl,
  fallbackText,
  nickname,
  isOwner,
}: {
  photoUrl: string | null;
  fallbackText: string;
  nickname: string;
  isOwner: boolean;
}) {
  return (
    <>
      <div className="relative shrink-0">
        <Avatar size="default">
          {photoUrl ? <AvatarImage src={photoUrl} alt={`${nickname}의 프로필 사진`} /> : null}
          <AvatarFallback>{fallbackText}</AvatarFallback>
        </Avatar>
        {isOwner && (
          <span
            aria-hidden
            className="border-background bg-brand absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2"
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <span
          className={cn(
            "text-foreground min-w-0 truncate text-sm",
            isOwner ? "font-semibold" : "font-normal",
          )}
        >
          {nickname}
        </span>
        {isOwner && <OwnerBadge />}
      </div>
    </>
  );
}

export function MemberItem({ roomId, member, isOwner, canManage }: Props) {
  const nickname = member.user.nickname;
  const photoUrl = member.user.photo_url;
  const fallbackText = getAvatarFallbackText(nickname);

  if (!canManage) {
    return (
      <div
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2",
          isOwner && "bg-brand/5 dark:bg-brand/10",
        )}
      >
        <MemberContent
          photoUrl={photoUrl}
          fallbackText={fallbackText}
          nickname={nickname}
          isOwner={isOwner}
        />
      </div>
    );
  }

  return (
    <MemberActionPopover roomId={roomId} member={member}>
      <Button
        variant="ghost"
        className={cn(
          "flex h-auto w-full items-center justify-start gap-3 rounded-md px-3 py-2 font-normal transition-colors",
          isOwner && "bg-brand/5 hover:bg-brand/10 dark:bg-brand/10 dark:hover:bg-brand/15",
        )}
      >
        <MemberContent
          photoUrl={photoUrl}
          fallbackText={fallbackText}
          nickname={nickname}
          isOwner={isOwner}
        />
      </Button>
    </MemberActionPopover>
  );
}
