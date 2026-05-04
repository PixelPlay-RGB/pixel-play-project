"use client";

import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { formatCapacity, formatRoomDate } from "@/utils/room";
import { createRoomAction } from "@/actions/room";
import { useUser } from "@/hooks/use-profile";
import { useChatRooms, CHAT_ROOMS_QUERY_KEY } from "@/hooks/use-chat-rooms";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FieldError } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ChatListProps 
{
  maxCapacity: number;
}

export default function ChatList({ maxCapacity }: ChatListProps) {
  const [filter, setFilter] = useState<"joined" | "others" | "my">("joined");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: currentUser } = useUser();
  const { data: rooms = [], isLoading } = useChatRooms();
  const queryClient = useQueryClient();

  // maxCapacity가 바뀔 때만 스키마 재생성
  const roomSchema = useMemo(
    () =>
      z.object({
        title: z.string().min(1, "방 제목을 입력해주세요."),
        capacity: z
          .number({ error: "참가 가능 인원을 입력해주세요." })
          .min(2, "최소 2명 이상이어야 합니다.")
          .max(maxCapacity, `최대 ${maxCapacity}명까지 가능합니다.`),
        description: z.string().optional(),
      }),
    [maxCapacity],
  );

  type RoomFormValues = z.infer<typeof roomSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    mode: "onChange",
    defaultValues: { title: "", capacity: undefined, description: "" },
  });

  // 방 생성 후 캐시 무효화로 목록 자동 갱신
  const handleCreateChat = async (values: RoomFormValues) => {
    const result = await createRoomAction(values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("채팅방이 생성되었습니다.");
    setIsModalOpen(false);
    reset();
    queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_QUERY_KEY });
  };

  // 선택된 필터에 따라 rooms 클라이언트 사이드 필터링
  const filteredRooms = rooms.filter((room) => {
    if (filter === "joined") return room.is_joined;
    if (filter === "others") return !room.is_joined && room.owner_id !== currentUser?.id;
    if (filter === "my") return room.owner_id === currentUser?.id;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* 채팅방 필터 서브 메뉴 */}
      <div className="flex items-center justify-between mb-8 border-b border-zinc-200 dark:border-zinc-800/50 pb-6">
        <div className="flex gap-3">
          {(["joined", "others", "my"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                filter === f
                  ? "bg-brand text-white shadow-lg shadow-brand/20"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
              )}
            >
              {f === "joined"
                ? "참여중인 채팅방"
                : f === "others"
                  ? "참여 가능 채팅방"
                  : "내가 만든 채팅방"}
            </button>
          ))}
        </div>

        {/* 채팅방 생성 */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger className="px-6 py-2 bg-brand hover:opacity-90 text-white rounded-xl text-sm font-black transition-all active:scale-95 shadow-lg shadow-brand/20">
            방 만들기
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle>새 채팅방 생성</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleCreateChat)} className="mt-2">
              <div className="mb-5">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  방 제목
                </label>
                <input
                  autoFocus
                  type="text"
                  {...register("title")}
                  placeholder="방 제목을 입력하세요"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-brand transition-colors"
                />
                <FieldError errors={[errors.title]} />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  방 설명
                </label>
                <input
                  type="text"
                  {...register("description")}
                  placeholder="방의 목적이나 규칙을 짧게 적어주세요"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-brand transition-colors"
                />
                <FieldError errors={[errors.description]} />
              </div>
              <div className="mb-8">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  참가 가능 인원
                </label>
                <input
                  type="number"
                  {...register("capacity", { valueAsNumber: true })}
                  min={2}
                  max={maxCapacity}
                  placeholder={`참가 가능한 인원을 적어주세요. (최대 ${maxCapacity}명)`}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-brand transition-colors"
                />
                <FieldError errors={[errors.capacity]} />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-bold transition-all text-zinc-600 dark:text-zinc-300"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!isValid}
                  className="flex-1 px-6 py-3 bg-brand hover:opacity-90 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  생성하기
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 리스트 출력: 로딩 중 → 스켈레톤 / 데이터 있음 → 카드 / 없음 → 빈 상태 */}
      {isLoading ? (
        // DB 응답 대기 중: 실제 카드와 동일한 레이아웃의 플레이스홀더
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/50 shadow-sm"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="flex flex-col items-end gap-1">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredRooms.length > 0 ? (
        // 데이터 로드 완료: 필터링된 채팅방 카드 렌더링
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredRooms.map((room) => {
            const displayNickname = room.owner?.nickname ?? "Unknown";

            return (
              <div
                key={room.id}
                className="flex items-center justify-between p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:border-brand/50 dark:hover:border-brand/50 cursor-pointer transition-all group active:scale-[0.99] shadow-sm dark:shadow-none"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                      {room.title}
                    </h3>
                    <span className="text-xs text-zinc-500">
                      @{displayNickname}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                    {room.description}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-mono font-bold text-brand group-hover:opacity-80">
                    {formatCapacity(room.member_cnt, room.max_capacity)}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {formatRoomDate(room.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // 필터 조건에 맞는 채팅방 없음
        <div className="flex-1 flex items-center justify-center text-zinc-500">
          해당하는 채팅방이 없습니다.
        </div>
      )}

    </div>
  );
}
