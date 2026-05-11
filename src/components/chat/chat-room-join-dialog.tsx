"use client";
// 채팅방 최초 입장 확인 다이얼로그 — 비멤버가 처음 방 URL에 진입할 때 표시

import { useRef, useState } from "react";
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

interface Props {
  roomId: string;
  roomTitle?: string | null;
}

export function ChatRoomJoinDialog({ roomId, roomTitle }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  // 입장 성공 여부를 기록하는 플래그 — dialog가 닫힐 때 성공으로 인한 닫힘인지 취소인지 구분하기 위해 사용
  const hasJoinedRef = useRef(false);

  // dialog가 닫힐 때 호출 — 입장 성공 이후의 닫힘이 아니라면 채팅방 목록(홈)으로 이동
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !hasJoinedRef.current) {
      router.push("/");
    }
    setOpen(nextOpen);
  };

  // "입장" 버튼 클릭 시 멤버십을 생성하고, 성공하면 서버 컴포넌트를 재실행해 채팅방 화면으로 전환
  const handleJoin = async () => {
    setIsJoining(true);
    const result = await joinChatRoomAction(roomId);
    if (result.error) {
      toast.error(result.error);
      setIsJoining(false);
      return;
    }
    hasJoinedRef.current = true;
    setOpen(false);
    // router.push 대신 refresh — URL 변경 없이 page.tsx 서버 컴포넌트만 재실행해 멤버십 재확인 후 ChatRoom을 렌더
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>채팅방 입장</DialogTitle>
          {roomTitle && (
            <DialogDescription>
              &ldquo;{roomTitle}&rdquo;에 입장하시겠습니까?
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isJoining}
          >
            취소
          </Button>
          <Button
            onClick={handleJoin}
            disabled={isJoining}
            className={cn(
              "bg-brand font-bold text-white",
              "transition-all hover:opacity-90 active:scale-95",
            )}
          >
            {isJoining ? "입장 중..." : "입장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
