"use client";

import { Clock, MessageCircle, Users } from "lucide-react";

import { ChatRoomJoinDialog } from "@/components/chat/chat-room-join-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useChatRoomCardJoin } from "@/hooks/use-chat-room-card-join";
import { cn } from "@/lib/utils";
import type { ChatRoomByTab, ChatRoomTab } from "@/types/chat-room";
import {
  formatCapacity,
  formatRoomDate,
  getCapacityColorClass,
  getCapacityPercent,
} from "@/utils/chat-room";

interface Props {
  chatRoom: ChatRoomByTab;
  tabType: ChatRoomTab;
  currentUserId?: string;
  unreadMessageCount?: number;
}

export default function ChatRoomCard({
  chatRoom,
  tabType,
  currentUserId,
  unreadMessageCount = 0,
}: Props) {
  const { isLoadingEntry, dialogVisible, dialogStatus, handleClick, handleJoinSuccess, onCancelDialog } =
    useChatRoomCardJoin({ chatRoomId: chatRoom.id, currentUserId, tabType });

  const capacityPercent = getCapacityPercent(chatRoom.current_member, chatRoom.max_capacity);
  const isFull = capacityPercent >= 100;
  const hasUnreadMessages = unreadMessageCount > 0;
  const unreadLabel = unreadMessageCount > 99 ? "99+" : unreadMessageCount;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoadingEntry}
        className={cn(
          "group relative flex min-h-25 w-full cursor-pointer items-stretch justify-between gap-3 overflow-hidden text-left",
          "border-border/60 bg-card rounded-2xl border p-4 shadow-sm sm:p-5",
          "transition-all duration-200 active:scale-[0.99]",
          "hover:border-brand/40 hover:shadow-brand/5 hover:shadow-md",
          "dark:hover:border-brand/30 dark:bg-zinc-900/50 dark:shadow-none dark:hover:bg-zinc-800/50",
          isLoadingEntry && "cursor-wait opacity-60",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "bg-brand absolute top-3 bottom-3 left-0 w-0.75 rounded-full",
            "opacity-0 transition-opacity duration-200 group-hover:opacity-100",
          )}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 pl-1">
          <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
            <h3 className="text-foreground truncate text-sm leading-snug font-bold">
              {chatRoom.title}
            </h3>
            <span
              className={cn(
                "text-muted-foreground shrink-0 font-medium tracking-tight",
                "text-[11px]",
              )}
            >
              @{chatRoom.owner_nickname}
            </span>
          </div>
          {chatRoom.description && (
            <p className={cn("text-muted-foreground line-clamp-1 leading-relaxed", "text-[11px]")}>
              {chatRoom.description}
            </p>
          )}

          <div className="mt-auto flex items-center gap-2 pt-2">
            <div
              className={cn(
                "relative h-1.5 w-20 overflow-hidden rounded-full",
                "bg-border/60 dark:bg-zinc-700/50",
              )}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  getCapacityColorClass(capacityPercent),
                )}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
            <div className="flex items-center gap-1">
              <Users className="text-muted-foreground h-3 w-3" />
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

        <div className="flex shrink-0 flex-col items-end justify-between">
          <div className="flex h-5 items-center justify-end">
            {isLoadingEntry ? (
              <Spinner className="text-muted-foreground size-4" />
            ) : (
              hasUnreadMessages && (
                <span
                  className={cn(
                    "bg-brand inline-flex h-5 items-center gap-1 rounded-full px-2 shadow-sm",
                    "text-[10px] leading-none font-black text-white",
                    "shadow-brand/30",
                  )}
                >
                  <MessageCircle className="h-2.5 w-2.5 shrink-0" />
                  {unreadLabel}
                </span>
              )
            )}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="text-muted-foreground/50 h-2.5 w-2.5" />
            <span className="text-muted-foreground/70 text-[11px] whitespace-nowrap">
              개설 {formatRoomDate(chatRoom.created_at)}
            </span>
          </div>
        </div>
      </button>
      {dialogVisible && (
        <ChatRoomJoinDialog
          roomId={chatRoom.id}
          roomTitle={chatRoom.title}
          status={dialogStatus}
          onCancel={onCancelDialog}
          onJoinSuccess={handleJoinSuccess}
        />
      )}
    </>
  );
}
