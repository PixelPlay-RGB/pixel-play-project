// 라이브 검색 결과를 섹션 단위로 렌더링합니다.
import LiveBroadcastResultCard from "@/components/search/live-broadcast-result-card";
import LiveCreatorResultCard from "@/components/search/live-creator-result-card";
import { Button } from "@/components/ui/button";
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
  totalCount: number;
}

export default function LiveSearchSection({
  description,
  hasMore,
  isFetchingMore,
  onLoadMore,
  results,
  section,
  title,
  totalCount,
}: Props) {
  const sectionLabel = section === "broadcast" ? "방송" : "크리에이터";

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex min-w-0 gap-3">
          <span
            className={cn(
              "mt-1 h-10 w-1.5 shrink-0 rounded-full",
              section === "broadcast" ? "bg-live" : "bg-brand",
            )}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={cn("text-foreground text-xl", "leading-tight font-black")}>{title}</h2>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-black",
                  section === "broadcast"
                    ? "bg-live/10 text-live dark:bg-live/15"
                    : "bg-brand/10 text-brand dark:bg-brand/15",
                )}
              >
                {sectionLabel} {totalCount}개
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-3",
          section === "broadcast"
            ? "lg:grid-cols-2 xl:grid-cols-3"
            : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
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
          <span className="bg-border/70 h-px flex-1" />
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
          <span className="bg-border/70 h-px flex-1" />
        </div>
      )}
    </section>
  );
}
