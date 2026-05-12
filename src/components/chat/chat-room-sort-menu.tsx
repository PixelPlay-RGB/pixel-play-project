// 채팅방 목록 정렬 기준 선택 UI
"use client";

import { useEffect, useState } from "react";

import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CHAT_ROOM_SORT_LABELS,
  CHAT_ROOM_SORT_OPTIONS_BY_TAB,
  DEFAULT_CHAT_ROOM_SORT_OPTION,
} from "@/constants/chat-room";
import { cn } from "@/lib/utils";
import { useChatRoomStore } from "@/stores/chat-room";
import type { ChatRoomSortOption } from "@/types/chat-room";

export default function ChatRoomSortMenu() {
  const tabType = useChatRoomStore((state) => state.tabType);
  const [sortOption, setSortOption] = useState<ChatRoomSortOption>(DEFAULT_CHAT_ROOM_SORT_OPTION);
  const sortOptions = CHAT_ROOM_SORT_OPTIONS_BY_TAB[tabType];
  const selectedSortOption = sortOptions.includes(sortOption)
    ? sortOption
    : DEFAULT_CHAT_ROOM_SORT_OPTION;

  useEffect(() => {
    if (!sortOptions.includes(sortOption)) {
      setSortOption(DEFAULT_CHAT_ROOM_SORT_OPTION);
    }
  }, [sortOption, sortOptions]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="outline"
            className={cn(
              "h-9 min-w-34 justify-between rounded-xl px-3",
              "text-muted-foreground hover:text-foreground",
              "sm:min-w-38",
            )}
          >
            <ArrowUpDown data-icon="inline-start" className="size-4" />
            <span className="truncate text-xs font-semibold sm:text-sm">
              {CHAT_ROOM_SORT_LABELS[selectedSortOption]}
            </span>
          </Button>
        )}
      />
      <DropdownMenuContent align="end" sideOffset={6} className="w-40">
        <DropdownMenuLabel>정렬 기준</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={selectedSortOption}
          onValueChange={(value) => setSortOption(value as ChatRoomSortOption)}
        >
          {sortOptions.map((option) => (
            <DropdownMenuRadioItem key={option} value={option} closeOnClick className="py-2">
              {CHAT_ROOM_SORT_LABELS[option]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
