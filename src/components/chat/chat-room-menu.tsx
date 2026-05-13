"use client";

// 채팅방 헤더 더보기 메뉴(나가기 및 추후 기능 진입점)

import { useState } from "react";

import { MoreVertical } from "lucide-react";

import { ChatRoomLeaveAlertDialog } from "@/components/chat/chat-room-leave-alert-dialog";
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
import { toast } from "sonner";

interface Props {
  roomId: string;
  ownerId: string;
  currentUserId: string;
}

function mapLeaveRoomError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("owner cannot leave")) return "방장은 채팅방을 나갈 수 없습니다.";
  if (lower.includes("not an active member")) return "참여 중이 아니거나 이미 나간 상태입니다.";
  if (lower.includes("not a member")) return "참여 중인 채팅방이 아닙니다.";
  if (lower.includes("room not found")) return "채팅방을 찾을 수 없습니다.";
  return "채팅방 나가기에 실패했습니다.";
}

export function ChatRoomMenu({ roomId, ownerId, currentUserId }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const { mutate, isPending } = useLeaveChatRoom();
  const isOwner = currentUserId === ownerId;

  const handleLeave = () => {
    mutate(roomId, {
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : "";
        toast.error(mapLeaveRoomError(msg));
      },
    });
  };

  if (!currentUserId) {
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
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label="채팅방 메뉴"
            >
              <MoreVertical data-icon="inline-start" />
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
            disabled={isOwner}
            onClick={() => {
              if (isOwner) return;
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
        onConfirmLeave={handleLeave}
      />
    </>
  );
}
