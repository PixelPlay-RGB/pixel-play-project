// 라이브 목록 정렬 메뉴를 렌더링합니다.

import { ArrowUpDown } from "lucide-react";

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
import { LIVE_LIST_SORT_OPTIONS, isLiveListSort } from "@/constants/live/live-list";
import { cn } from "@/lib/utils";
import type { LiveListSort } from "@/types/live/live";

interface LiveSortMenuProps {
  sort: LiveListSort;
  onSortChange: (sort: LiveListSort) => void;
}

export default function LiveSortMenu({ sort, onSortChange }: LiveSortMenuProps) {
  const selectedSort = LIVE_LIST_SORT_OPTIONS.find((option) => option.value === sort);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="outline"
            className={cn(
              "h-9 w-full justify-between rounded-lg px-3",
              "text-muted-foreground hover:text-foreground sm:w-auto sm:min-w-36",
            )}
          >
            <ArrowUpDown data-icon="inline-start" className="size-4" />
            <span className="truncate text-sm font-semibold">{selectedSort?.label ?? "정렬"}</span>
          </Button>
        )}
      />
      <DropdownMenuContent align="end" sideOffset={6} className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>정렬 기준</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={sort}
            onValueChange={(value) => {
              if (isLiveListSort(value)) {
                onSortChange(value);
              }
            }}
          >
            {LIVE_LIST_SORT_OPTIONS.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                closeOnClick
                className="py-2"
              >
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
