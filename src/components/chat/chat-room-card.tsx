import { cn } from "@/lib/utils";
import type { ChatRoom } from "@/types/chat-room";
import {
  formatCapacity,
  formatRoomDate,
  getCapacityColorClass,
  getCapacityPercent,
} from "@/utils/chat-room";
import { Clock, MessageCircle, Users } from "lucide-react";
import Link from "next/link";

interface Props {
  chatRoom: ChatRoom;
  unreadMessageCount?: number;
}

export default function ChatRoomCard({ chatRoom, unreadMessageCount = 0 }: Props) {
  const hasUnreadMessages = unreadMessageCount > 0;
  const unreadLabel = unreadMessageCount > 99 ? "99+" : String(unreadMessageCount);
  const capacityPercent = getCapacityPercent(chatRoom.current_member, chatRoom.max_capacity);
  const capacityColorClass = getCapacityColorClass(capacityPercent);
  const isFull = chatRoom.current_member >= chatRoom.max_capacity;

  return (
    <Link
      href={`/chat/${chatRoom.id}`}
      prefetch={false}
      className={cn(
        "group relative flex min-h-25 w-full items-stretch justify-between gap-3 overflow-hidden text-left",
        "border-border/60 bg-card rounded-2xl border p-4 shadow-sm sm:p-5",
        "transition-all duration-200 active:scale-[0.99]",
        "hover:border-brand/40 hover:shadow-brand/5 hover:shadow-md",
        "dark:hover:border-brand/30 dark:bg-zinc-900/50 dark:shadow-none dark:hover:bg-zinc-800/50",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "bg-brand absolute top-3 bottom-3 left-0 w-0.75 rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100",
        )}
      />

      <div className={cn("flex min-w-0 flex-1 flex-col gap-1.5 pl-1")}>
        <div className={cn("flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2")}>
          <h3 className={cn("text-foreground truncate text-sm leading-snug font-bold")}>
            {chatRoom.title}
          </h3>
          <span className={cn("text-muted-foreground shrink-0 text-[11px] font-medium tracking-tight")}>
            @{chatRoom.owner_nickname}
          </span>
        </div>
        {chatRoom.description && (
          <p className={cn("text-muted-foreground line-clamp-1 text-[11px] leading-relaxed")}>
            {chatRoom.description}
          </p>
        )}

        <div className={cn("mt-auto flex items-center gap-2 pt-2")}>
          <div className={cn("bg-border/60 relative h-1.5 w-20 overflow-hidden rounded-full dark:bg-zinc-700/50")}>
            <div
              className={cn("h-full rounded-full transition-all duration-300", capacityColorClass)}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
          <div className={cn("flex items-center gap-1")}>
            <Users className={cn("text-muted-foreground h-3 w-3")} />
            <span
              className={cn(
                "font-mono text-[11px] font-semibold",
                isFull ? "text-live" : "text-brand",
              )}
            >
              {formatCapacity(chatRoom.current_member, chatRoom.max_capacity)}
            </span>
          </div>
        </div>
      </div>

      <div className={cn("flex shrink-0 flex-col items-end justify-between")}>
        <div className={cn("h-5")}>
          {hasUnreadMessages && (
            <span className={cn("bg-brand shadow-brand/30 inline-flex h-5 items-center gap-1 rounded-full px-2 text-[10px] leading-none font-black text-white shadow-sm")}>
              <MessageCircle className={cn("h-2.5 w-2.5 shrink-0")} />
              {unreadLabel}
            </span>
          )}
        </div>
        <div className={cn("flex items-center gap-1")}>
          <Clock className={cn("text-muted-foreground/50 h-2.5 w-2.5")} />
          <span className={cn("text-muted-foreground/70 text-[11px] whitespace-nowrap")}>
            개설 {formatRoomDate(chatRoom.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
