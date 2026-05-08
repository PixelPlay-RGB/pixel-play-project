"use client";

// 채팅방 멤버 관리 액션을 확인하고 실행하는 AlertDialog
import { useState, type ReactElement } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Crown, UserX } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { kickChatRoomMemberAction, transferChatRoomOwnerAction } from "@/actions/chat-room-member";
import { QUERY_KEYS } from "@/constants/query-keys";
import { cn } from "@/lib/utils";

type MemberAction = "kick" | "transfer";

interface Props {
  action: MemberAction;
  roomId: string;
  targetUserId: string;
  targetNickname: string;
  trigger: ReactElement;
}

const ACTION_COPY = {
  kick: {
    title: "강퇴하기",
    description: "님을 채팅방에서 강퇴하시겠습니까?",
    confirm: "강퇴하기",
    success: "참여자를 강퇴했습니다.",
  },
  transfer: {
    title: "방장 위임",
    description: "님에게 방장 권한을 위임하시겠습니까?",
    confirm: "위임하기",
    success: "방장 권한을 위임했습니다.",
  },
} as const;

export function MemberActionAlertDialog({
  action,
  roomId,
  targetUserId,
  targetNickname,
  trigger,
}: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const copy = ACTION_COPY[action];
  const isKick = action === "kick";

  const handleConfirm = async () => {
    setIsPending(true);

    const result = isKick
      ? await kickChatRoomMemberAction({ roomId, targetUserId })
      : await transferChatRoomOwnerAction({ roomId, targetUserId });

    setIsPending(false);

    if (!result.success) {
      toast.error(result.message ?? "작업에 실패했습니다.");
      return;
    }

    toast.success(copy.success);
    setOpen(false);
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.members(roomId) });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.room(roomId) });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.rooms() });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.counts() });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia
            className={isKick ? "bg-destructive/10 text-destructive" : "bg-brand/10 text-brand"}
          >
            {isKick ? <UserX /> : <Crown />}
          </AlertDialogMedia>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {targetNickname}
            {copy.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="w-25" disabled={isPending}>
            돌아가기
          </AlertDialogCancel>
          <AlertDialogAction
            variant={isKick ? "destructive" : "outline"}
            className={cn("w-25", !isKick && "border-brand! text-brand")}
            disabled={isPending}
            onClick={() => void handleConfirm()}
          >
            {isPending ? <Spinner /> : copy.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
