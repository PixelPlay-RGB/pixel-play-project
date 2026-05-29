"use client";
// 라이브 시청 메인 화면 — 비디오, 방송 정보, 채팅 패널을 조합합니다.

import { useState } from "react";
import { Timer, Users } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LiveVideoPlayer } from "@/components/live/view/live-video-player";
import { LiveBroadcastInfo } from "@/components/live/view/live-broadcast-info";
import { LiveCreatorActions } from "@/components/live/view/live-creator-actions";
import { LiveCreatorInfo } from "@/components/live/view/live-creator-info";
import { LiveChatPanel } from "@/components/live/view/live-chat-panel";
import { LiveLoginPromptDialog } from "@/components/live/view/live-login-prompt-dialog";
import { useLiveBroadcastView } from "@/hooks/live/use-live-broadcast-view";
import { useFollowCreator } from "@/hooks/live/use-follow-creator";
import { cn } from "@/lib/utils";
import { createPathWithNext } from "@/utils/common/redirect";
import { formatElapsedTime, formatCount } from "@/utils/live/live-chat";
import { LIVE_LABEL } from "@/constants/live/live";

interface Props {
  creatorId: string;
}

export function LiveView({ creatorId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    isLoading,
    refetch,
    broadcast,
    messages,
    donations,
    polls,
    walletBalance,
    isWalletLoading,
    isWalletError,
    votePoll,
    sendDonation,
    isFollowing,
    chatRuleText,
    isLoggedIn,
    isAuthLoading,
    chatState,
    sendMessage,
    acceptChatRule,
  } = useLiveBroadcastView(creatorId);
  const { toggleFollow, isPending: isFollowPending } = useFollowCreator(
    creatorId,
    isFollowing,
    () => void refetch(),
  );

  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);

  function openLoginPrompt() {
    if (isAuthLoading) return;
    setIsLoginPromptOpen(true);
  }

  function moveToLogin() {
    const query = searchParams.toString();
    const next = `${pathname}${query ? `?${query}` : ""}`;
    router.push(createPathWithNext("/auth/login", next));
  }

  function handleFollow() {
    if (!isLoggedIn) {
      openLoginPrompt();
      return;
    }
    void toggleFollow();
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
        className={cn(
          "bg-background overflow-hidden",
          "min-h-app-content",
          "md:fixed md:inset-x-0 md:top-(--app-header-height) md:bottom-0 md:min-h-0",
        )}
      >
        <div
          className={cn(
            "h-full",
            "mx-auto w-full max-w-screen-2xl px-4",
            "md:mx-0 md:max-w-none md:px-0",
            "md:flex md:flex-row md:gap-4",
          )}
        >
          <div
            className={cn(
              "flex min-w-0 flex-1 flex-col gap-4 py-4",
              "md:pl-4 2xl:pl-6",
              "md:overflow-y-auto",
            )}
          >
            <LiveVideoPlayer broadcast={broadcast} />

            <div className="flex items-start justify-between gap-3">
              <LiveBroadcastInfo broadcast={broadcast} />
              <div className="text-muted-foreground flex shrink-0 flex-col items-end gap-1 pt-0.5 text-xs">
                <span className="flex items-center gap-1">
                  <Timer className="size-3.5" />
                  {formatElapsedTime(broadcast.elapsedSeconds)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  {formatCount(broadcast.viewerCount)}
                  {LIVE_LABEL.viewers}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <LiveCreatorInfo broadcast={broadcast} />
              <LiveCreatorActions
                isFollowing={isFollowing}
                isPending={isFollowPending}
                onFollow={handleFollow}
              />
            </div>
          </div>

          <aside className="mt-4 md:mt-0 md:w-88 md:shrink-0 md:py-4 md:pr-4">
            <LiveChatPanel
              creatorId={creatorId}
              messages={messages}
              donations={donations}
              polls={polls}
              chatState={chatState}
              isLoggedIn={isLoggedIn}
              walletBalance={walletBalance}
              isWalletLoading={isWalletLoading}
              isWalletError={isWalletError}
              onLoginPrompt={openLoginPrompt}
              onSendMessage={sendMessage}
              onVote={votePoll}
              onDonate={sendDonation}
              chatRuleText={chatRuleText}
              onAcceptChatRule={acceptChatRule}
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
