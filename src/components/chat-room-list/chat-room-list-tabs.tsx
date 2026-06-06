"use client";
// 채팅방 목록 탭과 탭별 카운트를 렌더링합니다.
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { CHAT_ROOM_TABS, ROOM_TAB_LABELS } from "@/constants/chat-room/chat-room";
import { useChatRoomStore } from "@/stores/chat-room";
import { formatNumber } from "@/utils/common/format";
import type { ChatRoomCounts, ChatRoomTab } from "@/types/chat-room/chat-room";
import { cn } from "@/lib/utils";

interface Props {
  counts?: ChatRoomCounts;
  isFetching?: boolean;
}

function ChatRoomListTabCountBadge({
  count,
  isActive,
  showSpinner,
  className,
}: {
  count: number | undefined;
  isActive: boolean;
  showSpinner: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-xs leading-none font-black",
        showSpinner
          ? "bg-brand text-white"
          : count === undefined
            ? "invisible"
            : isActive
              ? "bg-brand text-white"
              : "bg-muted-foreground/20 text-muted-foreground",
        className,
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
  );
}

export default function ChatRoomListTabs({ counts, isFetching = false }: Props) {
  const tabType = useChatRoomStore((state) => state.tabType);
  const setTabType = useChatRoomStore((state) => state.setTabType);
  const activeCount = counts?.[tabType];
  const showActiveSpinner = isFetching;

  return (
    <>
      <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(props) => (
              <Button
                {...props}
                type="button"
                variant="outline"
                className={cn(
                  "h-10 w-full justify-between rounded-xl px-3",
                  "bg-muted/50 hover:bg-muted text-foreground",
                )}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-sm font-semibold">{ROOM_TAB_LABELS[tabType]}</span>
                  <ChatRoomListTabCountBadge
                    count={activeCount}
                    isActive
                    showSpinner={showActiveSpinner}
                  />
                </span>
                <ChevronDown className="text-muted-foreground size-4 shrink-0" />
              </Button>
            )}
          />
          <DropdownMenuContent align="start" sideOffset={6} className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel>채팅방 범위</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={tabType}
                onValueChange={(nextValue) => setTabType(nextValue as ChatRoomTab)}
              >
                {CHAT_ROOM_TABS.map((tab) => {
                  const count = counts?.[tab];
                  const isActive = tabType === tab;
                  const showSpinner = isFetching && isActive;

                  return (
                    <DropdownMenuRadioItem
                      key={tab}
                      value={tab}
                      closeOnClick
                      className="gap-2 py-2"
                    >
                      <span className="min-w-0 flex-1 truncate">{ROOM_TAB_LABELS[tab]}</span>
                      <ChatRoomListTabCountBadge
                        count={count}
                        isActive={isActive}
                        showSpinner={showSpinner}
                        className="mr-4"
                      />
                    </DropdownMenuRadioItem>
                  );
                })}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs
        value={tabType}
        onValueChange={(nextValue) => setTabType(nextValue as ChatRoomTab)}
        className="hidden w-full min-w-0 sm:flex lg:w-auto"
      >
        <TooltipProvider delay={0}>
          <TabsList
            className={cn(
              "grid h-auto w-full min-w-0 grid-cols-3 items-center gap-1 p-1",
              "bg-brand/10 rounded-xl dark:bg-white/5",
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
                        ? "bg-background text-brand shadow-brand/10 data-active:bg-background! data-active:text-brand! dark:bg-card dark:text-brand dark:data-active:bg-card! shadow-sm dark:shadow-none"
                        : "text-muted-foreground hover:bg-background/50 hover:text-foreground dark:hover:bg-accent/50",
                    )
                  }
                >
                  <span className="min-w-0 truncate">{ROOM_TAB_LABELS[tab]}</span>
                  <ChatRoomListTabCountBadge
                    count={count}
                    isActive={isActive}
                    showSpinner={showSpinner}
                  />
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
                    {ROOM_TAB_LABELS[tab]} {formatNumber(count)}개
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TabsList>
        </TooltipProvider>
      </Tabs>
    </>
  );
}
