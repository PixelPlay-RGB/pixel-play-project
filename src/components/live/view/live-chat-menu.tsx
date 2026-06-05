"use client";
// 채팅 패널 메뉴 — 클린봇 토글, 채팅 규칙 보기, 채팅창 팝업 항목을 제공합니다.

import { useState } from "react";
import { ExternalLink, MoreHorizontal, ScrollText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { LIVE_CHAT_MENU_LABEL, LIVE_CHAT_POPOUT_WINDOW, LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import { toastAppError } from "@/utils/common/toast-message";

interface Props {
  creatorId: string;
  chatRuleText?: string;
  cleanbot: boolean;
  onCleanbot: () => void;
  onPopoutOpen: (win: Window) => void;
}

export function LiveChatMenu({
  creatorId,
  chatRuleText,
  cleanbot,
  onCleanbot,
  onPopoutOpen,
}: Props) {
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  function openChatPopout() {
    const width = LIVE_CHAT_POPOUT_WINDOW.width;
    const height = LIVE_CHAT_POPOUT_WINDOW.height;
    const left = Math.max(0, window.screen.availWidth - width);

    const win = window.open(
      `/live/${creatorId}/chat`,
      LIVE_CHAT_POPOUT_WINDOW.name,
      `width=${width},height=${height},left=${left},top=0,resizable=yes,scrollbars=yes`,
    );
    if (!win) {
      toastAppError(APP_MESSAGE_CODE.error.common.unknown, LIVE_LABEL.chatPopoutBlocked);
      return;
    }

    win.opener = null;
    onPopoutOpen(win);
  }

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
            <DropdownMenuItem className="gap-2" onClick={openChatPopout}>
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
            <DialogDescription>{LIVE_LABEL.chatRuleDescription}</DialogDescription>
          </DialogHeader>
          <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {chatRuleText || LIVE_LABEL.chatRuleDefaultText}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
