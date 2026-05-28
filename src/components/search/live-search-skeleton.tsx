// 라이브 검색 결과 로딩 상태를 렌더링합니다.
import { Skeleton } from "@/components/ui/skeleton";
import { LIVE_SEARCH_RESULT_LIMIT } from "@/constants/search/search";
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
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 px-1">
        <Skeleton className={cn("h-6 rounded-lg", titleWidth)} />
        <Skeleton className="h-4 w-64 max-w-full rounded-md" />
      </div>
      <div
        className={cn(
          "grid grid-cols-1 gap-4",
          compact ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {Array.from({ length: LIVE_SEARCH_RESULT_LIMIT }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "border-border/60 bg-card rounded-2xl border p-4 shadow-sm",
              compact ? "flex min-h-24 items-center gap-3" : "flex min-h-64 flex-col gap-4",
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
                <Skeleton className="aspect-video w-full rounded-xl" />
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
