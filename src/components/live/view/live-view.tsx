"use client";
// 라이브 시청 화면 최상위 조립 컴포넌트입니다. 전체 레이아웃과 상태를 관리합니다.

import { useState } from "react";
import { Timer, Users } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LiveVideoPlayer } from "@/components/live/view/live-video-player";
import { LiveBroadcastInfo } from "@/components/live/view/live-broadcast-info";
import { LiveCreatorActions } from "@/components/live/view/live-creator-actions";
import { LiveCreatorInfo } from "@/components/live/view/live-creator-info";
import { LiveChatPanel } from "@/components/live/view/live-chat-panel";
import { LiveLoginPromptDialog } from "@/components/live/view/live-login-prompt-dialog";
import { useLiveWatch } from "@/hooks/live/use-live-watch";
import { useLiveMessages } from "@/hooks/live/use-live-messages";
import { useFollowCreator } from "@/hooks/live/use-follow-creator";
import { sendLiveMessageAction } from "@/actions/live/live";
// TODO [mock]: UUID 라우팅 연결 시 MOCK_LIVE_BROADCASTS · MOCK_DEFAULT_BROADCAST · MOCK_LIVE_CHAT_MESSAGES 제거
import { MOCK_LIVE_BROADCASTS, MOCK_DEFAULT_BROADCAST, MOCK_LIVE_CHAT_MESSAGES, MOCK_LIVE_DONATIONS, MOCK_LIVE_POLLS } from "@/mock/live-room";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { createPathWithNext } from "@/utils/common/redirect";
import { formatElapsedTime, formatViewerCount } from "@/utils/live/live-chat";
import { LIVE_LABEL } from "@/constants/live/live";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { toastAppError } from "@/utils/common/toast-message";
import { mapLiveWatchToBroadcast } from "@/types/live/live";

interface Props {
  creatorId: string;
}

export function LiveView({ creatorId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const isAuthLoading = useAuthStore((s) => s.loading);

  const { data: watchData, isLoading, refetch } = useLiveWatch(creatorId);

  // TODO [mock]: UUID 라우팅 연결 시 isMockMode 분기 제거, broadcast · messages · chatState 단순화
  const isMockMode = watchData === null;
  const broadcast = isMockMode
    ? (MOCK_LIVE_BROADCASTS[creatorId] ?? MOCK_DEFAULT_BROADCAST)
    : mapLiveWatchToBroadcast(watchData);
  const realtimeMessages = useLiveMessages(isMockMode ? null : broadcast?.id);
  const messages = isMockMode ? MOCK_LIVE_CHAT_MESSAGES : realtimeMessages;

  const isLoggedIn = Boolean(user);
  const isFollowing = watchData?.viewerRelation?.isFollowing ?? false;
  const chatState = watchData?.viewerChatState ?? {
    canChat: isLoggedIn,
    chatUnavailableReason: null,
    remainingFollowWaitSeconds: 0,
    remainingSlowModeSeconds: 0,
  };

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
    if (!isLoggedIn) { openLoginPrompt(); return; }
    void toggleFollow();
  }

  async function handleSendMessage(content: string) {
    if (!broadcast?.id) return;
    const result = await sendLiveMessageAction(broadcast.id, content);
    if (!result.success) toastAppError(result.code ?? APP_MESSAGE_CODE.error.message.sendFailed);
  }

  if (isAuthLoading || isLoading) return null;

  if (!broadcast) {
    return (
      <div className="bg-background flex min-h-app-content items-center justify-center">
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
              "min-w-0 flex-1 flex flex-col gap-4 py-4",
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
                  {formatViewerCount(broadcast.viewerCount)}{LIVE_LABEL.viewers}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <LiveCreatorInfo broadcast={broadcast} />
              <LiveCreatorActions
                isFollowing={isFollowing}
                isPending={isFollowPending}
                onFollow={handleFollow}
                isLoggedIn={isLoggedIn}
              />
            </div>

          </div>

          <aside className="mt-4 md:mt-0 md:w-88.25 md:shrink-0 md:py-4 md:pr-4">
            <LiveChatPanel
              messages={messages}
              donations={MOCK_LIVE_DONATIONS}
              polls={MOCK_LIVE_POLLS}
              chatState={chatState}
              isLoggedIn={isLoggedIn}
              onLoginPrompt={openLoginPrompt}
              onSendMessage={handleSendMessage}
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
