// 채팅방 참여자 관리 액션 메뉴를 표시하는 Popover
import { Crown, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { MemberActionAlertDialog } from "@/components/chat-room/member/member-action-alert-dialog";
import type { RoomMemberQuery } from "@/types/chat-room-member";
import type { ReactElement } from "react";

interface Props {
  roomId: string;
  member: RoomMemberQuery;
  children: ReactElement;
}

export function MemberActionPopover({ roomId, member, children }: Props) {
  const { nickname } = member.user;

  return (
    <Popover>
      <PopoverTrigger render={children} />
      <PopoverContent className="w-56 gap-1 p-1.5" align="start" side="right">
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-semibold">{nickname}</p>
          <p className="text-muted-foreground text-xs">참여자 관리</p>
        </div>

        <Separator />

        <MemberActionAlertDialog
          action="transfer"
          roomId={roomId}
          targetUserId={member.user_id}
          targetNickname={nickname}
          trigger={
            <Button variant="ghost" className="w-full justify-start">
              <Crown className="size-4" />
              권한 위임
            </Button>
          }
        />

        <MemberActionAlertDialog
          action="kick"
          roomId={roomId}
          targetUserId={member.user_id}
          targetNickname={nickname}
          trigger={
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive w-full justify-start"
            >
              <UserX className="size-4" />
              강퇴하기
            </Button>
          }
        />
      </PopoverContent>
    </Popover>
  );
}
