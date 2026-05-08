"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CHAT_ROOM_TABS, ROOM_TAB_LABELS } from "@/constants/chat-room";
import { useChatRoomStore } from "@/stores/chat-room";
import type { ChatRoomTab, ChatRoomCounts } from "@/types/chat-room";
import { cn } from "@/lib/utils";

interface Props {
  counts?: ChatRoomCounts;
}

export default function ChatRoomTabs({ counts }: Props) {
  const tabType = useChatRoomStore((state) => state.tabType);
  const setTabType = useChatRoomStore((state) => state.setTabType);

  return (
    <Tabs value={tabType} onValueChange={(nextValue) => setTabType(nextValue as ChatRoomTab)}>
      <TabsList
        className={cn(
          "grid h-auto w-full min-w-0 grid-cols-3 items-center gap-1 p-1",
          "bg-muted/50 rounded-xl dark:bg-zinc-800/40",
          "lg:w-150",
        )}
      >
        {CHAT_ROOM_TABS.map((tab) => {
          const count = counts?.[tab];

          return (
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
                    : tabType === tab
                      ? "bg-brand text-white"
                      : "bg-muted-foreground/20 text-muted-foreground",
                )}
              >
                {count === undefined ? null : count > 99 ? "99+" : count}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
