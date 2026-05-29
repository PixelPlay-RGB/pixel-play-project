"use client";
// 채팅 패널 메뉴 — 클린봇 토글, 채팅 규칙 보기, 채팅창 팝업 항목을 제공합니다.

import { useState } from "react";
import { ExternalLink, MoreHorizontal, ScrollText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LIVE_CHAT_MENU_LABEL, LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";

interface Props {
  creatorId: string;
  chatRuleText?: string;
  cleanbot: boolean;
  onCleanbot: () => void;
}

export function LiveChatMenu({ creatorId, chatRuleText, cleanbot, onCleanbot }: Props) {
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const popoutHref = `/live/${creatorId}/chat`;

  return (
    <>
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
            <DropdownMenuItem
              className={cn("gap-2", cleanbot && "text-brand")}
              onClick={onCleanbot}
            >
              <ShieldCheck className="size-4" />
              {cleanbot ? LIVE_CHAT_MENU_LABEL.cleanbot : LIVE_CHAT_MENU_LABEL.cleanbotOff}
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={() => setIsRulesOpen(true)}>
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

      <Dialog open={isRulesOpen} onOpenChange={setIsRulesOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{LIVE_LABEL.chatRuleTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
            {chatRuleText || LIVE_LABEL.chatRuleDefaultText}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
