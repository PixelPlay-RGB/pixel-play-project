"use client";
// 라이브 채팅 메시지 목록 — TanStack Virtual로 보이는 구간만 렌더링하고 하단 근접 시 자동 스크롤한다.
// 위로 스크롤해 상단에 닿으면 과거 채팅을 한 페이지씩 적재한다(가상화 덕에 DOM은 화면 분량 유지).

import { memo, useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Spinner } from "@/components/ui/spinner";
import { LiveChatDonationMessageCard } from "@/components/live/chat/live-chat-donation-message-card";
import { LiveChatRoleBadge, type LiveChatRole } from "@/components/live/chat/live-chat-role-badge";
import { LIVE_LABEL } from "@/constants/live/live";
import { getLiveChatOverlayNicknameColor } from "@/utils/live/live-chat-overlay-style";
import type { LiveChatMessage } from "@/types/live/live";

// 한 줄 텍스트 채팅 기준 추정 높이(px). 실제 높이는 measureElement가 행마다 보정한다.
const ESTIMATED_ROW_HEIGHT = 32;
// 행 간 간격(px) — 기존 목록의 gap-3과 동일.
const ROW_GAP = 12;
// 상단에서 이 거리(px) 안으로 스크롤하면 과거 페이지 적재를 요청한다.
const LOAD_OLDER_THRESHOLD_PX = 80;

interface Props {
  messages: LiveChatMessage[];
  // 클린봇 토글 상태. ON이면 비속어로 걸린 메시지를 가린다. 기본 ON.
  cleanbotEnabled?: boolean;
  // 후원 랭킹 배너(absolute 오버레이)가 덮는 실측 높이(px). 접고 펼칠 때마다 호출부가 갱신해 넘긴다.
  topInsetPx?: number;
  // 가상화 스크롤 컨테이너(ScrollArea viewport)의 ref. 호출부가 ScrollArea에 단 ref를 그대로 넘긴다.
  scrollRef: RefObject<HTMLDivElement | null>;
  // 과거 채팅 적재(무한 스크롤) — 상단 근접 시 호출. 미지정 시 적재를 시도하지 않는다.
  onLoadOlderMessages?: () => void;
  isLoadingOlderMessages?: boolean;
  hasMoreChatHistory?: boolean;
}

export function LiveChatMessageList({
  messages,
  cleanbotEnabled = true,
  topInsetPx = 0,
  scrollRef,
  onLoadOlderMessages,
  isLoadingOlderMessages = false,
  hasMoreChatHistory = false,
}: Props) {
  const isInitialMount = useRef(true);
  const wasNearBottomRef = useRef(true);
  // prepend(과거 적재) 감지용 — 직전 렌더의 메시지 목록을 기억해 첫 id 변화를 비교한다.
  const prevMessagesRef = useRef<LiveChatMessage[]>(messages);

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

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      wasNearBottomRef.current = distanceFromBottom < 60;

      // 상단 근접 시 과거 페이지 적재를 요청한다. 중복 호출은 훅 내부 가드(isLoadingOlder)가 막는다.
      if (
        hasMoreChatHistory &&
        !isLoadingOlderMessages &&
        container.scrollTop < LOAD_OLDER_THRESHOLD_PX
      ) {
        onLoadOlderMessages?.();
      }
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [scrollRef, hasMoreChatHistory, isLoadingOlderMessages, onLoadOlderMessages]);

  // 과거 적재(prepend) 직후엔 추가된 행들의 추정 높이만큼 scrollTop을 내려, 보고 있던
  // 메시지가 화면에서 점프하지 않게 한다(행 실측 보정에 의한 미세 오차는 수용).
  useLayoutEffect(() => {
    const prev = prevMessagesRef.current;
    prevMessagesRef.current = messages;

    const container = scrollRef.current;
    if (!container || prev.length === 0 || messages.length <= prev.length) return;

    const prevFirstId = prev[0]?.id;
    if (!prevFirstId || messages[0]?.id === prevFirstId) return;

    const prependedCount = messages.findIndex((message) => message.id === prevFirstId);
    if (prependedCount <= 0) return;

    container.scrollTop += prependedCount * (ESTIMATED_ROW_HEIGHT + ROW_GAP);
  }, [messages, scrollRef]);

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
              // 행 0: 과거가 더 남았으면 적재 상태 표시, 히스토리 끝(또는 미사용)이면 필터링 안내.
              hasMoreChatHistory ? (
                <div className="flex h-8 items-center justify-center">
                  {isLoadingOlderMessages ? (
                    <Spinner className="text-muted-foreground size-4" />
                  ) : null}
                </div>
              ) : (
                <p className="border-border bg-muted/70 text-muted-foreground rounded-lg border px-3 py-2 text-center text-xs leading-relaxed font-semibold whitespace-pre-line">
                  {LIVE_LABEL.chatFilterNotice}
                </p>
              )
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
    return (
      <LiveChatDonationMessageCard
        author={message.author ?? ""}
        amount={message.donationAmount}
        content={message.content}
      />
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
