"use client";
// 채팅방 목록에서 새 채팅방 생성 다이얼로그를 렌더링합니다.
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CHAT_ROOM_DESCRIPTION_MAX_LENGTH,
  CHAT_ROOM_MAX_CAPACITY,
  CHAT_ROOM_MIN_CAPACITY,
  CHAT_ROOM_TITLE_MAX_LENGTH,
} from "@/constants/chat-room/chat-room";
import { useCreateChatRoom } from "@/hooks/chat-room/use-create-chat-room";
import { cn } from "@/lib/utils";
import { CREATE_CHAT_ROOM_DEFAULT_VALUES, createChatRoomSchema } from "@/lib/zod/chat-room";
import type { CreateChatRoomInput } from "@/lib/zod/chat-room";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquarePlus, Plus } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

export default function ChatRoomListCreateDialog() {
  const [open, setOpen] = useState(false);
  const createRoomMutation = useCreateChatRoom();

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
  const isBusy = isSubmitting || createRoomMutation.isPending;

  const handleOpenChange = (next: boolean) => {
    if (!isBusy) {
      setOpen(next);
    }
  };

  const handleCreateRoom = async (values: CreateChatRoomInput) => {
    const result = await createRoomMutation.mutateAsync(values).catch(() => ({
      success: false,
    }));

    if (!result.success) {
      return;
    }

    setOpen(false);
    reset(CREATE_CHAT_ROOM_DEFAULT_VALUES);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
      <DialogContent
        className={cn(
          "max-w-md gap-0 overflow-hidden rounded-2xl p-0 shadow-xl",
          "border-brand/20 shadow-brand/10",
          "dark:border-brand/10",
        )}
      >
        <DialogHeader className="bg-brand/5 border-brand/10 border-b px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1",
                "bg-brand/10 text-brand ring-brand/20",
              )}
            >
              <MessageSquarePlus className="size-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold">채팅방 생성</DialogTitle>
              <DialogDescription className="mt-1 leading-relaxed">
                함께 대화할 주제와 참여 가능 인원을 설정합니다.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleCreateRoom)} className="flex flex-col gap-5 px-5 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-muted-foreground text-xs font-semibold">방 제목</label>
            <Input
              autoFocus
              type="text"
              {...register("title")}
              placeholder="방 제목을 입력하세요"
              maxLength={CHAT_ROOM_TITLE_MAX_LENGTH}
              className={cn(
                "h-auto rounded-xl px-4 py-2.5 text-sm transition-all",
                "border-border bg-muted/30 placeholder:text-muted-foreground/60",
                "focus-visible:border-brand/50 focus-visible:ring-brand/30",
                "dark:border-input dark:bg-input/30",
              )}
            />
            <FieldError errors={[errors.title]} />
            <p className="text-muted-foreground text-right text-xs">
              {title.length} / {CHAT_ROOM_TITLE_MAX_LENGTH}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-muted-foreground text-xs font-semibold">
              방 설명 <span className="font-normal opacity-60">(선택)</span>
            </label>
            <Textarea
              {...register("description")}
              placeholder="방의 목적이나 규칙을 적어주세요"
              maxLength={CHAT_ROOM_DESCRIPTION_MAX_LENGTH}
              className={cn(
                "h-auto min-h-20 resize-none rounded-xl px-4 py-2.5 text-sm transition-all",
                "border-border bg-muted/30 placeholder:text-muted-foreground/60",
                "focus-visible:border-brand/50 focus-visible:ring-brand/30",
                "dark:border-input dark:bg-input/30",
              )}
            />
            <FieldError errors={[errors.description]} />
            <p className="text-muted-foreground text-right text-xs">
              {description?.length ?? 0} / {CHAT_ROOM_DESCRIPTION_MAX_LENGTH}
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
                "dark:border-input dark:bg-input/30",
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
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isBusy}
              className={cn(
                "bg-background h-10 flex-1 rounded-xl transition-all",
                "text-foreground text-sm font-semibold",
                "hover:bg-muted/50 hover:text-foreground",
              )}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isBusy}
              className={cn(
                "bg-brand h-10 flex-1 rounded-xl transition-all",
                "shadow-brand/20 text-sm font-bold text-white shadow-sm",
                "hover:opacity-90 active:scale-95",
              )}
            >
              {isBusy ? "생성 중..." : "생성하기"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
