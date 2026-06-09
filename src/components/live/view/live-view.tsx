"use client";
// 라이브 시청 메인 화면 — 비디오, 방송 정보, 채팅 패널을 조합합니다.

import { useEffect, useRef, useState } from "react";
import { Timer, Users } from "lucide-react";
import { LiveVideoPlayer } from "@/components/live/view/live-video-player";
import { LiveBroadcastInfo } from "@/components/live/view/live-broadcast-info";
import { LiveCreatorActions } from "@/components/live/view/live-creator-actions";
import { LiveCreatorInfo } from "@/components/live/view/live-creator-info";
import { LiveChatPanel } from "@/components/live/view/live-chat-panel";
import { LiveEndedScreen } from "@/components/live/view/live-ended-screen";
import { LiveLoginPromptDialog } from "@/components/live/view/live-login-prompt-dialog";
import { useIsMobile } from "@/hooks/common/use-mobile";
import { useLiveBroadcastView } from "@/hooks/live/use-live-broadcast-view";
import { useLiveFollowAction } from "@/hooks/live/use-live-follow-action";
import { useLiveElapsed } from "@/hooks/live/use-live-elapsed";
import { useLiveViewerPresence } from "@/hooks/live/use-live-viewer-presence";
import { useMoveToLogin } from "@/hooks/live/use-move-to-login";
import { cn } from "@/lib/utils";
import { formatCount } from "@/utils/live/live-chat";
import { useLiveTheaterStore } from "@/stores/live-theater";
import { LIVE_LABEL } from "@/constants/live/live";
import type { LiveCreator } from "@/types/live/live";

interface Props {
  creatorId: string;
  hlsSrc: string | null;
}

// 스트리머 정보 행(아바타·이름·팔로워 + 팔로우/공유). 라이브·방송 종료 양쪽에서 동일하게 쓴다.
function LiveStreamerRow({
  creator,
  isFollowing,
  isPending,
  onFollow,
  className,
}: {
  creator: LiveCreator;
  isFollowing: boolean;
  isPending: boolean;
  onFollow: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <LiveCreatorInfo creator={creator} />
      <LiveCreatorActions
        creatorNickname={creator.name}
        isFollowing={isFollowing}
        isPending={isPending}
        onFollow={onFollow}
      />
    </div>
  );
}

export function LiveView({ creatorId, hlsSrc }: Props) {
  const moveToLogin = useMoveToLogin();
  const isMobile = useIsMobile();
  const openChatButtonRef = useRef<HTMLButtonElement>(null);
  const collapseChatButtonRef = useRef<HTMLButtonElement>(null);

  const {
    isLoading,
    broadcast,
    lastBroadcast,
    endedElapsedSeconds,
    creator,
    hadLiveBroadcast,
    messages,
    donations,
    polls,
    isPollsLoading,
    isPollsError,
    walletBalance,
    isWalletLoading,
    isWalletError,
    donationEnabled,
    donationMinAmount,
    votePoll,
    sendDonation,
    isFollowing,
    onFollowToggled,
    chatRuleText,
    isLoggedIn,
    isAuthLoading,
    chatState,
    sendMessage,
    acceptChatRule,
  } = useLiveBroadcastView(creatorId);
  const { handleFollow, isFollowPending } = useLiveFollowAction({
    creatorId,
    isFollowing,
    isLoggedIn,
    onFollowToggled,
    onUnauthenticated: openLoginPrompt,
  });

  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [isDesktopChatCollapsed, setIsDesktopChatCollapsed] = useState(false);
  // 와이드(극장) 모드는 전역 사이드바(LiveShell)와 공유해야 해 store에 둔다.
  const isTheater = useLiveTheaterStore((state) => state.isWideMode);
  const toggleTheater = useLiveTheaterStore((state) => state.toggleWideMode);
  const setWideMode = useLiveTheaterStore((state) => state.setWideMode);
  // 방송 종료 시엔 컨트롤 바(채팅 다시 열기 버튼)가 없어 접기를 적용하지 않고 항상 펼친다.
  const isChatCollapsed = isDesktopChatCollapsed && !isMobile && !!broadcast;
  // 시청 중 종료되면 마지막 라이브 스냅샷으로 정보 행(제목·참여자)을 유지하고, 시간은 종료 시점에 고정한다.
  // 종료 시간은 ended_at 기반 endedElapsedSeconds를 우선 쓰고, 도착 전 한 프레임은 스냅샷 경과로 메워 깜빡임을 막는다.
  const displayBroadcast = broadcast ?? lastBroadcast;
  const elapsedText = useLiveElapsed(
    broadcast ? broadcast.elapsedSeconds : (endedElapsedSeconds ?? lastBroadcast?.elapsedSeconds ?? 0),
    !!broadcast,
  );

  // 방송을 보는 동안 하트비트를 보내 현재 시청자 수를 집계한다(로그인·익명 모두).
  useLiveViewerPresence(broadcast?.id);

  // 시청 화면을 떠나면 와이드 모드를 해제해, 목록 등 다른 라이브 화면에서 사이드바가 다시 보이게 한다.
  useEffect(() => () => setWideMode(false), [setWideMode]);

  // 방송이 종료(시청 중 ended 포함)되면 와이드 모드를 풀어, 사이드바와 스트리머 정보 행이 다시 보이게 한다.
  const hasLiveBroadcast = !!broadcast;
  useEffect(() => {
    if (!hasLiveBroadcast) setWideMode(false);
  }, [hasLiveBroadcast, setWideMode]);

  function openLoginPrompt() {
    if (isAuthLoading) return;
    setIsLoginPromptOpen(true);
  }

  function collapseDesktopChat() {
    setIsDesktopChatCollapsed(true);
    requestAnimationFrame(() => {
      openChatButtonRef.current?.focus();
    });
  }

  function expandDesktopChat() {
    setIsDesktopChatCollapsed(false);
    requestAnimationFrame(() => {
      collapseChatButtonRef.current?.focus();
    });
  }

  if (isAuthLoading || isLoading) {
    return (
      <div className="bg-background min-h-app-content flex items-center justify-center">
        <div className="border-brand/30 border-t-brand h-8 w-8 animate-spin rounded-full border-2" />
      </div>
    );
  }

  // 채널 자체가 없는 경우(broadcast·creator 모두 없음)에만 단순 안내로 끝낸다.
  if (!broadcast && !creator) {
    return (
      <div className="bg-background min-h-app-content flex items-center justify-center px-4">
        <p className="text-muted-foreground text-sm">{LIVE_LABEL.broadcastOffline}</p>
      </div>
    );
  }

  // 방송 종료/오프라인: 시청 셸은 유지하고 송출 자리는 종료 화면, 채팅은 입력만 막는다.
  const isEnded = !broadcast;
  // 처음부터 종료된 방송(재진입·새로고침)일 때만 채팅 본문 전체를 오버레이로 덮는다.
  // 시청 중 종료(hadLiveBroadcast)면 그동안 받은 메시지를 그대로 두고 입력만 비활성화한다.
  const showChatEndedOverlay = isEnded && !hadLiveBroadcast;

  return (
    <>
      <div
        className={cn("bg-background overflow-hidden", "min-h-app-content", "md:h-full md:min-h-0")}
      >
        <div
          className={cn(
            "h-full",
            "mx-auto w-full max-w-screen-2xl px-4",
            "md:mx-0 md:max-w-none md:px-0",
            "md:flex md:flex-row md:gap-4",
            isChatCollapsed && "md:gap-0",
          )}
        >
          <div
            className={cn(
              "flex min-w-0 flex-1 flex-col gap-4 py-4",
              "md:pl-4 2xl:pl-6",
              "md:overflow-hidden",
              isTheater && "md:gap-0 md:py-0",
            )}
          >
            <div
              className={cn("md:flex md:min-h-0 md:flex-1 md:items-center md:justify-center")}
            >
              {broadcast ? (
                <LiveVideoPlayer
                  broadcast={broadcast}
                  hlsSrc={hlsSrc}
                  elapsedText={elapsedText}
                  isChatCollapsed={isChatCollapsed}
                  isTheater={isTheater}
                  onToggleTheater={toggleTheater}
                  openChatButtonRef={openChatButtonRef}
                  onOpenChat={expandDesktopChat}
                />
              ) : (
                <LiveEndedScreen creator={creator} />
              )}
            </div>

            {/*
              방송 정보 행(제목·태그 + 시간·참여자): 라이브 중은 물론, 시청 중 종료된 경우에도
              마지막 라이브 스냅샷(displayBroadcast)으로 그대로 유지한다(시간은 종료 시점에 고정).
              처음부터 종료된 방송 재진입은 스냅샷이 없어 행을 생략한다.
            */}
            {displayBroadcast ? (
              <div
                className={cn(
                  "flex items-start justify-between gap-3",
                  broadcast && isTheater && "md:hidden",
                )}
              >
                <LiveBroadcastInfo broadcast={displayBroadcast} />
                <div className="text-muted-foreground flex shrink-0 flex-col items-end gap-1 pt-0.5 text-xs">
                  <span className="flex items-center gap-1">
                    <Timer className="size-3.5" />
                    {elapsedText}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" />
                    {formatCount(displayBroadcast.viewerCount)}
                    {LIVE_LABEL.viewers}
                  </span>
                </div>
              </div>
            ) : null}

            {/* 스트리머 정보 행(아바타·이름·팔로워 + 팔로우)은 라이브·종료 모두 동일하게 보여준다. */}
            {creator ? (
              <LiveStreamerRow
                creator={creator}
                isFollowing={isFollowing}
                isPending={isFollowPending}
                onFollow={handleFollow}
                className={cn(broadcast && isTheater && "md:hidden")}
              />
            ) : null}
          </div>

          <aside
            className={cn(
              "mt-4 transition-all duration-200 ease-out",
              "md:mt-0 md:w-88 md:shrink-0 md:overflow-hidden md:py-4 md:pr-4 md:opacity-100",
              isChatCollapsed && "md:w-0 md:pr-0 md:opacity-0",
            )}
            aria-hidden={isChatCollapsed}
            inert={isChatCollapsed ? true : undefined}
          >
            <LiveChatPanel
              creatorId={creatorId}
              messages={messages}
              donations={donations}
              polls={polls}
              isPollsLoading={isPollsLoading}
              isPollsError={isPollsError}
              chatState={chatState}
              isLoggedIn={isLoggedIn}
              walletBalance={walletBalance}
              isWalletLoading={isWalletLoading}
              isWalletError={isWalletError}
              donationEnabled={donationEnabled}
              donationMinAmount={donationMinAmount}
              onLoginPrompt={openLoginPrompt}
              onSendMessage={sendMessage}
              onVote={votePoll}
              onDonate={sendDonation}
              chatRuleText={chatRuleText}
              onAcceptChatRule={acceptChatRule}
              onFollow={handleFollow}
              isFollowing={isFollowing}
              isFollowPending={isFollowPending}
              onCollapse={broadcast ? collapseDesktopChat : undefined}
              collapseButtonRef={collapseChatButtonRef}
              isEnded={isEnded}
              showEndedOverlay={showChatEndedOverlay}
            />
          </aside>
        </div>
      </div>

      <LiveLoginPromptDialog
        open={isLoginPromptOpen}
        onOpenChange={setIsLoginPromptOpen}
        onLogin={moveToLogin}
      />
    </>
  );
}
