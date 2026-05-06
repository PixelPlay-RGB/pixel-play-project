import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ChatRoomListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "group relative flex min-h-25 w-full items-start justify-between gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-sm",
            "animate-pulse sm:p-5",
            "dark:bg-zinc-900/50",
          )}
        >
          <div className="flex flex-1 flex-col gap-2 pl-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-2/3 rounded-md" />
              <Skeleton className="h-3 w-1/4 rounded-md" />
            </div>
            <Skeleton className="h-3 w-4/5 rounded-md" />
            <div className="mt-1 flex items-center gap-2">
              <Skeleton className="h-1.5 w-20 rounded-full" />
              <Skeleton className="h-3 w-10 rounded-md" />
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-3 w-10 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
