"use client";
// 라이브 채팅 메시지 목록을 렌더링하고 하단 근접 시 자동 스크롤을 처리합니다.

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Crown, HandCoins, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import { formatDonationAmount } from "@/utils/live/live-chat";
import type { LiveChatMessage } from "@/types/live/live";

interface Props {
  messages: LiveChatMessage[];
  fillHeight?: boolean;
  // 클린봇 토글 상태. ON이면 비속어로 걸린 메시지를 가린다. 기본 ON.
  cleanbotEnabled?: boolean;
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
      <ul className="flex flex-col gap-1 px-3 py-2">
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
      <p className="text-muted-foreground my-1 text-center text-xs wrap-break-word">
        {message.content}
      </p>
    );
  }

  if (message.type === "donation") {
    return (
      <div className="border-live/20 bg-live/10 rounded-lg border px-3 py-2 text-sm">
        <div className="mb-1 flex items-center gap-1.5">
          <HandCoins className="text-live size-3.5 shrink-0" aria-hidden />
          <span className="text-live font-semibold">
            {message.donationAmount !== undefined
              ? `${formatDonationAmount(message.donationAmount)}P`
              : ""}
          </span>
          <span className="text-foreground min-w-0 text-xs font-medium wrap-break-word">
            {message.author}
          </span>
        </div>
        {message.content ? (
          <p className="text-foreground wrap-break-word">{message.content}</p>
        ) : null}
      </div>
    );
  }

  if (message.isCleanbotFlagged) {
    return (
      <CleanbotMessage message={message} cleanbotEnabled={cleanbotEnabled} isDonor={isDonor} />
    );
  }

  return <TextMessage message={message} isDonor={isDonor} />;
});

// 클린봇에 걸린 메시지. 토글 ON이면 본문을 가리고 "보기"로 펼친다.
// 플래그된 메시지면 토글과 무관하게 마운트되므로, 펼친 상태는 토글 재조작에도 유지된다.
function CleanbotMessage({
  message,
  cleanbotEnabled,
  isDonor,
}: {
  message: LiveChatMessage;
  cleanbotEnabled: boolean;
  isDonor: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  if (!cleanbotEnabled || revealed) {
    return <TextMessage message={message} isDonor={isDonor} />;
  }

  return (
    <p className="text-muted-foreground flex items-center gap-1 py-0.5 text-xs">
      <span>{LIVE_LABEL.cleanbotHidden}</span>
      <Button
        type="button"
        variant="link"
        size="sm"
        aria-label={`${LIVE_LABEL.cleanbotHidden} ${LIVE_LABEL.cleanbotReveal}`}
        className="text-muted-foreground hover:text-foreground h-auto p-0 text-xs font-medium underline"
        onClick={() => setRevealed(true)}
      >
        {LIVE_LABEL.cleanbotReveal}
      </Button>
    </p>
  );
}

function TextMessage({ message, isDonor }: { message: LiveChatMessage; isDonor: boolean }) {
  return (
    <p className="py-0.5 text-sm leading-snug wrap-break-word">
      <span
        className={cn(
          "mr-1.5 inline-flex items-center gap-0.5 align-middle font-medium",
          message.isHost ? "text-live" : "text-brand",
        )}
      >
        {message.isHost ? (
          <Crown aria-label={LIVE_LABEL.hostBadge} className="size-3.5" />
        ) : isDonor ? (
          <Heart aria-label={LIVE_LABEL.donorBadge} className="text-live size-3.5" />
        ) : null}
        {message.author}
      </span>
      <span className="text-foreground">{message.content}</span>
    </p>
  );
}
