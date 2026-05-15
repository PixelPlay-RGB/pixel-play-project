// 미참여 유저에게 채팅방 참여 여부를 묻는 Dialog (정원 마감 시 안내만 표시)
"use client";

import { useRouter } from "next/navigation";
import { DoorOpen, Users } from "lucide-react";

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
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useJoinChatRoom } from "@/hooks/use-join-chat-room";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  roomId: string;
  roomTitle: string;
  isFull: boolean;
}

export function JoinChatRoomDialog({ open, roomId, roomTitle, isFull }: Props) {
  const router = useRouter();
  const { mutate, isPending } = useJoinChatRoom();

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        showCloseButton={false}
        className={cn(
          "overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-md",
          isFull
            ? "border-destructive/20 shadow-destructive/10"
            : "border-brand/20 shadow-brand/10",
        )}
      >
        <AlertDialogHeader
          className={cn(
            "flex items-center gap-4 border-b px-5 pt-5 pb-4 text-left",
            isFull ? "bg-destructive/5 border-destructive/10" : "bg-brand/5 border-brand/10",
          )}
        >
          <AlertDialogMedia
            className={cn(
              "mb-0 shrink-0 rounded-xl ring-1",
              isFull
                ? "bg-destructive/10 text-destructive ring-destructive/20"
                : "bg-brand/10 text-brand ring-brand/20",
            )}
          >
            {isFull ? <Users /> : <DoorOpen />}
          </AlertDialogMedia>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <AlertDialogTitle className="text-lg leading-tight font-bold">
              {roomTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-snug text-pretty">
              {isFull ? "정원이 가득 찬 채팅방입니다." : "채팅방에 참여하시겠습니까?"}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="m-0 flex-row justify-end gap-2 border-0 bg-transparent px-5 pt-4 pb-5">
          <AlertDialogCancel
            onClick={() => router.back()}
            className={cn(
              "h-10 min-w-24 rounded-xl px-4 font-semibold",
              "border-border bg-background text-foreground hover:bg-muted",
            )}
          >
            돌아가기
          </AlertDialogCancel>
          {!isFull && (
            <AlertDialogAction
              onClick={() => mutate(roomId)}
              disabled={isPending}
              className={cn(
                "h-10 min-w-24 rounded-xl px-4 font-bold shadow-sm",
                "bg-brand shadow-brand/20 hover:bg-brand/90 text-white",
              )}
            >
              {isPending ? <Spinner className="size-4" /> : "참여하기"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
