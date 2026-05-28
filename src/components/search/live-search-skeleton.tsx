// 라이브 검색 결과 로딩 상태를 렌더링합니다.
import { Skeleton } from "@/components/ui/skeleton";
import {
  LIVE_BROADCAST_SEARCH_RESULT_LIMIT,
  LIVE_CREATOR_SEARCH_RESULT_LIMIT,
} from "@/constants/search/search";
import { cn } from "@/lib/utils";

export default function LiveSearchSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <SkeletonSection titleWidth="w-30" />
      <SkeletonSection titleWidth="w-24" compact />
    </div>
  );
}

function SkeletonSection({
  compact = false,
  titleWidth,
}: {
  compact?: boolean;
  titleWidth: string;
}) {
  const itemCount = compact ? LIVE_CREATOR_SEARCH_RESULT_LIMIT : LIVE_BROADCAST_SEARCH_RESULT_LIMIT;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex gap-3">
        <Skeleton className="mt-1 h-10 w-1.5 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className={cn("h-6 rounded-lg", titleWidth)} />
          <Skeleton className="h-4 w-64 max-w-full rounded-md" />
        </div>
      </div>
      <div
        className={cn(
          "grid grid-cols-1 gap-3",
          compact
            ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "lg:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {Array.from({ length: itemCount }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "border-border/60 bg-card rounded-2xl border p-4 shadow-sm",
              compact ? "flex min-h-23 items-center gap-3" : "grid min-h-31 gap-4 sm:flex",
            )}
          >
            {compact ? (
              <>
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-5 w-32 rounded-md" />
                  <Skeleton className="h-4 w-full rounded-md" />
                </div>
              </>
            ) : (
              <>
                <Skeleton className={cn("h-full min-h-26 w-32 shrink-0 rounded-xl sm:w-40")} />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-4/5 rounded-md" />
                  <Skeleton className="h-4 w-3/5 rounded-md" />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
