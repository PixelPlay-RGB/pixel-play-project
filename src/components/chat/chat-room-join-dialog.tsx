"use client";
// 채팅방 진입 상태(신규/재입장/밴/방없음/에러)에 따라 분기 텍스트를 보여주는 입장 확인 다이얼로그

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { joinChatRoomAction } from "@/actions/chat-room";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  left: (title) =>
    title
      ? `"${title}"에서 이전에 나가셨습니다. 다시 참여하시겠습니까?`
      : "이전에 나가신 채팅방입니다. 다시 참여하시겠습니까?",
  banned: () => "입장이 제한된 채팅방입니다.",
  room_not_found: () => "존재하지 않는 채팅방입니다.",
  error: () => "채팅방 정보를 불러오지 못했습니다.",
};

export function ChatRoomJoinDialog({ roomId, roomTitle, status, onJoinSuccess, onCancel }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  const canJoin = status === "new" || status === "left";

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
        className={cn("max-w-md gap-0 overflow-hidden p-0", "rounded-3xl")}
      >
        <DialogHeader className={cn("border-border/50 border-b px-6 pt-6 pb-4")}>
          <DialogTitle className="text-base font-bold">채팅방 입장</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5 px-6 py-5">
          <p className="text-muted-foreground text-sm">{DIALOG_MESSAGES[status](roomTitle)}</p>
          <div className="flex gap-2.5">
            <Button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={isJoining}
              className={cn(
                "border-border h-auto flex-1 rounded-xl border py-2.5 transition-all",
                "text-muted-foreground text-sm font-semibold",
                "hover:bg-muted/50 hover:text-foreground",
              )}
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
