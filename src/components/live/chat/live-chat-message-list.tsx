"use client";
// 라이브 채팅 메시지 목록 — TanStack Virtual로 보이는 구간만 렌더링하고 하단 근접 시 자동 스크롤한다.
// 위로 스크롤해 상단에 닿으면 과거 채팅을 한 페이지씩 적재한다(가상화 덕에 DOM은 화면 분량 유지).

import { memo, useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { LiveChatDonationMessageCard } from "@/components/live/chat/live-chat-donation-message-card";
import { LiveChatProfilePopover } from "@/components/live/chat/live-chat-profile-popover";
import { LiveChatRoleBadge, type LiveChatRole } from "@/components/live/chat/live-chat-role-badge";
import { LIVE_LABEL } from "@/constants/live/live";
import { getLiveChatOverlayNicknameColor } from "@/utils/live/live-chat-overlay-style";
import type { LiveChatMessage, LiveChatProfileContext } from "@/types/live/live";

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
  // 닉네임 클릭 팝업(프로필/강퇴) 컨텍스트. 미지정 시 닉네임은 클릭 불가 텍스트로 렌더한다(#119).
  // memo 보존을 위해 목록에서 원시값으로 펼쳐 각 메시지에 넘긴다.
  profileContext?: LiveChatProfileContext;
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
  profileContext,
}: Props) {
  // 바닥 고정 모드 — 사용자가 위로 스크롤하면 풀리고, 바닥 근처로 돌아오면 다시 걸린다.
  // 진입·새 메시지·행 실측으로 우리가 일으키는 프로그램 스크롤은 이 판정에서 제외해야 한다
  // (실측으로 목록 높이가 점프하는 순간 "위로 스크롤했다"고 오판해 고정이 풀리는 문제 방지).
  const isPinnedToBottomRef = useRef(true);
  const isProgrammaticScrollRef = useRef(false);
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

    const handleScroll = () => {
      // 우리가 일으킨 스크롤(바닥 고정·prepend 보정)은 사용자 의도 판정·적재 트리거에서 제외한다.
      if (isProgrammaticScrollRef.current) {
        isProgrammaticScrollRef.current = false;
        return;
      }

      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      isPinnedToBottomRef.current = distanceFromBottom < 60;

      // 상단 근접 시 과거 페이지 적재를 요청한다. 중복 호출은 훅 내부 가드(isLoadingOlder)가 막는다.
      if (
        hasMoreChatHistory &&
        !isLoadingOlderMessages &&
        container.scrollTop < LOAD_OLDER_THRESHOLD_PX
      ) {
        onLoadOlderMessages?.();
      }
    };

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

    isProgrammaticScrollRef.current = true;
    container.scrollTop += prependedCount * (ESTIMATED_ROW_HEIGHT + ROW_GAP);
  }, [messages, scrollRef]);

  // 바닥 고정 — 행 추가(rowCount)뿐 아니라 행 실측 보정으로 전체 높이(totalSize)가 바뀔 때마다
  // 다시 바닥에 붙인다. 진입 직후 실측으로 높이가 몇 번을 점프해도 사용자가 스크롤하기 전까지는
  // 고정이 유지되므로, 데이터가 다 로드된 최종 높이에서 정확히 최하단에 수렴한다.
  const totalSize = virtualizer.getTotalSize();
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container || !isPinnedToBottomRef.current) return;

    const target = container.scrollHeight - container.clientHeight;
    if (Math.abs(container.scrollTop - target) > 1) {
      isProgrammaticScrollRef.current = true;
      container.scrollTop = target;
    }
  }, [rowCount, totalSize, scrollRef]);

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
                profileCreatorId={profileContext?.creatorId}
                profileViewerId={profileContext?.viewerId ?? null}
                profileCanModerate={profileContext?.canModerate ?? false}
                profileBroadcastId={profileContext?.broadcastId ?? null}
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
  // 닉네임 클릭 팝업 컨텍스트(원시값) — creatorId 가 있고 senderId 가 있을 때만 닉네임을 클릭 가능하게 한다.
  profileCreatorId?: string;
  profileViewerId?: string | null;
  profileCanModerate?: boolean;
  profileBroadcastId?: string | null;
}

// 메시지가 바뀌지 않은 기존 항목은 새 메시지 도착마다 재렌더되지 않게 memo로 감싼다.
// props가 모두 원시값/안정 ref(message 객체는 캐시에서 ref 유지)라 얕은 비교로 충분하다.
const MessageItem = memo(function MessageItem({
  message,
  cleanbotEnabled,
  profileCreatorId,
  profileViewerId = null,
  profileCanModerate = false,
  profileBroadcastId = null,
}: MessageItemProps) {
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

  // 닉네임 클릭 팝업은 발신자 신원(senderId)이 있고 시청 컨텍스트(creatorId)가 주어졌을 때만 연다.
  // 익명 후원·시스템 메시지는 senderId 가 없어 클릭 불가 텍스트로 렌더된다.
  const profileContext: LiveChatProfileContext | null =
    profileCreatorId && message.senderId
      ? {
          creatorId: profileCreatorId,
          viewerId: profileViewerId,
          canModerate: profileCanModerate,
          broadcastId: profileBroadcastId,
        }
      : null;

  return <TextMessage message={message} isMasked={isMasked} profileContext={profileContext} />;
});

function TextMessage({
  message,
  isMasked,
  profileContext,
}: {
  message: LiveChatMessage;
  isMasked: boolean;
  profileContext: LiveChatProfileContext | null;
}) {
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
      {profileContext && message.senderId ? (
        <LiveChatProfilePopover
          context={profileContext}
          targetUserId={message.senderId}
          fallbackNickname={message.author ?? ""}
          nicknameColor={nicknameColor}
        />
      ) : (
        <span className="mr-1.5 font-medium" style={{ color: nicknameColor }}>
          {message.author}
        </span>
      )}
      {isMasked ? (
        <span className="text-muted-foreground">{LIVE_LABEL.cleanbotHidden}</span>
      ) : (
        <span className="text-foreground">{message.content}</span>
      )}
    </p>
  );
}
