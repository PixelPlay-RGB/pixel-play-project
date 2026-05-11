"use client";

import { createChatRoomAction } from "@/actions/chat-room";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { CHAT_ROOM_MAX_CAPACITY, CHAT_ROOM_MIN_CAPACITY } from "@/constants/chat-room";
import { QUERY_KEYS } from "@/constants/query-keys";
import { cn } from "@/lib/utils";
import { CREATE_CHAT_ROOM_DEFAULT_VALUES, createChatRoomSchema } from "@/lib/zod/chat-room";
import type { CreateChatRoomInput } from "@/lib/zod/chat-room";
import { toastAppError, toastAppSuccess } from "@/utils/toast-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

export default function CreateChatRoomDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CreateChatRoomInput>({
    resolver: zodResolver(createChatRoomSchema),
    mode: "onChange",
    defaultValues: CREATE_CHAT_ROOM_DEFAULT_VALUES,
  });

  const title = useWatch({ control, name: "title" }) ?? "";
  const description = useWatch({ control, name: "description" }) ?? "";

  const handleCreateRoom = async (values: CreateChatRoomInput) => {
    const result = await createChatRoomAction(values);

    if (!result.success) {
      toastAppError(result.code ?? APP_MESSAGE_CODE.error.chatRoom.createFailed);
      return;
    }

    toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.chatRoom.created);
    setOpen(false);
    reset(CREATE_CHAT_ROOM_DEFAULT_VALUES);
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.all });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          "flex items-center gap-1.5 self-end px-5 py-2",
          "bg-brand shadow-brand/25 rounded-xl text-sm font-bold text-white shadow-sm",
          "cursor-pointer transition-all hover:opacity-90 active:scale-95",
        )}
      >
        <Plus className="h-4 w-4" />
        채팅방 만들기
      </DialogTrigger>
      <DialogContent className={cn("max-w-md gap-0 overflow-hidden p-0", "rounded-3xl")}>
        <DialogHeader className={cn("border-border/50 border-b px-6 pt-6 pb-4")}>
          <DialogTitle className="text-base font-bold">채팅방 생성</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleCreateRoom)} className="flex flex-col gap-5 px-6 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-muted-foreground text-xs font-semibold">방 제목</label>
            <Input
              autoFocus
              type="text"
              {...register("title")}
              placeholder="방 제목을 입력하세요"
              maxLength={50}
              className={cn(
                "h-auto rounded-xl px-4 py-2.5 text-sm transition-all",
                "border-border bg-muted/30 placeholder:text-muted-foreground/60",
                "focus-visible:border-brand/50 focus-visible:ring-brand/30",
                "dark:border-zinc-700/50 dark:bg-zinc-800/50",
              )}
            />
            <FieldError errors={[errors.title]} />
            <p className="text-muted-foreground text-right text-xs">{title.length} / 50</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-muted-foreground text-xs font-semibold">
              방 설명 <span className="font-normal opacity-60">(선택)</span>
            </label>
            <Textarea
              {...register("description")}
              placeholder="방의 목적이나 규칙을 적어주세요"
              maxLength={200}
              className={cn(
                "h-auto min-h-20 resize-none rounded-xl px-4 py-2.5 text-sm transition-all",
                "border-border bg-muted/30 placeholder:text-muted-foreground/60",
                "focus-visible:border-brand/50 focus-visible:ring-brand/30",
                "dark:border-zinc-700/50 dark:bg-zinc-800/50",
              )}
            />
            <FieldError errors={[errors.description]} />
            <p className="text-muted-foreground text-right text-xs">
              {description?.length ?? 0} / 200
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-muted-foreground text-xs font-semibold">참여 가능 인원</label>
            <Input
              type="number"
              {...register("capacity", { valueAsNumber: true })}
              min={CHAT_ROOM_MIN_CAPACITY}
              max={CHAT_ROOM_MAX_CAPACITY}
              className={cn(
                "h-auto rounded-xl px-4 py-2.5 text-sm transition-all",
                "border-border bg-muted/30",
                "focus-visible:border-brand/50 focus-visible:ring-brand/30",
                "dark:border-zinc-700/50 dark:bg-zinc-800/50",
              )}
            />
            <FieldError errors={[errors.capacity]} />
            <p className="text-muted-foreground text-xs">
              최소 {CHAT_ROOM_MIN_CAPACITY}명 · 최대 {CHAT_ROOM_MAX_CAPACITY}명
            </p>
          </div>
          <div className="mt-1 flex gap-2.5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              className={cn(
                "border-border h-auto flex-1 rounded-xl border py-2.5 transition-all",
                "text-muted-foreground text-sm font-semibold",
                "hover:bg-muted/50 hover:text-foreground",
              )}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={cn(
                "bg-brand h-auto flex-1 rounded-xl py-2.5 transition-all",
                "shadow-brand/20 text-sm font-bold text-white shadow-sm",
                "hover:opacity-90 active:scale-95",
              )}
            >
              {isSubmitting ? "생성 중..." : "생성하기"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
