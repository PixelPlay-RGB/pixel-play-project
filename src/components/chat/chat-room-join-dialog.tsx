"use client";
// 채팅방 신규 입장 상태에 따라 확인 텍스트를 보여주는 입장 확인 다이얼로그

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { joinChatRoomAction } from "@/actions/chat-room";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { DialogEntryStatus } from "@/hooks/use-chat-room-entry-status";

interface Props {
  roomId: string;
  roomTitle: string | null;
  status: DialogEntryStatus;
  onJoinSuccess: () => void;
  onCancel?: () => void;
}

const DIALOG_MESSAGES: Record<DialogEntryStatus, (title: string | null) => string> = {
  new: (title) => (title ? `"${title}"에 참여하시겠습니까?` : "채팅방에 참여하시겠습니까?"),
  full: () => "정원이 가득 찬 채팅방입니다.",
};

export function ChatRoomJoinDialog({ roomId, roomTitle, status, onJoinSuccess, onCancel }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  const canJoin = status === "new";

  const handleOpenChange = (nextOpen: boolean) => {
    if (isJoining) return;
    if (!nextOpen) {
      if (onCancel) {
        onCancel();
      } else {
        router.push("/");
      }
    }
    setOpen(nextOpen);
  };

  const handleJoin = async () => {
    if (isJoining) return;
    setIsJoining(true);
    try {
      const result = await joinChatRoomAction(roomId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      onJoinSuccess();
    } catch {
      toast.error("채팅방 입장 중 오류가 발생했습니다.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn("max-w-md gap-0 overflow-hidden p-0")}
      >
        <DialogHeader className={cn("border-border/50 border-b px-6 pt-6 pb-4")}>
          <DialogTitle className="text-base font-bold">채팅방 입장</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5 px-6 py-5">
          <DialogDescription>{DIALOG_MESSAGES[status](roomTitle)}</DialogDescription>
          <DialogFooter className="mx-0 mb-0 flex-row justify-start gap-2.5 border-t-0 bg-transparent p-0 sm:justify-start">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isJoining}
              className="h-auto flex-1 rounded-xl py-2.5 font-semibold text-muted-foreground"
            >
              {canJoin ? "취소" : "돌아가기"}
            </Button>
            {canJoin && (
              <Button
                onClick={handleJoin}
                disabled={isJoining}
                className={cn(
                  "bg-brand h-auto flex-1 rounded-xl py-2.5 transition-all",
                  "shadow-brand/20 text-sm font-bold text-white shadow-sm",
                  "hover:opacity-90 active:scale-95",
                )}
              >
                {isJoining ? "입장 중..." : "입장"}
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
