// 라이브 검색 결과를 섹션 단위로 렌더링합니다.
import LiveBroadcastResultCard from "@/components/search/live-broadcast-result-card";
import LiveCreatorResultCard from "@/components/search/live-creator-result-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type {
  LiveSearchResult,
  LiveSearchSection as LiveSearchSectionType,
} from "@/types/search/search";
import { ChevronDown, Loader2 } from "lucide-react";

interface Props {
  description: string;
  hasMore: boolean;
  isFetchingMore: boolean;
  onLoadMore: () => void;
  results: LiveSearchResult[];
  section: LiveSearchSectionType;
  title: string;
}

export default function LiveSearchSection({
  description,
  hasMore,
  isFetchingMore,
  onLoadMore,
  results,
  section,
  title,
}: Props) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 px-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-foreground text-xl font-black">{title}</h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <span className="text-muted-foreground text-xs font-bold">{results.length}개 표시 중</span>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-4",
          section === "broadcast" ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2",
        )}
      >
        {results.map((result) =>
          section === "broadcast" ? (
            <LiveBroadcastResultCard key={`broadcast-${result.broadcast_id}`} result={result} />
          ) : (
            <LiveCreatorResultCard key={`creator-${result.creator_id}`} result={result} />
          ),
        )}
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
              "hover:border-live/40 hover:text-live",
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
