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
  } = useForm<CreateChatRoomInput>({
    resolver: zodResolver(createChatRoomSchema),
    mode: "onChange",
    defaultValues: CREATE_CHAT_ROOM_DEFAULT_VALUES,
  });

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
          "bg-brand shadow-brand/20 max-w-max self-end rounded-xl px-6 py-2 text-sm font-black text-primary-foreground shadow-lg",
          "transition-all hover:opacity-90 active:scale-95",
          "cursor-pointer",
        )}
      >
        채팅방 만들기
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle>채팅방 생성</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleCreateRoom)} className="mt-2">
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-muted-foreground">방 제목</label>
            <Input
              autoFocus
              type="text"
              {...register("title")}
              placeholder="방 제목을 입력하세요"
              className="focus-visible:ring-brand h-auto bg-muted/30 px-4 py-3 transition-colors"
            />
            <FieldError errors={[errors.title]} />
          </div>
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-muted-foreground">방 설명</label>
            <Textarea
              {...register("description")}
              placeholder="방의 목적이나 규칙을 적어주세요"
              className="focus-visible:ring-brand h-auto min-h-20 bg-muted/30 px-4 py-3 transition-colors"
            />
            <FieldError errors={[errors.description]} />
          </div>
          <div className="mb-8">
            <label className="mb-2 block text-sm font-medium text-muted-foreground">참여 가능 인원</label>
            <Input
              type="number"
              {...register("capacity", { valueAsNumber: true })}
              min={CHAT_ROOM_MIN_CAPACITY}
              max={CHAT_ROOM_MAX_CAPACITY}
              className="focus-visible:ring-brand h-auto bg-muted/30 px-4 py-3 transition-colors"
            />
            <FieldError errors={[errors.capacity]} />
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              className="h-auto flex-1 py-3 font-bold"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={cn("bg-brand text-primary-foreground h-auto flex-1 py-3 font-bold", "hover:opacity-90")}
            >
              {isSubmitting ? "생성 중..." : "생성하기"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
