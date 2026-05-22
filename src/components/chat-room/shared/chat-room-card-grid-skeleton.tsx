// 채팅방 카드 그리드 로딩 상태를 렌더링합니다.
import { Skeleton } from "@/components/ui/skeleton";
import { CHAT_ROOM_PAGE_SIZE_BY_COLUMN_COUNT } from "@/constants/chat-room/chat-room";
import { cn } from "@/lib/utils";

interface Props {
  count?: number;
}

export default function ChatRoomCardGridSkeleton({ count }: Props) {
  const isResponsiveFallback = count === undefined;
  const skeletonCount = count ?? CHAT_ROOM_PAGE_SIZE_BY_COLUMN_COUNT.four;

  return (
    <div className={cn("grid grid-cols-1 gap-3", "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}>
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex h-32 w-full flex-col justify-between rounded-2xl border p-4 shadow-sm sm:p-5",
            "border-border/60 bg-card dark:border-border/30",
            isResponsiveFallback &&
              i >= CHAT_ROOM_PAGE_SIZE_BY_COLUMN_COUNT.two &&
              "hidden xl:flex",
            isResponsiveFallback &&
              i >= CHAT_ROOM_PAGE_SIZE_BY_COLUMN_COUNT.one &&
              i < CHAT_ROOM_PAGE_SIZE_BY_COLUMN_COUNT.two &&
              "hidden sm:flex",
          )}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-2/3 rounded-lg" />
              <Skeleton className="h-3 w-1/4 rounded-md" />
            </div>
            <Skeleton className="h-3 w-full rounded-md" />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-1.5 w-16 rounded-full" />
              <Skeleton className="h-3 w-10 rounded-md" />
            </div>
            <Skeleton className="h-3 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
