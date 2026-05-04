import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ChatRoomListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm",
            "dark:border-zinc-800/50 dark:bg-zinc-900/50",
          )}
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
  );
}
