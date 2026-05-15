"use client";

import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { CHAT_ROOM_TABS, ROOM_TAB_LABELS } from "@/constants/chat-room";
import { useChatRoomStore } from "@/stores/chat-room";
import type { ChatRoomCounts, ChatRoomTab } from "@/types/chat-room";
import { cn } from "@/lib/utils";

interface Props {
  counts?: ChatRoomCounts;
  isFetching?: boolean;
}

export default function ChatRoomTabs({ counts, isFetching = false }: Props) {
  const tabType = useChatRoomStore((state) => state.tabType);
  const setTabType = useChatRoomStore((state) => state.setTabType);

  return (
    <Tabs value={tabType} onValueChange={(nextValue) => setTabType(nextValue as ChatRoomTab)}>
      <TooltipProvider delay={300}>
        <TabsList
          className={cn(
            "grid h-auto w-full min-w-0 grid-cols-3 items-center gap-1 p-1",
            "bg-muted/50 rounded-xl dark:bg-zinc-800/40",
            "lg:w-150",
          )}
        >
          {CHAT_ROOM_TABS.map((tab) => {
            const count = counts?.[tab];
            const isActive = tabType === tab;
            const showSpinner = isFetching && isActive;
            // 정확한 개수를 보여줄 수 있을 때만 Tooltip 활성화 (Spinner 중에는 비활성)
            const hasOverflowCount = typeof count === "number" && count > 99 && !showSpinner;

            const trigger = (
              <TabsTrigger
                key={tab}
                value={tab}
                className={({ active }) =>
                  cn(
                    "relative flex h-auto min-w-0 cursor-pointer items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 lg:gap-1.5 lg:px-4",
                    active
                      ? "text-brand shadow-brand/10 bg-white shadow-sm dark:bg-zinc-900 dark:shadow-none"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-zinc-700/40",
                  )
                }
              >
                {ROOM_TAB_LABELS[tab]}
                <span
                  className={cn(
                    "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs leading-none font-black",
                    count === undefined
                      ? "invisible"
                      : isActive
                        ? "bg-brand text-white"
                        : "bg-muted-foreground/20 text-muted-foreground",
                  )}
                >
                  {showSpinner ? (
                    <Spinner className="size-3 text-white" />
                  ) : count === undefined ? null : count > 99 ? (
                    "99+"
                  ) : (
                    count
                  )}
                </span>
              </TabsTrigger>
            );

            if (!hasOverflowCount) return trigger;

            return (
              <Tooltip key={tab}>
                <TooltipTrigger render={trigger} />
                <TooltipContent
                  className={cn(
                    "bg-brand text-white",
                    "shadow-brand/30 shadow-md",
                    // TooltipContent 내부 자식(Arrow)에도 브랜드 컬러를 강제 적용
                    "*:bg-brand! *:fill-brand!",
                  )}
                >
                  {ROOM_TAB_LABELS[tab]} {count.toLocaleString()}개
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TabsList>
      </TooltipProvider>
    </Tabs>
  );
}
