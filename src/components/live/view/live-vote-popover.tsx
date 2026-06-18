"use client";
// 투표 참여와 라이브 상호작용 결과를 채팅 패널 액션 팝오버로 제공합니다.

import { useEffect, useRef, useState, type RefObject } from "react";
import { Sparkles } from "lucide-react";

import { VoteBody } from "@/components/live/view/live-vote-body";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LIVE_VOTE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import {
  getTriggerLabel,
  selectCurrentInteraction,
  shouldPromptLoginOnOpen,
} from "@/utils/live/live-vote";
import type { LiveInteractionNotice, LivePoll } from "@/types/live/live";

// 후원(코랄 채움) 옆에 나란히 놓이는 투표 트리거는 브랜드 민트 아웃라인으로 역할을 구분한다.
// h-8: 입력 섹션을 낮게 유지하기 위한 슬림 높이(비디오 하단 라인 정렬용).
const VOTE_TRIGGER_CLASS = cn(
  "h-8 flex-1 text-sm",
  "border-brand/30 bg-brand/10 text-brand",
  "hover:border-brand/50 hover:bg-brand/18 dark:border-brand/30 dark:bg-brand/15 dark:text-brand",
);

interface Props {
  interactionNotices?: LiveInteractionNotice[];
  isError?: boolean;
  isInteractionNoticesError?: boolean;
  isInteractionNoticesLoading?: boolean;
  isLoading?: boolean;
  isLoggedIn: boolean;
  onLoginPrompt: () => void;
  onJoinDraw?: (drawNoticeId: string) => Promise<boolean>;
  onVote: (pollId: string, optionId: string) => Promise<boolean>;
  polls: LivePoll[];
  presentation?: "popover" | "dialog";
  // 팝오버를 채팅 입력칸 위로 띄워 입력칸을 가리지 않게 한다(규칙·팔로우 popover와 동일 anchor).
  anchorRef?: RefObject<HTMLElement | null>;
  // 방송 종료 등으로 투표 참여를 막을 때 트리거를 비활성화한다.
  disabled?: boolean;
  // 전체화면 오버레이 등에서 popover/dialog 포털 컨테이너를 전체화면 요소로 지정한다(미지정=body).
  portalContainer?: HTMLElement | null;
}

export function LiveVotePopover({
  interactionNotices = [],
  isError,
  isInteractionNoticesError,
  isInteractionNoticesLoading,
  isLoading,
  isLoggedIn,
  onJoinDraw,
  onLoginPrompt,
  onVote,
  polls,
  presentation = "popover",
  anchorRef,
  disabled = false,
  portalContainer,
}: Props) {
  const [open, setOpen] = useState(false);
  const autoOpenedRouletteNoticeIdRef = useRef<string | null>(null);

  // 열어둔 채 방송이 종료되면(disabled 전환) 즉시 닫는다.
  // effect 내 setState는 lint 에러(set-state-in-effect)라 렌더 중 가드된 setState 패턴을 쓴다.
  const currentInteraction = selectCurrentInteraction(polls, interactionNotices);
  // 진행 중·종료 기록이 모두 없으면 열어도 보여줄 것이 없으므로 트리거를 비활성화한다.
  const hasInteraction = currentInteraction.type !== "empty";
  const triggerLabel = getTriggerLabel(currentInteraction);
  const rouletteNoticeId =
    !disabled && currentInteraction.type === "roulette" && currentInteraction.mode === "active"
      ? currentInteraction.notice.id
      : null;
  const visibleOpen = disabled ? false : open;

  useEffect(() => {
    if (!disabled || !open) return;

    const timer = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [disabled, open]);

  useEffect(() => {
    if (!rouletteNoticeId || open) return;
    if (autoOpenedRouletteNoticeIdRef.current === rouletteNoticeId) return;

    autoOpenedRouletteNoticeIdRef.current = rouletteNoticeId;
    const timer = window.setTimeout(() => setOpen(true), 0);
    return () => window.clearTimeout(timer);
  }, [rouletteNoticeId, open]);

  function handleOpenChange(next: boolean) {
    if (next && !isLoggedIn && shouldPromptLoginOnOpen(currentInteraction)) {
      onLoginPrompt();
      return;
    }

    setOpen(next);
  }

  function handleOpen() {
    handleOpenChange(true);
  }

  const body = (
    <VoteBody
      currentInteraction={currentInteraction}
      isLoading={isLoading}
      isError={isError}
      isInteractionNoticesLoading={isInteractionNoticesLoading}
      isInteractionNoticesError={isInteractionNoticesError}
      isLoggedIn={isLoggedIn}
      onJoinDraw={onJoinDraw}
      onLoginPrompt={onLoginPrompt}
      onVote={onVote}
      onClose={() => setOpen(false)}
    />
  );

  if (presentation === "dialog") {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          className={VOTE_TRIGGER_CLASS}
          disabled={disabled || !hasInteraction}
          title={!hasInteraction ? LIVE_VOTE_LABEL.emptyInteraction : undefined}
          onClick={handleOpen}
        >
          <Sparkles className="size-4" />
          {triggerLabel}
        </Button>
        <Dialog open={visibleOpen} onOpenChange={handleOpenChange}>
          <DialogContent
            container={portalContainer}
            className="max-h-[calc(100vh-1rem)] gap-4 overflow-y-auto"
            showCloseButton={false}
          >
            {body}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Popover open={visibleOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            className={VOTE_TRIGGER_CLASS}
            disabled={disabled || !hasInteraction}
            title={!hasInteraction ? LIVE_VOTE_LABEL.emptyInteraction : undefined}
          />
        }
      >
        <Sparkles className="size-4" />
        {triggerLabel}
      </PopoverTrigger>
      <PopoverContent
        anchor={anchorRef ? () => anchorRef.current : undefined}
        container={portalContainer}
        align="center"
        side="top"
        sideOffset={0}
        // 기본 collisionPadding(5px)이 popover를 패널 밖으로 밀어내므로 0으로 고정해 패널 안에 둔다.
        collisionPadding={0}
        // 입력바(anchor) 풀폭 + 하단 직각으로 입력 섹션과 한 덩어리처럼 이어 붙인다(후원 popover와 동일).
        className="max-h-[calc(100vh-1rem)] w-(--anchor-width) overflow-y-auto rounded-b-none"
      >
        {body}
      </PopoverContent>
    </Popover>
  );
}
