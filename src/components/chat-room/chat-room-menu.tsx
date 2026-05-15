"use client";

// 채팅방 헤더 더보기 메뉴(나가기 및 추후 기능 진입점)

import { useState } from "react";

import { Ellipsis } from "lucide-react";

import { ChatRoomLeaveAlertDialog } from "@/components/chat-room/chat-room-leave-alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLeaveChatRoom } from "@/hooks/use-leave-chat-room";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { useRoom } from "@/hooks/use-chat-room";
import { useUser } from "@/hooks/use-profile";
import { resolveRpcErrorCode } from "@/utils/app-message";
import { toastAppError, toastAppInfo } from "@/utils/toast-message";

interface Props {
  roomId: string;
}

export function ChatRoomMenu({ roomId }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const { mutate, isPending } = useLeaveChatRoom();
  const { data: profile } = useUser();
  const roomQuery = useRoom(roomId);

  const currentUserId = profile?.id ?? "";
  const ownerId = roomQuery.data?.owner_id ?? "";
  const currentMember = roomQuery.data?.current_member ?? 0;
  const isOwner = currentUserId === ownerId;
  const isOwnerLeaveBlocked = isOwner && currentMember > 1;

  const handleLeave = () => {
    mutate(roomId, {
      onError: (err: unknown) => {
        console.error("ChatRoomMenu leave error", err);
        toastAppError(resolveRpcErrorCode(err, APP_MESSAGE_CODE.error.chatRoom.leaveFailed));
      },
    });
  };

  if (!currentUserId || !roomQuery.data) {
    return null;
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          render={(props) => (
            <Button
              {...props}
              type="button"
              variant="ghost"
              size="icon-lg"
              className="hover:text-foreground shrink-0"
              aria-label="채팅방 메뉴"
            >
              <Ellipsis data-icon="inline-start" />
            </Button>
          )}
        />
        <DropdownMenuContent align="end" side="bottom" sideOffset={4} className="min-w-40">
          <DropdownMenuGroup>
            <DropdownMenuLabel>채팅방</DropdownMenuLabel>
            <DropdownMenuItem disabled className="text-muted-foreground">
              알림 설정
              <DropdownMenuShortcut>예정</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              if (isOwnerLeaveBlocked) {
                toastAppInfo(APP_MESSAGE_CODE.error.chatRoom.leaveOwnerBlocked);
                return;
              }
              setMenuOpen(false);
              setLeaveOpen(true);
            }}
          >
            채팅방 나가기
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChatRoomLeaveAlertDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        isPending={isPending}
        isOwner={isOwner}
        onConfirmLeave={handleLeave}
      />
    </>
  );
}
