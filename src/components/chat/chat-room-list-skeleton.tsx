import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ChatRoomListSkeleton() {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3",
        "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
      )}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex h-32 w-full flex-col justify-between rounded-2xl border p-4 shadow-sm sm:p-5",
            "border-border/60 bg-card dark:border-border/10 dark:bg-zinc-900/50",
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
