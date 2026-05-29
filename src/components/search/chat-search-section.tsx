// 채팅 검색 결과를 섹션 단위로 렌더링합니다.
import ChatRoomCard from "@/components/chat-room/shared/chat-room-card";
import LoadMoreButton from "@/components/common/load-more-button";
import { cn } from "@/lib/utils";
import type { ChatSearchResult } from "@/types/search/search";

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

      {hasMore && <LoadMoreButton isLoading={isFetchingMore} onClick={onLoadMore} accent="brand" />}
    </section>
  );
}
