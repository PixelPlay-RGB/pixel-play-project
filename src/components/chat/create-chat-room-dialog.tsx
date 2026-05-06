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
import { CHAT_ROOM_MAX_CAPACITY, CHAT_ROOM_MIN_CAPACITY } from "@/constants/chat-room";
import { QUERY_KEYS } from "@/constants/query-keys";
import { cn } from "@/lib/utils";
import { CREATE_CHAT_ROOM_DEFAULT_VALUES, createChatRoomSchema } from "@/lib/zod/chat-room";
import type { CreateChatRoomInput } from "@/lib/zod/chat-room";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function CreateChatRoomDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
    watch,
  } = useForm<CreateChatRoomInput>({
    resolver: zodResolver(createChatRoomSchema),
    mode: "onChange",
    defaultValues: CREATE_CHAT_ROOM_DEFAULT_VALUES,
  });

  const title = watch("title") ?? "";
  const description = watch("description") ?? "";

  const handleCreateRoom = async (values: CreateChatRoomInput) => {
    const result = await createChatRoomAction(values);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("채팅방 생성 완료");
    setOpen(false);
    reset(CREATE_CHAT_ROOM_DEFAULT_VALUES);
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.all });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          "flex items-center gap-1.5 self-end rounded-xl px-5 py-2 text-sm font-bold text-white",
          "bg-brand shadow-sm shadow-brand/25",
          "cursor-pointer transition-all hover:opacity-90 active:scale-95",
        )}
      >
        <Plus className={cn("h-4 w-4")} />
        채팅방 만들기
      </DialogTrigger>
      <DialogContent className={cn("max-w-md gap-0 overflow-hidden rounded-3xl p-0")}>
        <DialogHeader className={cn("border-b border-border/50 px-6 pt-6 pb-4")}>
          <DialogTitle className={cn("text-base font-bold")}>채팅방 생성</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(handleCreateRoom)}
          className={cn("flex flex-col gap-5 px-6 py-5")}
        >
          <div className={cn("flex flex-col gap-1.5")}>
            <label className={cn("text-xs font-semibold text-muted-foreground")}>방 제목</label>
            <Input
              autoFocus
              type="text"
              {...register("title")}
              placeholder="방 제목을 입력하세요"
              maxLength={50}
              className={cn(
                "h-auto rounded-xl border-border bg-muted/30 px-4 py-2.5 text-sm transition-all placeholder:text-muted-foreground/60",
                "focus-visible:border-brand/50 focus-visible:ring-brand/30",
                "dark:border-zinc-700/50 dark:bg-zinc-800/50",
              )}
            />
            <FieldError errors={[errors.title]} />
            <p className={cn("text-right text-xs text-muted-foreground")}>{title.length} / 50</p>
          </div>
          <div className={cn("flex flex-col gap-1.5")}>
            <label className={cn("text-xs font-semibold text-muted-foreground")}>
              방 설명 <span className={cn("font-normal opacity-60")}>(선택)</span>
            </label>
            <Textarea
              {...register("description")}
              placeholder="방의 목적이나 규칙을 적어주세요"
              maxLength={200}
              className={cn(
                "h-auto min-h-20 resize-none rounded-xl border-border bg-muted/30 px-4 py-2.5 text-sm transition-all placeholder:text-muted-foreground/60",
                "focus-visible:border-brand/50 focus-visible:ring-brand/30",
                "dark:border-zinc-700/50 dark:bg-zinc-800/50",
              )}
            />
            <FieldError errors={[errors.description]} />
            <p className={cn("text-right text-xs text-muted-foreground")}>
              {description?.length ?? 0} / 200
            </p>
          </div>
          <div className={cn("flex flex-col gap-1.5")}>
            <label className={cn("text-xs font-semibold text-muted-foreground")}>
              참여 가능 인원
            </label>
            <Input
              type="number"
              {...register("capacity", { valueAsNumber: true })}
              min={CHAT_ROOM_MIN_CAPACITY}
              max={CHAT_ROOM_MAX_CAPACITY}
              className={cn(
                "h-auto rounded-xl border-border bg-muted/30 px-4 py-2.5 text-sm transition-all",
                "focus-visible:border-brand/50 focus-visible:ring-brand/30",
                "dark:border-zinc-700/50 dark:bg-zinc-800/50",
              )}
            />
            <FieldError errors={[errors.capacity]} />
            <p className={cn("text-xs text-muted-foreground")}>
              최소 {CHAT_ROOM_MIN_CAPACITY}명 · 최대 {CHAT_ROOM_MAX_CAPACITY}명
            </p>
          </div>
          <div className={cn("mt-1 flex gap-2.5")}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              className={cn(
                "h-auto flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={cn(
                "h-auto flex-1 rounded-xl bg-brand py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/20",
                "transition-all hover:opacity-90 active:scale-95",
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
