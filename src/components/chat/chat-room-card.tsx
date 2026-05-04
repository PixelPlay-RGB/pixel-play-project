import { cn } from "@/lib/utils";
import type { ChatRoom } from "@/types/chat-room";
import { formatCapacity, formatRoomDate } from "@/utils/chat-room";
import Link from "next/link";

interface Props {
  chatRoom: ChatRoom;
}

export default function ChatRoomCard({ chatRoom }: Props) {
  return (
    <Link
      href={`/chat/${chatRoom.id}`}
      prefetch={false}
      className={cn(
        "group flex min-h-24 items-center justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm",
        "sm:p-5",
        "hover:border-brand/50 transition-all hover:bg-zinc-50 active:scale-[0.99]",
        "dark:hover:border-brand/50 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:shadow-none dark:hover:bg-zinc-800/50",
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{chatRoom.title}</h3>
          <span className="shrink-0 text-xs text-zinc-500">@{chatRoom.owner_nickname}</span>
        </div>
        {chatRoom.description && (
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {chatRoom.description}
          </span>
        )}
      </div>
      <div className="ml-3 flex shrink-0 flex-col items-end gap-1 sm:ml-4">
        <span className="text-brand font-mono text-xs font-bold group-hover:opacity-80">
          {formatCapacity(chatRoom.current_member, chatRoom.max_capacity)}
        </span>
        <span className="text-xs text-zinc-600">{formatRoomDate(chatRoom.created_at)}</span>
      </div>
    </Link>
  );
}
