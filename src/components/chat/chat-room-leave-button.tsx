"use client";

// 채팅방 나가기 확인 다이얼로그 및 leave_chat_room RPC 실행

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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

export function ChatRoomLeaveButton({ roomId, ownerId, currentUserId }: Props) {
  const [open, setOpen] = useState(false);
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

  if (isOwner) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="xs"
        disabled
        className="text-muted-foreground shrink-0"
        title="방장은 채팅방을 나갈 수 없습니다."
      >
        나가기
      </Button>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="text-muted-foreground hover:text-destructive shrink-0"
          >
            나가기
          </Button>
        }
      />
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>채팅방 나가기</AlertDialogTitle>
          <AlertDialogDescription>
            이 채팅방에서 나가면 참여 목록에서 제거됩니다. 다시 들어오려면 해당 채팅방에 다시 참여해야 합니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            type="button"
            onClick={handleLeave}
          >
            {isPending ? "나가는 중…" : "나가기"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
