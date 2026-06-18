"use client";
// 채팅 패널 메뉴 — 클린봇 토글, 채팅 규칙 보기, 채팅창 팝업 항목을 제공합니다.
// 채팅 규칙은 입력바 위 규칙 popover를 그대로 연다(안내 위치·모양을 한 곳으로 통일).

import { ExternalLink, MoreHorizontal, ScrollText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  cleanbot: boolean;
  onCleanbot: () => void;
  onPopoutOpen: (win: Window) => void;
  // "채팅 규칙" 클릭 시 입력바 위 규칙 popover 열기를 요청한다.
  onShowRules: () => void;
}

export function LiveChatMenu({
  creatorId,
  cleanbot,
  onCleanbot,
  onPopoutOpen,
  onShowRules,
}: Props) {
  function openChatPopout() {
    const width = LIVE_CHAT_POPOUT_WINDOW.width;
    // 팝업 높이는 화면 가용 높이의 80%로 — 고정 픽셀은 큰 모니터에서 너무 짧게 보인다.
    const height = Math.round(window.screen.availHeight * 0.8);
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
              variant="ghost"
              aria-label={LIVE_LABEL.chatMenu}
              className="size-8 p-0"
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuGroup>
            {/* 클린봇은 토글이라 클릭해도 메뉴를 닫지 않고, 스위치로 켜짐/꺼짐 상태를 보여준다. */}
            <DropdownMenuItem
              role="menuitemcheckbox"
              aria-checked={cleanbot}
              closeOnClick={false}
              className={cn("gap-2", cleanbot && "text-brand")}
              onClick={onCleanbot}
            >
              <ShieldCheck className="size-4" />
              <span className="flex-1">{LIVE_CHAT_MENU_LABEL.cleanbot}</span>
              <span
                aria-hidden
                className={cn(
                  "relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors",
                  cleanbot ? "bg-brand" : "bg-muted-foreground/30",
                )}
              >
                <span
                  className={cn(
                    "bg-background absolute top-0.5 left-0.5 size-3 rounded-full shadow-sm transition-transform",
                    cleanbot && "translate-x-3",
                  )}
                />
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={onShowRules}>
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
    </>
  );
}
