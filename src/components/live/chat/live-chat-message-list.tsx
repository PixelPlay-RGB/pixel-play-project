"use client";
// 라이브 채팅 메시지 목록을 렌더링하고 하단 근접 시 자동 스크롤을 처리합니다.

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { LiveChatRoleBadge, type LiveChatRole } from "@/components/live/chat/live-chat-role-badge";
import { LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import { formatDonationAmount } from "@/utils/live/live-chat";
import { getLiveChatOverlayNicknameColor } from "@/utils/live/live-chat-overlay-style";
import type { LiveChatMessage } from "@/types/live/live";

interface Props {
  messages: LiveChatMessage[];
  fillHeight?: boolean;
  // 클린봇 토글 상태. ON이면 비속어로 걸린 메시지를 가린다. 기본 ON.
  cleanbotEnabled?: boolean;
  // 후원 랭킹 배너(absolute 오버레이)가 덮는 높이만큼 목록 상단을 비워, 맨 위 스크롤 시 채팅이 가려지지 않게 한다.
  topInset?: boolean;
}

function getScrollContainer(el: HTMLElement): HTMLElement | null {
  let parent: HTMLElement | null = el.parentElement;
  while (parent) {
    const { overflowY } = window.getComputedStyle(parent);
    if (overflowY === "auto" || overflowY === "scroll") return parent;
    parent = parent.parentElement;
  }
  return null;
}

export function LiveChatMessageList({
  messages,
  fillHeight = false,
  cleanbotEnabled = true,
  topInset = false,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const wasNearBottomRef = useRef(true);

  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const container = getScrollContainer(el);
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
  }, []);

  useLayoutEffect(() => {
    const el = bottomRef.current;
    if (!el) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      el.scrollIntoView({ block: "end" });
      return;
    }

    const container = getScrollContainer(el);
    if (!container) {
      el.scrollIntoView({ block: "end" });
      return;
    }

    if (wasNearBottomRef.current) {
      el.scrollIntoView({ block: "end" });
    }
  }, [messages]);

  // 후원자 집합: 후원 메시지(익명은 sender_id가 null이라 senderId 없음)의 발신자 UUID를 누적한다.
  // messages는 LIVE_MESSAGE_LIMIT으로 잘려 과거 후원 메시지가 목록 밖으로 밀려날 수 있으므로,
  // 한 번 본 후원자는 이 집합에 남겨 채팅이 길어져도 뱃지가 사라지지 않게 한다(세션 단위 누적,
  // 크리에이터 전환 시 LiveView remount로 초기화). 새 후원자가 나타날 때만 렌더-중 가드된 setState로
  // 갱신해(setLastBroadcast와 동일 패턴) 무한 루프를 피한다.
  // (방송 전 구간/초기 100건 이전 후원자까지 보장하려면 RPC의 per-message is_donor가 필요 — 후속 이슈)
  const [donorIds, setDonorIds] = useState<Set<string>>(() => new Set());
  let nextDonorIds: Set<string> | null = null;
  for (const msg of messages) {
    if (msg.type === "donation" && msg.senderId && !donorIds.has(msg.senderId)) {
      (nextDonorIds ??= new Set(donorIds)).add(msg.senderId);
    }
  }
  if (nextDonorIds) setDonorIds(nextDonorIds);

  return (
    <div className={cn(fillHeight && "flex min-h-full flex-col justify-end")}>
      <ul className={cn("flex flex-col gap-3 px-3 py-2", topInset && "pt-26")}>
        {/* 진입할 때마다 항상 보여주는 필터링 안내(클라이언트 전용, 저장하지 않음). */}
        <li>
          <p className="border-border bg-muted/70 text-muted-foreground rounded-lg border px-3 py-2 text-center text-sm leading-relaxed font-semibold whitespace-pre-line">
            {LIVE_LABEL.chatFilterNotice}
          </p>
        </li>
        {messages.map((msg) => (
          <li key={msg.id}>
            <MessageItem
              message={msg}
              cleanbotEnabled={cleanbotEnabled}
              isDonor={!msg.isHost && !!msg.senderId && donorIds.has(msg.senderId)}
            />
          </li>
        ))}
      </ul>
      <div ref={bottomRef} />
    </div>
  );
}

interface MessageItemProps {
  message: LiveChatMessage;
  cleanbotEnabled: boolean;
  // 발신자가 이 방송에서 후원한 사람인지(방장 제외). 이름 앞 후원자 뱃지 표시에 쓴다.
  isDonor: boolean;
}

// 메시지가 바뀌지 않은 기존 항목은 새 메시지 도착마다 재렌더되지 않게 memo로 감싼다.
// props가 모두 원시값/안정 ref(message 객체는 캐시에서 ref 유지)라 얕은 비교로 충분하다.
const MessageItem = memo(function MessageItem({
  message,
  cleanbotEnabled,
  isDonor,
}: MessageItemProps) {
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

  return <TextMessage message={message} isDonor={isDonor} isMasked={isMasked} />;
});

function TextMessage({
  message,
  isDonor,
  isMasked,
}: {
  message: LiveChatMessage;
  isDonor: boolean;
  isMasked: boolean;
}) {
  const role: LiveChatRole | null = message.isHost ? "creator" : isDonor ? "donor" : null;
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
