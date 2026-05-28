"use client";
// 채팅 패널 더보기 DropdownMenu — 클린봇, 채팅 규칙, 팝아웃 링크를 제공합니다.

import { ExternalLink, MoreHorizontal, ScrollText, ShieldCheck } from "lucide-react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LIVE_CHAT_MENU_LABEL, LIVE_LABEL } from "@/constants/live/live";

export function LiveChatMenu() {
  const params = useParams<{ creatorId: string }>();
  const popoutHref = `/live/${params.creatorId}/chat`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            aria-label={LIVE_LABEL.chatMenu}
            className="size-8 p-0"
          />
        }
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuItem className="text-brand gap-2">
            <ShieldCheck className="size-4" />
            {LIVE_CHAT_MENU_LABEL.cleanbot}
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            <ScrollText className="size-4" />
            {LIVE_CHAT_MENU_LABEL.rules}
          </DropdownMenuItem>
          <DropdownMenuItem
            render={
              <a href={popoutHref} target="_blank" rel="noopener noreferrer" className="gap-2" />
            }
            className="gap-2"
          >
            <ExternalLink className="size-4" />
            {LIVE_CHAT_MENU_LABEL.popout}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
