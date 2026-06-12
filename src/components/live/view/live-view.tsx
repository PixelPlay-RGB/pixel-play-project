"use client";
// 라이브 시청 메인 화면 — 비디오, 방송 정보, 채팅 패널을 조합합니다.

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Timer, Users } from "lucide-react";
import { ClipCreateDialog } from "@/components/clip/clip-create-dialog";
import { LiveVideoPlayer } from "@/components/live/view/live-video-player";
import { LiveFullscreenChatOverlay } from "@/components/live/view/live-fullscreen-chat-overlay";
import { LiveBroadcastInfo } from "@/components/live/view/live-broadcast-info";
import { LiveStreamerRow } from "@/components/live/view/live-streamer-row";
import { LiveChatPanel } from "@/components/live/view/live-chat-panel";
import { LiveEndedScreen } from "@/components/live/view/live-ended-screen";
import { LiveLoginPromptDialog } from "@/components/live/view/live-login-prompt-dialog";
import { useClipCreation } from "@/hooks/clip/use-clip-creation";
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

interface Props {
  creatorId: string;
  hlsSrc: string | null;
}

export function LiveView({ creatorId, hlsSrc }: Props) {
  const moveToLogin = useMoveToLogin();
  const isMobile = useIsMobile();
  const openChatButtonRef = useRef<HTMLButtonElement>(null);
  const collapseChatButtonRef = useRef<HTMLButtonElement>(null);
  // 좌측 플레이어 칼럼 실측 — 채팅 입력 섹션 높이를 "칼럼 높이 - 비디오(폭 100%·16:9) 높이"로
  // 동기화해, 입력 섹션 상단 separator가 비디오 하단 라인과 정확히 일직선이 되게 한다.
  const playerColumnRef = useRef<HTMLDivElement>(null);

  const {
    isLoading,
    broadcast,
    lastBroadcast,
    endedElapsedSeconds,
    creator,
    messages,
    loadOlderMessages,
    isLoadingOlderMessages,
    hasMoreChatHistory,
    entryNoticeAnchorId,
    donations,
    polls,
    isPollsLoading,
    isPollsError,
    interactionNotices,
    isInteractionNoticesLoading,
    isInteractionNoticesError,
    walletBalance,
    isWalletLoading,
    isWalletError,
    donationEnabled,
    donationMinAmount,
    votePoll,
    joinDraw,
    sendDonation,
    isFollowing,
    onFollowToggled,
    chatRuleText,
    isLoggedIn,
    isAuthLoading,
    chatState,
    sendMessage,
    acceptChatRule,
    refreshChatState,
    followerWaitSeconds,
    slowModeSeconds,
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
  // 클립 생성 Dialog — 열림 여부와 버튼 클릭 시점의 프레임 스냅샷을 함께 든다.
  const [clipDialog, setClipDialog] = useState<{
    open: boolean;
    snapshotDataUrl: string | null;
  }>({ open: false, snapshotDataUrl: null });
  const { createClip, isSubmitting: isClipSubmitting } = useClipCreation(creatorId);
  // 와이드(극장) 모드는 전역 사이드바(LiveShell)와 공유해야 해 store에 둔다.
  const isTheater = useLiveTheaterStore((state) => state.isWideMode);
  const toggleTheater = useLiveTheaterStore((state) => state.toggleWideMode);
  const setWideMode = useLiveTheaterStore((state) => state.setWideMode);
  // 방송 종료 시엔 컨트롤 바(채팅 다시 열기 버튼)가 없어 접기를 적용하지 않고 항상 펼친다.
  const isChatCollapsed = isDesktopChatCollapsed && !isMobile && !!broadcast;
  // 영화관 모드에서 비디오 아래 정보 영역(제목·스트리머 행)을 접는다(데스크탑 전용).
  const isInfoCollapsed = !!broadcast && isTheater && !isMobile;
  const prefersReducedMotion = useReducedMotion();
  // 시청 중 종료되면 마지막 라이브 스냅샷으로 정보 행(제목·참여자)을 유지하고, 시간은 종료 시점에 고정한다.
  // 종료 시간은 ended_at 기반 endedElapsedSeconds를 우선 쓰고, 도착 전 한 프레임은 스냅샷 경과로 메워 깜빡임을 막는다.
  const displayBroadcast = broadcast ?? lastBroadcast;
  const elapsedText = useLiveElapsed(
    broadcast
      ? broadcast.elapsedSeconds
      : (endedElapsedSeconds ?? lastBroadcast?.elapsedSeconds ?? 0),
    !!broadcast,
  );

  // 방송을 보는 동안 하트비트를 보내 현재 시청자 수를 집계한다(로그인·익명 모두).
  useLiveViewerPresence(broadcast?.id);

  // 채팅 입력 섹션의 동기화 높이(px). 송출/종료 프레임이 16:9로 폭을 꽉 채우는 일반 모드에서만 계산하고,
  // 화면이 낮아 자연 높이보다 작아지면 입력바가 자체 콘텐츠 높이로 버틴다(min-height라 안전).
  const [chatInputMinHeight, setChatInputMinHeight] = useState<number | null>(null);
  const hasPlayerFrameForSync = !!creator;
  useEffect(() => {
    const column = playerColumnRef.current;

    if (!column || isMobile || isTheater || !hasPlayerFrameForSync) {
      setChatInputMinHeight(null);
      return;
    }

    const sync = () => {
      const rect = column.getBoundingClientRect();
      const remaining = Math.round(rect.height - (rect.width * 9) / 16);
      setChatInputMinHeight(remaining > 0 ? remaining : null);
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(column);

    return () => observer.disconnect();
  }, [isMobile, isTheater, hasPlayerFrameForSync]);

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

  // 클립 버튼: 로그인 게이트를 먼저 통과시키고, 스냅샷과 함께 생성 Dialog를 연다.
  function handleClipRequest(snapshotDataUrl: string | null) {
    if (!isLoggedIn) {
      openLoginPrompt();
      return;
    }
    setClipDialog({ open: true, snapshotDataUrl });
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

  return (
    <>
      <div
        className={cn("bg-background overflow-hidden", "min-h-app-content", "md:h-full md:min-h-0")}
      >
        {/* 치지직형 Box 레이아웃: 섹션 사이 여백·라운드 없이 보더로만 구분하고, 텍스트 행에만 자체 패딩을 준다. */}
        <div className={cn("h-full", "w-full", "md:flex md:flex-row")}>
          {/* 플레이어는 항상 폭 100%+16:9(유튜브식) — 화면이 낮아 정보 행이 넘치면 이 칼럼만
              세로 스크롤된다(스크롤바는 숨김, 채팅 패널은 우측 고정 유지). 극장 모드는 스크롤이 없다.
              추후 정보 섹션 아래에 클립 섹션이 들어올 예정이라 칼럼 스크롤 구조를 전제로 한다. */}
          <div
            ref={playerColumnRef}
            className={cn("flex min-w-0 flex-1 flex-col", "no-scrollbar md:overflow-y-auto")}
          >
            {/* 일반 모드는 shrink-0 — 칼럼이 넘칠 때 눌리는 대신 스크롤로 넘어가야 한다. */}
            <div className={cn(isTheater ? "md:min-h-0 md:flex-1" : "md:shrink-0")}>
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
                  onClipRequest={handleClipRequest}
                  renderFullscreenChat={({
                    container,
                    isChatOpen,
                    onToggleChat,
                    isDonationRequested,
                    onDonationSettled,
                  }) => (
                    <LiveFullscreenChatOverlay
                      container={container}
                      isChatOpen={isChatOpen}
                      onToggleChat={onToggleChat}
                      donationOpenRequested={isDonationRequested}
                      onDonationOpenSettled={onDonationSettled}
                      messages={messages}
                      donations={donations}
                      polls={polls}
                      interactionNotices={interactionNotices}
                      isPollsLoading={isPollsLoading}
                      isPollsError={isPollsError}
                      isInteractionNoticesLoading={isInteractionNoticesLoading}
                      isInteractionNoticesError={isInteractionNoticesError}
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
                      onJoinDraw={joinDraw}
                      onDonate={sendDonation}
                      chatRuleText={chatRuleText}
                      onAcceptChatRule={acceptChatRule}
                      onFollow={handleFollow}
                      isFollowing={isFollowing}
                      isFollowPending={isFollowPending}
                      onLoadOlderMessages={loadOlderMessages}
                      isLoadingOlderMessages={isLoadingOlderMessages}
                      hasMoreChatHistory={hasMoreChatHistory}
                      entryNoticeAnchorId={entryNoticeAnchorId}
                      onRefreshChatState={refreshChatState}
                      followerWaitSeconds={followerWaitSeconds}
                      slowModeSeconds={slowModeSeconds}
                    />
                  )}
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
            {/*
              영화관 모드 전환 시 정보 영역을 height 애니메이션으로 접어, 비디오가 좌하단으로
              자연스럽게 늘어나는 연출을 만든다(사이드바 collapse와 같은 preset). 모바일은
              영화관 모드 자체가 없으므로 motion height를 적용하지 않는다.
            */}
            <motion.div
              className={cn("shrink-0 overflow-hidden", isInfoCollapsed && "pointer-events-none")}
              aria-hidden={isInfoCollapsed || undefined}
              inert={isInfoCollapsed || undefined}
              initial={false}
              animate={isInfoCollapsed ? { height: 0, opacity: 0 } : { height: "auto", opacity: 1 }}
              transition={
                prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }
              }
            >
              {displayBroadcast ? (
                <div className="flex items-start justify-between gap-3 px-4 pt-4">
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
              ) : (
                // 방송 중이 아니면 제목·시간이 비어 비디오 영역만 길어지므로, 같은 자리에 안내 문구를 채워 높이를 유지한다.
                <div className="flex min-w-0 flex-col gap-1.5 px-4 pt-4">
                  <h1 className="text-foreground truncate text-base leading-snug font-semibold sm:text-lg">
                    {LIVE_LABEL.offlineInfoTitle}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {LIVE_LABEL.offlineInfoDescription}
                  </p>
                </div>
              )}

              {/* 스트리머 정보 행(아바타·이름·팔로워 + 팔로우)은 라이브·종료 모두 동일하게 보여준다. */}
              {creator ? (
                // py-3: 정보 영역을 141px로 낮춰(우측 입력바와 동일) FHD에서 비디오가 16:9에 딱 맞게
                // 들어가도록 한다(149px일 땐 높이가 7px 모자라 좌우에 검은 필러박스가 생겼다).
                <LiveStreamerRow
                  creator={creator}
                  isLive={!!broadcast}
                  isFollowing={isFollowing}
                  isPending={isFollowPending}
                  onFollow={handleFollow}
                  className="px-4 py-3"
                />
              ) : null}
            </motion.div>
          </div>

          <aside
            className={cn(
              "transition-all duration-200 ease-out",
              "md:w-88 md:shrink-0 md:overflow-hidden md:opacity-100",
              isChatCollapsed && "md:w-0 md:opacity-0",
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
              interactionNotices={interactionNotices}
              isInteractionNoticesLoading={isInteractionNoticesLoading}
              isInteractionNoticesError={isInteractionNoticesError}
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
              onJoinDraw={joinDraw}
              onDonate={sendDonation}
              chatRuleText={chatRuleText}
              onAcceptChatRule={acceptChatRule}
              onFollow={handleFollow}
              isFollowing={isFollowing}
              isFollowPending={isFollowPending}
              onCollapse={broadcast ? collapseDesktopChat : undefined}
              collapseButtonRef={collapseChatButtonRef}
              onLoadOlderMessages={loadOlderMessages}
              isLoadingOlderMessages={isLoadingOlderMessages}
              hasMoreChatHistory={hasMoreChatHistory}
              entryNoticeAnchorId={entryNoticeAnchorId}
              onRefreshChatState={refreshChatState}
              followerWaitSeconds={followerWaitSeconds}
              slowModeSeconds={slowModeSeconds}
              inputMinHeightPx={chatInputMinHeight}
            />
          </aside>
        </div>
      </div>

      <LiveLoginPromptDialog
        open={isLoginPromptOpen}
        onOpenChange={setIsLoginPromptOpen}
        onLogin={moveToLogin}
      />

      <ClipCreateDialog
        open={clipDialog.open}
        onOpenChange={(open) => setClipDialog((prev) => ({ ...prev, open }))}
        snapshotDataUrl={clipDialog.snapshotDataUrl}
        defaultTitle={broadcast?.title ?? ""}
        isSubmitting={isClipSubmitting}
        onSubmit={createClip}
      />
    </>
  );
}
