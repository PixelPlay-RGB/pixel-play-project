"use client";
// 라이브 채팅 메시지 목록 — TanStack Virtual로 보이는 구간만 렌더링하고 하단 근접 시 자동 스크롤한다.
// 위로 스크롤해 상단에 닿으면 과거 채팅을 한 페이지씩 적재한다(가상화 덕에 DOM은 화면 분량 유지).

import { memo, useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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
  // 진입 시점의 마지막 메시지 id — 필터링 안내를 이 메시지 바로 뒤(바닥)에 끼워 넣는다.
  // null = 진입 시점에 메시지가 없었음(안내가 첫 행), undefined = 미지정(안내 맨 앞 폴백).
  entryNoticeAnchorId?: string | null;
}

export function LiveChatMessageList({
  messages,
  cleanbotEnabled = true,
  topInsetPx = 0,
  scrollRef,
  onLoadOlderMessages,
  isLoadingOlderMessages = false,
  hasMoreChatHistory = false,
  entryNoticeAnchorId,
}: Props) {
  const isInitialMount = useRef(true);
  const wasNearBottomRef = useRef(true);
  // prepend(과거 적재) 감지용 — 직전 렌더의 메시지 목록을 기억해 첫 id 변화를 비교한다.
  const prevMessagesRef = useRef<LiveChatMessage[]>(messages);

  // 필터링 안내는 진입 시점의 마지막 메시지 바로 뒤(바닥)에 끼워 넣는다 — 진입하면 입력바 위에
  // 보이고, 이후 도착하는 메시지에 일반 메시지처럼 위로 밀려 올라간다(치지직식).
  // anchor가 없거나(빈 채팅 진입) 캡(300건)에 밀려 잘려나갔으면 가장 과거인 맨 앞에 둔다.
  const anchorIndex = entryNoticeAnchorId
    ? messages.findIndex((message) => message.id === entryNoticeAnchorId)
    : -1;
  const noticeRowIndex = anchorIndex >= 0 ? anchorIndex + 1 : 0;
  const rowCount = messages.length + 1;
  const getMessageAtRow = (rowIndex: number) =>
    messages[rowIndex < noticeRowIndex ? rowIndex : rowIndex - 1];

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 12,
    gap: ROW_GAP,
    // 배너 실측 높이 + 행 간격만큼 비워, 맨 위 스크롤 시 첫 메시지가 배너에 가려지지 않게 한다.
    paddingStart: topInsetPx > 0 ? topInsetPx + ROW_GAP : 8,
    paddingEnd: 8,
    getItemKey: (index) =>
      index === noticeRowIndex ? "__filter-notice__" : getMessageAtRow(index).id,
  });

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const updateNearBottom = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      wasNearBottomRef.current = distanceFromBottom < 60;
    };

    const handleScroll = () => {
      updateNearBottom();

      // 상단 근접 시 과거 페이지 적재를 요청한다. 중복 호출은 훅 내부 가드(isLoadingOlder)가 막는다.
      if (
        hasMoreChatHistory &&
        !isLoadingOlderMessages &&
        container.scrollTop < LOAD_OLDER_THRESHOLD_PX
      ) {
        onLoadOlderMessages?.();
      }
    };

    // 초기엔 바닥 상태만 동기화한다 — 적재는 사용자가 실제로 스크롤할 때만 일어나야
    // 진입 직후(scrollTop이 아직 0인 시점)나 짧은 목록에서 연쇄 적재가 발사되지 않는다.
    updateNearBottom();
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
    // 1차 이동은 추정 행 높이 기준이라 바닥에 못 미칠 수 있다 — 행 실측(measureElement)이
    // 반영된 다음 프레임에 scrollHeight 기준으로 한 번 더 바닥에 붙인다.
    const scrollToBottom = () => {
      virtualizer.scrollToIndex(rowCount - 1, { align: "end" });
      requestAnimationFrame(() => {
        const container = scrollRef.current;
        if (container) container.scrollTop = container.scrollHeight;
      });
    };

    if (isInitialMount.current) {
      isInitialMount.current = false;
      scrollToBottom();
      return;
    }

    if (wasNearBottomRef.current) {
      scrollToBottom();
    }
  }, [rowCount, virtualizer, scrollRef]);

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
            {item.index === noticeRowIndex ? (
              // 필터링 안내 행 — 적재 중 표시는 행이 아니라 LiveChatBody의 플로팅 인디케이터가 담당한다.
              <p className="border-border bg-muted/70 text-muted-foreground rounded-lg border px-3 py-2 text-center text-xs leading-relaxed font-semibold whitespace-pre-line">
                {LIVE_LABEL.chatFilterNotice}
              </p>
            ) : (
              <MessageItem
                message={getMessageAtRow(item.index)}
                cleanbotEnabled={cleanbotEnabled}
              />
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
