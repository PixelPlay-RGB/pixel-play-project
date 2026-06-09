"use client";
// 라이브 시청 메인 화면 — 비디오, 방송 정보, 채팅 패널을 조합합니다.

import { useRef, useState } from "react";
import { Timer, Users } from "lucide-react";
import { LiveVideoPlayer } from "@/components/live/view/live-video-player";
import { LiveBroadcastInfo } from "@/components/live/view/live-broadcast-info";
import { LiveCreatorActions } from "@/components/live/view/live-creator-actions";
import { LiveCreatorInfo } from "@/components/live/view/live-creator-info";
import { LiveChatPanel } from "@/components/live/view/live-chat-panel";
import { LiveLoginPromptDialog } from "@/components/live/view/live-login-prompt-dialog";
import { useIsMobile } from "@/hooks/common/use-mobile";
import { useLiveBroadcastView } from "@/hooks/live/use-live-broadcast-view";
import { useLiveFollowAction } from "@/hooks/live/use-live-follow-action";
import { useLiveElapsed } from "@/hooks/live/use-live-elapsed";
import { useLiveViewerPresence } from "@/hooks/live/use-live-viewer-presence";
import { useMoveToLogin } from "@/hooks/live/use-move-to-login";
import { cn } from "@/lib/utils";
import { formatCount } from "@/utils/live/live-chat";
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

  const {
    isLoading,
    broadcast,
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
  const [isTheater, setIsTheater] = useState(false);
  const isChatCollapsed = isDesktopChatCollapsed && !isMobile;
  const elapsedText = useLiveElapsed(broadcast?.elapsedSeconds ?? 0);

  // 방송을 보는 동안 하트비트를 보내 현재 시청자 수를 집계한다(로그인·익명 모두).
  useLiveViewerPresence(broadcast?.id);

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

  function toggleTheater() {
    setIsTheater((prev) => !prev);
  }

  if (isAuthLoading || isLoading) {
    return (
      <div className="bg-background min-h-app-content flex items-center justify-center">
        <div className="border-brand/30 border-t-brand h-8 w-8 animate-spin rounded-full border-2" />
      </div>
    );
  }

  if (!broadcast) {
    return (
      <div className="bg-background min-h-app-content flex items-center justify-center">
        <p className="text-muted-foreground text-sm">{LIVE_LABEL.broadcastOffline}</p>
      </div>
    );
  }

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
            </div>

            <div className={cn("flex items-start justify-between gap-3", isTheater && "md:hidden")}>
              <LiveBroadcastInfo broadcast={broadcast} />
              <div className="text-muted-foreground flex shrink-0 flex-col items-end gap-1 pt-0.5 text-xs">
                <span className="flex items-center gap-1">
                  <Timer className="size-3.5" />
                  {elapsedText}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  {formatCount(broadcast.viewerCount)}
                  {LIVE_LABEL.viewers}
                </span>
              </div>
            </div>

            <div
              className={cn("flex items-center justify-between gap-3", isTheater && "md:hidden")}
            >
              <LiveCreatorInfo broadcast={broadcast} />
              <LiveCreatorActions
                creatorNickname={broadcast.creator.name}
                isFollowing={isFollowing}
                isPending={isFollowPending}
                onFollow={handleFollow}
              />
            </div>
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
              onCollapse={collapseDesktopChat}
              collapseButtonRef={collapseChatButtonRef}
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
