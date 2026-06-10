"use client";
// 채팅 패널 메뉴 — 클린봇 토글, 채팅 규칙 보기, 채팅창 팝업 항목을 제공합니다.

import { useRef, useState, type RefObject } from "react";
import { Check, ExternalLink, Info, MoreHorizontal, ScrollText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover";
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

// 동의/미동의 상태 칩 공통 모양(색 토큰만 호출부에서 주입).
const RULE_STATUS_CHIP_CLASS =
  "flex h-9 w-full items-center justify-center gap-1.5 rounded-md px-4 text-sm font-medium";

interface Props {
  creatorId: string;
  chatRuleText?: string;
  // 메뉴 규칙 보기에 동의 상태를 표시한다. 실제 동의는 입력바 게이트가 담당한다.
  // required — optional+기본값이면 새 콜사이트가 배선을 빠뜨려도 조용히 '미동의'로 퇴화한다.
  isRuleAccepted: boolean;
  isRulePending: boolean;
  cleanbot: boolean;
  onCleanbot: () => void;
  onPopoutOpen: (win: Window) => void;
  // 규칙 popover를 채팅 패널 폭에 맞추기 위한 anchor(패널 헤더). 입력바 popover와 동일 방식.
  anchorRef?: RefObject<HTMLElement | null>;
}

export function LiveChatMenu({
  creatorId,
  chatRuleText,
  isRuleAccepted,
  isRulePending,
  cleanbot,
  onCleanbot,
  onPopoutOpen,
  anchorRef,
}: Props) {
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

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
              ref={menuTriggerRef}
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

      <Popover open={isRulesOpen} onOpenChange={setIsRulesOpen}>
        <PopoverContent
          anchor={() => anchorRef?.current ?? menuTriggerRef.current}
          align="start"
          side="bottom"
          sideOffset={0}
          className="max-h-[calc(100vh-1rem)] w-(--anchor-width) overflow-y-auto"
        >
          <PopoverHeader>
            <PopoverTitle>{LIVE_LABEL.chatRuleTitle}</PopoverTitle>
            <PopoverDescription>{LIVE_LABEL.chatRuleDescription}</PopoverDescription>
          </PopoverHeader>
          <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {chatRuleText || LIVE_LABEL.chatRuleDefaultText}
          </p>
          {/* 동의 상태 표시 겸 닫기 버튼 — 클릭하면 규칙 popover를 닫는다(실제 동의는 입력칸 게이트에서만). */}
          {isRuleAccepted ? (
            <Button
              type="button"
              className={cn(
                RULE_STATUS_CHIP_CLASS,
                "bg-brand hover:bg-brand/90 text-brand-foreground",
              )}
              onClick={() => setIsRulesOpen(false)}
            >
              <Check className="size-3.5" />
              {LIVE_LABEL.chatRuleAccepted}
            </Button>
          ) : isRulePending ? (
            <Button
              type="button"
              variant="secondary"
              className={cn(RULE_STATUS_CHIP_CLASS)}
              onClick={() => setIsRulesOpen(false)}
            >
              <Info className="size-3.5" />
              {LIVE_LABEL.chatRulePending}
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>
    </>
  );
}
