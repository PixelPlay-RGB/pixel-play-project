"use client";
// 방송 운영 UI의 설정, 상태, 채팅 패널을 조합합니다.

import type { ChannelLiveStudioSnapshot } from "@/actions/channel/live";
import ChannelLiveChatPanel from "@/components/channel/live/channel-live-chat-panel";
import { ChannelLiveCollapsibleSection } from "@/components/channel/live/channel-live-collapsible-section";
import ChannelLivePollPanel from "@/components/channel/live/channel-live-poll-panel";
import ChannelLivePreviewPanel from "@/components/channel/live/channel-live-preview-panel";
import ChannelLiveQuickSettingsPanel from "@/components/channel/live/channel-live-quick-settings-panel";
import ChannelLiveSettingsPanel from "@/components/channel/live/channel-live-settings-panel";
import ChannelLiveStreamStatusPanel from "@/components/channel/live/channel-live-stream-status-panel";
import ChannelLiveStatusMetricsCard from "@/components/channel/live/channel-live-status-metrics-card";
import { CHANNEL_LIVE_MEDIA_CONFIG } from "@/constants/channel/channel-live-media";
import { useChannelLiveOperation } from "@/hooks/channel/use-channel-live-operation";
import { cn } from "@/lib/utils";

export type ChannelLiveVisibility = "public" | "private" | "unlisted";
export type ChannelLiveChatScope = "authenticated" | "follower" | "manager";

export interface ChannelLiveState {
  isBroadcasting: boolean;
  hasEnded: boolean;
  visibility: ChannelLiveVisibility;
}

interface Props {
  initialSnapshot?: ChannelLiveStudioSnapshot;
}

function getBroadcastStatusLabel(liveState: ChannelLiveState, isStreamOnline: boolean) {
  if (liveState.isBroadcasting) return "방송 중";
  if (isStreamOnline) return "방송 준비중";
  if (liveState.hasEnded) return "방송 종료";

  return "송출 대기";
}

function getBroadcastStatusClassName(liveState: ChannelLiveState, isStreamOnline: boolean) {
  if (liveState.isBroadcasting) {
    return "bg-destructive/10 text-destructive";
  }

  if (isStreamOnline) {
    return "bg-warning/10 text-warning";
  }

  if (liveState.hasEnded) {
    return "bg-muted text-muted-foreground";
  }

  return "bg-muted text-muted-foreground";
}

function getBroadcastSubStatusLabel(liveState: ChannelLiveState, isStreamOnline: boolean) {
  if (liveState.isBroadcasting) return "시청자에게 공개 중";
  if (isStreamOnline) return "방송 시작 전 미리보기 중";
  if (liveState.hasEnded) return "방송 종료됨";

  return "OBS 송출 대기";
}

export default function ChannelLiveOperationPage({ initialSnapshot }: Props) {
  const creatorId = initialSnapshot?.creatorId;
  const streamPath = initialSnapshot?.streamPath ?? CHANNEL_LIVE_MEDIA_CONFIG.streamPath;
  const operation = useChannelLiveOperation(initialSnapshot);
  const {
    activeBroadcast,
    broadcastActionError,
    broadcastId,
    broadcastStartedAt,
    chatRuleText,
    handleAddTag,
    handleEndBroadcast,
    handleRemoveTag,
    handleSaveSettings,
    handleStartBroadcast,
    handleStreamStatusChange,
    isBroadcastActionPending,
    isSettingsActionPending,
    isSettingsDirty,
    isStreamOnline,
    liveState,
    setTagInput,
    setTitle,
    shouldCaptureAutoThumbnail,
    tagInput,
    tags,
    thumbnail,
    title,
  } = operation;

  const statusMetricsBroadcast = broadcastId
    ? {
        chatMessageCount:
          activeBroadcast?.id === broadcastId ? activeBroadcast.chatMessageCount : 0,
        currentViewerCount:
          activeBroadcast?.id === broadcastId ? activeBroadcast.currentViewerCount : 0,
        donationAmountTotal:
          activeBroadcast?.id === broadcastId ? activeBroadcast.donationAmountTotal : 0,
        donationCount: activeBroadcast?.id === broadcastId ? activeBroadcast.donationCount : 0,
        id: broadcastId,
        peakViewerCount: activeBroadcast?.id === broadcastId ? activeBroadcast.peakViewerCount : 0,
        startedAt: broadcastStartedAt ?? activeBroadcast?.startedAt ?? "",
        title,
      }
    : null;

  return (
    // 시청 화면과 같은 풀블리드 레이아웃 — 칼럼·섹션은 여백 대신 border로 구분한다.
    <div className="flex flex-col xl:h-full xl:min-h-0 xl:overflow-hidden">
      <div className="grid xl:h-full xl:min-h-0 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)_minmax(16rem,0.85fr)] xl:overflow-hidden">
        <div className="flex min-w-0 flex-col xl:h-full xl:max-h-full xl:min-h-0 xl:overflow-y-auto">
          <div className="border-border flex shrink-0 flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold",
                  getBroadcastStatusClassName(liveState, isStreamOnline),
                )}
              >
                <span className="relative flex size-2.5">
                  {liveState.isBroadcasting && (
                    <span className="bg-destructive absolute inline-flex size-full animate-ping rounded-full opacity-75" />
                  )}
                  <span
                    className={cn(
                      "relative inline-flex size-2.5 rounded-full",
                      liveState.isBroadcasting
                        ? "bg-destructive"
                        : isStreamOnline
                          ? "bg-warning"
                          : "bg-muted-foreground",
                    )}
                  />
                </span>
                {getBroadcastStatusLabel(liveState, isStreamOnline)}
              </span>
              <span className="text-foreground text-sm font-semibold">
                {getBroadcastSubStatusLabel(liveState, isStreamOnline)}
              </span>
            </div>
          </div>
          <div className="border-border shrink-0 border-b">
            <ChannelLivePreviewPanel
              isStreamOnline={isStreamOnline}
              liveState={liveState}
              streamPath={streamPath}
              title={title}
            />
          </div>
          <ChannelLiveCollapsibleSection title="방송 정보">
            <ChannelLiveSettingsPanel
              broadcastActionError={broadcastActionError}
              canSaveSettings={isSettingsDirty}
              isBroadcastActionPending={isBroadcastActionPending}
              isSettingsActionPending={isSettingsActionPending}
              secondaryPanel={
                <ChannelLiveStreamStatusPanel
                  activeBroadcastStartedAt={broadcastStartedAt}
                  onStatusChange={handleStreamStatusChange}
                  shouldCaptureAutoThumbnail={shouldCaptureAutoThumbnail}
                  streamPath={streamPath}
                  variant="embedded"
                />
              }
              thumbnailPreviewName={thumbnail.thumbnailPreviewName}
              thumbnailPreviewUrl={thumbnail.thumbnailPreviewUrl}
              title={title}
              tagInput={tagInput}
              tags={tags}
              liveState={liveState}
              onThumbnailFileChange={thumbnail.handleThumbnailFileChange}
              onThumbnailRemove={thumbnail.handleThumbnailRemove}
              onTitleChange={setTitle}
              onTagInputChange={setTagInput}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onSaveSettings={handleSaveSettings}
              onStartBroadcast={handleStartBroadcast}
              onEndBroadcast={handleEndBroadcast}
            />
          </ChannelLiveCollapsibleSection>
          <ChannelLiveCollapsibleSection title="방송 상태">
            <ChannelLiveStatusMetricsCard broadcast={statusMetricsBroadcast} />
          </ChannelLiveCollapsibleSection>
          <ChannelLiveCollapsibleSection title="라이브 상호작용">
            <ChannelLivePollPanel broadcastId={broadcastId} creatorId={creatorId} />
          </ChannelLiveCollapsibleSection>
        </div>

        <div className="border-border min-w-0 xl:h-full xl:min-h-0 xl:border-x">
          <ChannelLiveChatPanel
            key={broadcastId ?? "channel-live-chat-idle"}
            broadcastId={broadcastId}
            creatorId={creatorId}
            chatRuleText={chatRuleText}
          />
        </div>

        <div className="min-w-0 xl:h-full xl:min-h-0 xl:overflow-y-auto">
          <ChannelLiveQuickSettingsPanel
            canSaveSettings={isSettingsDirty}
            isAlertSoundEnabled={operation.isAlertSoundEnabled}
            isChatDonationMessageEnabled={operation.isChatDonationMessageEnabled}
            isDonationAmountVisible={operation.isDonationAmountVisible}
            isDonationEnabled={operation.isDonationEnabled}
            isLinkBlocked={operation.isLinkBlocked}
            isSettingsActionPending={isSettingsActionPending}
            isSlowModeEnabled={operation.isSlowModeEnabled}
            isTtsEnabled={operation.isTtsEnabled}
            slowModeSeconds={operation.slowModeSeconds}
            onAlertSoundEnabledChange={operation.setIsAlertSoundEnabled}
            onChatDonationMessageEnabledChange={operation.setIsChatDonationMessageEnabled}
            onDonationAmountVisibleChange={operation.setIsDonationAmountVisible}
            onDonationEnabledChange={operation.setIsDonationEnabled}
            onLinkBlockedChange={operation.setIsLinkBlocked}
            onSaveSettings={handleSaveSettings}
            onSlowModeEnabledChange={operation.setIsSlowModeEnabled}
            onSlowModeSecondsChange={operation.setSlowModeSeconds}
            onTtsEnabledChange={operation.setIsTtsEnabled}
          />
        </div>
      </div>
    </div>
  );
}
