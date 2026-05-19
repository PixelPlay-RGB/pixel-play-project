// 채팅 검색 결과를 섹션 단위로 렌더링합니다.
import ChatRoomCard from "@/components/chat-room/shared/chat-room-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { ChatSearchResult } from "@/types/search/search";
import { ChevronDown, Loader2 } from "lucide-react";

interface Props {
  title: string;
  description: string;
  results: ChatSearchResult[];
  hasMore: boolean;
  isFetchingMore: boolean;
  onLoadMore: () => void;
}

export default function ChatSearchSection({
  title,
  description,
  results,
  hasMore,
  isFetchingMore,
  onLoadMore,
}: Props) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-foreground text-xl font-bold">{title}</h2>
          </div>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>

      <div className={cn("grid grid-cols-1 gap-3", "sm:grid-cols-2 xl:grid-cols-4")}>
        {results.map((room) => (
          <ChatRoomCard key={`${room.section}-${room.id}`} chatRoom={room} />
        ))}
      </div>

      {hasMore && (
        <div className="flex items-center gap-4 pt-1">
          <Separator className="flex-1" />
          <Button
            type="button"
            variant="secondary"
            onClick={onLoadMore}
            disabled={isFetchingMore}
            className={cn(
              "h-9 rounded-full border px-4 text-xs font-bold",
              "border-border bg-background text-muted-foreground shadow-sm",
              "hover:border-brand/40 hover:text-brand",
            )}
          >
            {isFetchingMore ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            더보기
          </Button>
          <Separator className="flex-1" />
        </div>
      )}
    </section>
  );
}
