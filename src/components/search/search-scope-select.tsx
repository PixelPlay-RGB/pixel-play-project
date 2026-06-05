"use client";
// 헤더 검색 범위(라이브/채팅)를 선택하는 드롭다운 칩입니다. 검색 입력 pill 좌측에 배치합니다.

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SEARCH_SCOPES, getSearchScopeConfig } from "@/constants/common/search-scope";
import { cn } from "@/lib/utils";
import type { SearchScope } from "@/stores/search-scope";
import { ChevronDown } from "lucide-react";

interface Props {
  scope: SearchScope;
  onScopeChange: (scope: SearchScope) => void;
  className?: string;
}

export default function SearchScopeSelect({ scope, onScopeChange, className }: Props) {
  const active = getSearchScopeConfig(scope);
  const ActiveIcon = active.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label="검색 범위 선택"
        className={cn(
          "flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-full pr-1.5 pl-2.5 text-xs font-bold",
          "text-foreground/80 transition-colors outline-none",
          "hover:text-foreground focus-visible:text-foreground",
          className,
        )}
      >
        <ActiveIcon className="text-live size-3.5" />
        <span>{active.label}</span>
        <ChevronDown className="size-3 opacity-60" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" sideOffset={10} className="min-w-36">
        <DropdownMenuRadioGroup
          value={scope}
          onValueChange={(value) => onScopeChange(value as SearchScope)}
        >
          {SEARCH_SCOPES.map((config) => {
            const Icon = config.icon;

            return (
              <DropdownMenuRadioItem
                key={config.value}
                value={config.value}
                className="gap-2 pr-8 pl-2 font-medium"
              >
                <Icon className="size-4" />
                {config.label} 검색
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
