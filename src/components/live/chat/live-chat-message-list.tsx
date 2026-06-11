"use client";
// 라이브 채팅 메시지 목록 — TanStack Virtual로 보이는 구간만 렌더링하고 하단 근접 시 자동 스크롤한다.
// 지금은 LIVE_MESSAGE_LIMIT(100) 캡이지만, 추후 이전 채팅 무한 스크롤(히스토리 적재)을 붙여도
// DOM이 화면 분량으로 고정되도록 미리 가상화 구조를 깔아 둔다.

import { memo, useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { LiveChatRoleBadge, type LiveChatRole } from "@/components/live/chat/live-chat-role-badge";
import { LIVE_LABEL } from "@/constants/live/live";
import { formatDonationAmount } from "@/utils/live/live-chat";
import { getLiveChatOverlayNicknameColor } from "@/utils/live/live-chat-overlay-style";
import type { LiveChatMessage } from "@/types/live/live";

// 한 줄 텍스트 채팅 기준 추정 높이(px). 실제 높이는 measureElement가 행마다 보정한다.
const ESTIMATED_ROW_HEIGHT = 32;
// 행 간 간격(px) — 기존 목록의 gap-3과 동일.
const ROW_GAP = 12;

interface Props {
  messages: LiveChatMessage[];
  // 클린봇 토글 상태. ON이면 비속어로 걸린 메시지를 가린다. 기본 ON.
  cleanbotEnabled?: boolean;
  // 후원 랭킹 배너(absolute 오버레이)가 덮는 실측 높이(px). 접고 펼칠 때마다 호출부가 갱신해 넘긴다.
  topInsetPx?: number;
  // 가상화 스크롤 컨테이너(ScrollArea viewport)의 ref. 호출부가 ScrollArea에 단 ref를 그대로 넘긴다.
  scrollRef: RefObject<HTMLDivElement | null>;
}

export function LiveChatMessageList({
  messages,
  cleanbotEnabled = true,
  topInsetPx = 0,
  scrollRef,
}: Props) {
  const isInitialMount = useRef(true);
  const wasNearBottomRef = useRef(true);

  // 행 0 = 첫 진입 필터링 안내(항상 표시), 행 i+1 = messages[i].
  const rowCount = messages.length + 1;

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 12,
    gap: ROW_GAP,
    // 배너 실측 높이 + 행 간격만큼 비워, 맨 위 스크롤 시 첫 메시지가 배너에 가려지지 않게 한다.
    paddingStart: topInsetPx > 0 ? topInsetPx + ROW_GAP : 8,
    paddingEnd: 8,
    getItemKey: (index) => (index === 0 ? "__filter-notice__" : messages[index - 1].id),
  });

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const updateNearBottom = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      wasNearBottomRef.current = distanceFromBottom < 60;
    };

    updateNearBottom();
    container.addEventListener("scroll", updateNearBottom, { passive: true });

    return () => {
      container.removeEventListener("scroll", updateNearBottom);
    };
  }, [scrollRef]);

  useLayoutEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      virtualizer.scrollToIndex(rowCount - 1, { align: "end" });
      return;
    }

    if (wasNearBottomRef.current) {
      virtualizer.scrollToIndex(rowCount - 1, { align: "end" });
    }
  }, [rowCount, virtualizer]);

  return (
    // 채팅은 항상 바닥에서 위로 쌓인다 — 메시지가 적을 땐 입력바 바로 위부터 시작한다.
    <div className="flex min-h-full flex-col justify-end">
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.key}
            data-index={item.index}
            ref={virtualizer.measureElement}
            className="absolute inset-x-0 top-0 px-3"
            style={{ transform: `translateY(${item.start}px)` }}
          >
            {item.index === 0 ? (
              <p className="border-border bg-muted/70 text-muted-foreground rounded-lg border px-3 py-2 text-center text-xs leading-relaxed font-semibold whitespace-pre-line">
                {LIVE_LABEL.chatFilterNotice}
              </p>
            ) : (
              <MessageItem message={messages[item.index - 1]} cleanbotEnabled={cleanbotEnabled} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface MessageItemProps {
  message: LiveChatMessage;
  cleanbotEnabled: boolean;
}

// 메시지가 바뀌지 않은 기존 항목은 새 메시지 도착마다 재렌더되지 않게 memo로 감싼다.
// props가 모두 원시값/안정 ref(message 객체는 캐시에서 ref 유지)라 얕은 비교로 충분하다.
const MessageItem = memo(function MessageItem({ message, cleanbotEnabled }: MessageItemProps) {
  if (message.type === "system") {
    return (
      <p className="text-muted-foreground my-1 text-center text-sm wrap-break-word">
        {message.content}
      </p>
    );
  }

  if (message.type === "donation") {
    // 후원 카드: 마크와 같은 brand→live 그라데이션 배경, 닉네임·금액 pill은 채팅과 동일한 해시 컬러.
    const donorColor = getLiveChatOverlayNicknameColor(message.author ?? "");

    return (
      <div className="from-brand/15 to-live/15 border-live/25 rounded-lg border bg-linear-to-r px-3.5 py-2.5 text-sm shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 text-sm font-bold wrap-break-word" style={{ color: donorColor }}>
            {message.author}
          </span>
          {message.donationAmount !== undefined ? (
            <span
              className="shrink-0 rounded-full px-2.5 py-0.5 text-sm font-bold tabular-nums"
              style={{
                color: donorColor,
                backgroundColor: `color-mix(in srgb, ${donorColor} 15%, transparent)`,
              }}
            >
              {formatDonationAmount(message.donationAmount)}P
            </span>
          ) : null}
        </div>
        {message.content ? (
          <p className="text-foreground mt-1.5 wrap-break-word">{message.content}</p>
        ) : null}
      </div>
    );
  }

  // 클린봇에 걸린 메시지: 토글 ON이면 닉네임·마크는 그대로 두고 본문만 안내 문구로 가린다.
  const isMasked = !!message.isCleanbotFlagged && cleanbotEnabled;

  return <TextMessage message={message} isMasked={isMasked} />;
});

function TextMessage({ message, isMasked }: { message: LiveChatMessage; isMasked: boolean }) {
  // 역할 마크는 DB가 전송 시점에 스냅샷한 sender_role을 그대로 쓴다(viewer는 마크 없음).
  const role: LiveChatRole | null =
    message.senderRole && message.senderRole !== "viewer" ? message.senderRole : null;
  // OBS 채팅 오버레이와 같은 규칙으로 닉네임별 랜덤(해시) 컬러를 적용한다.
  const nicknameColor = getLiveChatOverlayNicknameColor(
    message.author ?? "",
    message.isHost ? "creator" : undefined,
  );

  return (
    // line-height(leading-5=20px)를 마크 높이(size-5)와 일치시켜 마크가 라인박스를 정확히 채우고,
    // 닉네임·본문은 같은 인라인 텍스트라 베이스라인이 자동으로 맞는다(마크·닉네임·본문 모두 동일 정렬).
    <p className="min-w-0 text-sm leading-5 wrap-break-word">
      {role ? <LiveChatRoleBadge role={role} withTooltip className="mr-1.5 align-bottom" /> : null}
      <span className="mr-1.5 font-medium" style={{ color: nicknameColor }}>
        {message.author}
      </span>
      {isMasked ? (
        <span className="text-muted-foreground">{LIVE_LABEL.cleanbotHidden}</span>
      ) : (
        <span className="text-foreground">{message.content}</span>
      )}
    </p>
  );
}
