"use client";

// 채팅방 멤버 관리 액션을 확인하고 실행하는 AlertDialog
import { useState, type ReactElement } from "react";
import { Crown, UserX } from "lucide-react";

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
import { MEMBER_ACTION_COPY, type MemberAction } from "@/constants/chat-room-member";
import { useChatRoomMemberAction } from "@/hooks/use-chat-room-member-action";
import { cn } from "@/lib/utils";

interface Props {
  action: MemberAction;
  roomId: string;
  targetUserId: string;
  targetNickname: string;
  trigger: ReactElement;
}

export function MemberActionAlertDialog({
  action,
  roomId,
  targetUserId,
  targetNickname,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const copy = MEMBER_ACTION_COPY[action];
  const isKick = action === "kick";
  const { mutate, isPending } = useChatRoomMemberAction({ action, roomId });

  const handleConfirm = () => {
    mutate(
      { targetUserId },
      {
        onSuccess: (result) => {
          if (result.success) {
            setOpen(false);
          }
        },
      },
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent
        className={cn(
          "overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-md",
          isKick
            ? "border-destructive/20 shadow-destructive/10"
            : "border-brand/20 shadow-brand/10 dark:border-brand/10",
        )}
      >
        <AlertDialogHeader
          className={cn(
            "flex items-center gap-4 border-b px-5 pt-5 pb-4 text-left",
            isKick ? "bg-destructive/5 border-destructive/10" : "bg-brand/5 border-brand/10",
          )}
        >
          <AlertDialogMedia
            className={cn(
              "mb-0 shrink-0 rounded-xl ring-1",
              isKick
                ? "bg-destructive/10 text-destructive ring-destructive/20"
                : "bg-brand/10 text-brand ring-brand/20",
            )}
          >
            {isKick ? <UserX /> : <Crown />}
          </AlertDialogMedia>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <AlertDialogTitle className="text-lg leading-tight font-bold">
              {copy.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-snug text-pretty">
              {targetNickname}
              {copy.description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="m-0 flex-row justify-end gap-2 border-0 bg-transparent px-5 pt-4 pb-5">
          <AlertDialogCancel
            className={cn(
              "h-10 min-w-24 rounded-xl px-4 font-semibold",
              "border-border bg-background text-foreground hover:bg-muted",
            )}
            disabled={isPending}
          >
            돌아가기
          </AlertDialogCancel>
          <AlertDialogAction
            variant={isKick ? "destructive" : "default"}
            className={cn(
              "h-10 min-w-24 rounded-xl px-4 font-bold shadow-sm",
              isKick
                ? "shadow-destructive/10"
                : "bg-brand shadow-brand/20 hover:bg-brand/90 text-white",
            )}
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
