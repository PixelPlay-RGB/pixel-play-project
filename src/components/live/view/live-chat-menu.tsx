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

interface Props {
  creatorId: string;
  chatRuleText?: string;
  // 메뉴 규칙 보기에 동의 상태를 표시한다. 실제 동의는 입력바 게이트가 담당한다.
  isRuleAccepted?: boolean;
  isRulePending?: boolean;
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
          {isRuleAccepted ? (
            // 상태 표시(badge)용 — 비활성 액션이 아니므로 disabled:opacity-100으로 색을 선명히 유지한다
            // (기본 disabled:opacity-50이면 brand색이 흐려져 입력칸 동의 버튼과 톤이 어긋난다).
            <Button
              type="button"
              disabled
              className="bg-brand text-brand-foreground gap-1.5 disabled:opacity-100"
            >
              <Check className="size-3.5" />
              {LIVE_LABEL.chatRuleAccepted}
            </Button>
          ) : isRulePending ? (
            // 미동의(입력칸 동의 popover를 아직 못 본 사용자)도 동의 완료 버튼과 같은 버튼 shape의
            // 상태 badge로 보인다(중립 secondary). 동의는 입력칸에서만 가능하므로 여기선 안내 전용.
            <Button
              type="button"
              variant="secondary"
              disabled
              className="gap-1.5 disabled:opacity-100"
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
