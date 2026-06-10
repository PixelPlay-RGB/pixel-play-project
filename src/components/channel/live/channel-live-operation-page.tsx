"use client";
// 방송 운영 UI의 설정, 상태, 채팅 패널을 조합합니다.

import {
  endLiveBroadcastAction,
  saveChannelLiveThumbnailAction,
  startLiveBroadcastAction,
  updateChannelLiveChatPausedAction,
  type ChannelLiveStudioSnapshot,
  updateChannelLiveSettingsAction,
  uploadChannelLiveThumbnailAction,
} from "@/actions/channel/live";
import ChannelLiveChatPanel from "@/components/channel/live/channel-live-chat-panel";
import ChannelLivePollPanel from "@/components/channel/live/channel-live-poll-panel";
import ChannelLivePreviewPanel from "@/components/channel/live/channel-live-preview-panel";
import ChannelLiveQuickSettingsPanel from "@/components/channel/live/channel-live-quick-settings-panel";
import ChannelLiveSettingsPanel from "@/components/channel/live/channel-live-settings-panel";
import ChannelLiveStreamStatusPanel from "@/components/channel/live/channel-live-stream-status-panel";
import ChannelLiveStatusMetricsCard from "@/components/channel/live/channel-live-status-metrics-card";
import { CHANNEL_LIVE_MEDIA_CONFIG } from "@/constants/channel/channel-live-media";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { cn } from "@/lib/utils";
import type { ChannelLiveStreamStatusResponse } from "@/types/channel/channel-live-stream";
import { isAutoLiveThumbnailUrl } from "@/utils/channel/channel-live-thumbnail";
import { getAppMessage } from "@/utils/common/app-message";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

export type ChannelLiveVisibility = "public" | "private" | "unlisted";
export type ChannelLiveChatScope = "authenticated" | "follower" | "manager";

export interface ChannelLiveState {
  isBroadcasting: boolean;
  hasEnded: boolean;
  isChatPaused: boolean;
  visibility: ChannelLiveVisibility;
}

interface Props {
  initialSnapshot?: ChannelLiveStudioSnapshot;
}

const DEFAULT_TITLE = "";
const DEFAULT_TAGS: string[] = [];
const BROADCAST_OFFLINE_AUTO_END_TIMEOUT_MS = 30 * 1000;

interface ChannelLiveSavedSettingsSnapshot {
  alertSoundEnabled: boolean;
  alertVolume: number;
  chatDonationMessageEnabled: boolean;
  chatRuleText: string;
  chatScope: ChannelLiveChatScope;
  defaultTags: string[];
  defaultTitle: string;
  donationAlertDurationSeconds: number;
  donationAmountVisible: boolean;
  donationEnabled: boolean;
  donationMinAmount: number;
  forbiddenWords: string[];
  followerWaitSeconds: number;
  linkBlocked: boolean;
  slowModeEnabled: boolean;
  slowModeSeconds: number;
  ttsEnabled: boolean;
  ttsRate: number;
}

function areStringArraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
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

function getBroadcastActionErrorMessage(code: Parameters<typeof getAppMessage>[0]) {
  const message = getAppMessage(code);

  return message.description ?? message.title;
}

export default function ChannelLiveOperationPage({ initialSnapshot }: Props) {
  const activeBroadcast = initialSnapshot?.activeBroadcast ?? null;
  const initialSettings = initialSnapshot?.settings;
  const creatorId = initialSnapshot?.creatorId;
  const streamPath = initialSnapshot?.streamPath ?? CHANNEL_LIVE_MEDIA_CONFIG.streamPath;
  const [title, setTitle] = useState(
    activeBroadcast?.title || initialSettings?.defaultTitle || DEFAULT_TITLE,
  );
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState(
    activeBroadcast?.tags.length
      ? activeBroadcast.tags
      : initialSettings?.defaultTags.length
        ? initialSettings.defaultTags
        : DEFAULT_TAGS,
  );
  const visibility: ChannelLiveVisibility = "public";
  const [isBroadcasting, setIsBroadcasting] = useState(Boolean(activeBroadcast));
  const [hasEnded, setHasEnded] = useState(false);
  const [isChatPaused, setIsChatPaused] = useState(initialSettings?.chatPaused ?? false);
  const [broadcastId, setBroadcastId] = useState<string | null>(activeBroadcast?.id ?? null);
  const [broadcastStartedAt, setBroadcastStartedAt] = useState<string | null>(
    activeBroadcast?.startedAt ?? null,
  );
  const [broadcastActionError, setBroadcastActionError] = useState<string | null>(null);
  const [chatRuleText, setChatRuleText] = useState(initialSettings?.chatRuleText ?? "");
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState(
    isAutoLiveThumbnailUrl(activeBroadcast?.thumbnailUrl)
      ? ""
      : (activeBroadcast?.thumbnailUrl ?? ""),
  );
  const [thumbnailPreviewName, setThumbnailPreviewName] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isThumbnailRemoved, setIsThumbnailRemoved] = useState(false);
  const [chatScope, setChatScope] = useState<ChannelLiveChatScope>(
    initialSettings?.chatScope ?? "authenticated",
  );
  const [followerWaitSeconds, setFollowerWaitSeconds] = useState(
    initialSettings?.followerWaitSeconds ?? 0,
  );
  const [isSlowModeEnabled, setIsSlowModeEnabled] = useState(
    initialSettings?.slowModeEnabled ?? false,
  );
  const [slowModeSeconds, setSlowModeSeconds] = useState(initialSettings?.slowModeSeconds ?? 3);
  const [isLinkBlocked, setIsLinkBlocked] = useState(initialSettings?.linkBlocked ?? true);
  const [forbiddenWords, setForbiddenWords] = useState(initialSettings?.forbiddenWords ?? []);
  const [isDonationEnabled, setIsDonationEnabled] = useState(
    initialSettings?.donationEnabled ?? true,
  );
  const [donationMinAmount, setDonationMinAmount] = useState(
    initialSettings?.donationMinAmount ?? 1000,
  );
  const [isDonationAmountVisible, setIsDonationAmountVisible] = useState(
    initialSettings?.donationAmountVisible ?? true,
  );
  const [isChatDonationMessageEnabled, setIsChatDonationMessageEnabled] = useState(
    initialSettings?.chatDonationMessageEnabled ?? false,
  );
  const [donationAlertDurationSeconds, setDonationAlertDurationSeconds] = useState(
    initialSettings?.donationAlertDurationSeconds ?? 5,
  );
  const [isAlertSoundEnabled, setIsAlertSoundEnabled] = useState(
    initialSettings?.alertSoundEnabled ?? true,
  );
  const [alertVolume, setAlertVolume] = useState(initialSettings?.alertVolume ?? 32);
  const [isTtsEnabled, setIsTtsEnabled] = useState(initialSettings?.ttsEnabled ?? true);
  const [ttsRate, setTtsRate] = useState(initialSettings?.ttsRate ?? 1);
  const [savedSettingsSnapshot, setSavedSettingsSnapshot] =
    useState<ChannelLiveSavedSettingsSnapshot>(() => ({
      alertSoundEnabled: isAlertSoundEnabled,
      alertVolume,
      chatDonationMessageEnabled: isChatDonationMessageEnabled,
      chatRuleText,
      chatScope,
      defaultTags: [...tags],
      defaultTitle: title,
      donationAlertDurationSeconds,
      donationAmountVisible: isDonationAmountVisible,
      donationEnabled: isDonationEnabled,
      donationMinAmount,
      forbiddenWords: [...forbiddenWords],
      followerWaitSeconds,
      linkBlocked: isLinkBlocked,
      slowModeEnabled: isSlowModeEnabled,
      slowModeSeconds,
      ttsEnabled: isTtsEnabled,
      ttsRate,
    }));
  const [streamStatus, setStreamStatus] = useState<ChannelLiveStreamStatusResponse | null>(null);
  const [isBroadcastActionPending, startBroadcastTransition] = useTransition();
  const [isSettingsActionPending, startSettingsTransition] = useTransition();
  const [isChatPausePending, startChatPauseTransition] = useTransition();
  const offlineAutoEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const liveState: ChannelLiveState = {
    isBroadcasting,
    hasEnded,
    isChatPaused,
    visibility,
  };
  const isSettingsDirty = useMemo(() => {
    return (
      thumbnailFile !== null ||
      isThumbnailRemoved ||
      savedSettingsSnapshot.alertSoundEnabled !== isAlertSoundEnabled ||
      savedSettingsSnapshot.alertVolume !== alertVolume ||
      savedSettingsSnapshot.chatDonationMessageEnabled !== isChatDonationMessageEnabled ||
      savedSettingsSnapshot.chatRuleText !== chatRuleText ||
      savedSettingsSnapshot.chatScope !== chatScope ||
      !areStringArraysEqual(savedSettingsSnapshot.defaultTags, tags) ||
      savedSettingsSnapshot.defaultTitle !== title ||
      savedSettingsSnapshot.donationAlertDurationSeconds !== donationAlertDurationSeconds ||
      savedSettingsSnapshot.donationAmountVisible !== isDonationAmountVisible ||
      savedSettingsSnapshot.donationEnabled !== isDonationEnabled ||
      savedSettingsSnapshot.donationMinAmount !== donationMinAmount ||
      !areStringArraysEqual(savedSettingsSnapshot.forbiddenWords, forbiddenWords) ||
      savedSettingsSnapshot.followerWaitSeconds !== followerWaitSeconds ||
      savedSettingsSnapshot.linkBlocked !== isLinkBlocked ||
      savedSettingsSnapshot.slowModeEnabled !== isSlowModeEnabled ||
      savedSettingsSnapshot.slowModeSeconds !== slowModeSeconds ||
      savedSettingsSnapshot.ttsEnabled !== isTtsEnabled ||
      savedSettingsSnapshot.ttsRate !== ttsRate
    );
  }, [
    alertVolume,
    chatRuleText,
    chatScope,
    donationAlertDurationSeconds,
    donationMinAmount,
    forbiddenWords,
    followerWaitSeconds,
    isAlertSoundEnabled,
    isChatDonationMessageEnabled,
    isDonationAmountVisible,
    isDonationEnabled,
    isLinkBlocked,
    isSlowModeEnabled,
    isThumbnailRemoved,
    isTtsEnabled,
    savedSettingsSnapshot,
    slowModeSeconds,
    tags,
    thumbnailFile,
    title,
    ttsRate,
  ]);
  const isStreamOnline = streamStatus?.state === "online";
  const shouldAutoEndOfflineBroadcast =
    isBroadcasting && Boolean(broadcastId) && Boolean(streamStatus) && !isStreamOnline;
  const shouldCaptureAutoThumbnail = !thumbnailFile && !thumbnailPreviewUrl.trim();
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

  const handleStreamStatusChange = useCallback((nextStatus: ChannelLiveStreamStatusResponse) => {
    setStreamStatus(nextStatus);
  }, []);

  const clearOfflineAutoEndTimer = useCallback(() => {
    if (!offlineAutoEndTimerRef.current) return;

    clearTimeout(offlineAutoEndTimerRef.current);
    offlineAutoEndTimerRef.current = null;
  }, []);

  useEffect(() => {
    if (!thumbnailPreviewUrl.startsWith("blob:")) return;

    return () => {
      URL.revokeObjectURL(thumbnailPreviewUrl);
    };
  }, [thumbnailPreviewUrl]);

  const handleThumbnailFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) return;

    setThumbnailFile(file);
    setIsThumbnailRemoved(false);
    setThumbnailPreviewUrl(URL.createObjectURL(file));
    setThumbnailPreviewName(file.name);
  };

  const handleThumbnailRemove = () => {
    setThumbnailFile(null);
    setIsThumbnailRemoved(true);
    setThumbnailPreviewUrl("");
    setThumbnailPreviewName("");
  };

  const handleStartBroadcast = () => {
    setBroadcastActionError(null);
    startBroadcastTransition(async () => {
      let persistedThumbnailUrl = /^https?:\/\//.test(thumbnailPreviewUrl.trim())
        ? thumbnailPreviewUrl.trim()
        : null;

      if (thumbnailFile) {
        const uploadResult = await uploadChannelLiveThumbnailAction(thumbnailFile);

        if (!uploadResult.success || !uploadResult.data?.thumbnailUrl) {
          setBroadcastActionError(
            getBroadcastActionErrorMessage(
              APP_MESSAGE_CODE.error.channel.liveThumbnailUploadFailed,
            ),
          );
          return;
        }

        persistedThumbnailUrl = uploadResult.data.thumbnailUrl;
      }

      const result = await startLiveBroadcastAction({
        tags,
        thumbnailUrl: persistedThumbnailUrl,
        title,
      });

      if (!result.success || !result.data?.broadcastId) {
        setBroadcastActionError(
          getBroadcastActionErrorMessage(APP_MESSAGE_CODE.error.channel.liveStartSaveFailed),
        );
        return;
      }

      setBroadcastId(result.data.broadcastId);
      setBroadcastStartedAt(new Date().toISOString());
      setIsBroadcasting(true);
      setHasEnded(false);
      setThumbnailFile(null);
      setIsThumbnailRemoved(false);

      if (persistedThumbnailUrl) {
        setThumbnailPreviewUrl(persistedThumbnailUrl);
        setThumbnailPreviewName("");
      }
    });
  };

  const handleEndBroadcast = useCallback(() => {
    clearOfflineAutoEndTimer();
    setBroadcastActionError(null);
    startBroadcastTransition(async () => {
      if (broadcastId) {
        const result = await endLiveBroadcastAction({ broadcastId });

        if (!result.success) {
          setBroadcastActionError(
            getBroadcastActionErrorMessage(APP_MESSAGE_CODE.error.channel.liveEndSaveFailed),
          );
          return;
        }
      }

      setBroadcastId(null);
      setBroadcastStartedAt(null);
      setIsBroadcasting(false);
      setHasEnded(true);
    });
  }, [broadcastId, clearOfflineAutoEndTimer, startBroadcastTransition]);

  useEffect(() => {
    if (!shouldAutoEndOfflineBroadcast) {
      clearOfflineAutoEndTimer();
      return;
    }

    if (isBroadcastActionPending || offlineAutoEndTimerRef.current) {
      return;
    }

    offlineAutoEndTimerRef.current = setTimeout(() => {
      offlineAutoEndTimerRef.current = null;
      handleEndBroadcast();
    }, BROADCAST_OFFLINE_AUTO_END_TIMEOUT_MS);

    return clearOfflineAutoEndTimer;
  }, [
    clearOfflineAutoEndTimer,
    handleEndBroadcast,
    isBroadcastActionPending,
    shouldAutoEndOfflineBroadcast,
  ]);

  const handleAddTag = () => {
    const nextTag = tagInput.trim();

    if (!nextTag || tags.includes(nextTag) || tags.length >= 5) return;

    setTags((currentTags) => [...currentTags, nextTag]);
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setTags((currentTags) => currentTags.filter((currentTag) => currentTag !== tag));
  };

  const handleSaveSettings = () => {
    if (!isSettingsDirty || isSettingsActionPending) return;

    startSettingsTransition(async () => {
      const result = await updateChannelLiveSettingsAction({
        alertSoundEnabled: isAlertSoundEnabled,
        alertVolume,
        chatDonationMessageEnabled: isChatDonationMessageEnabled,
        chatRuleText,
        chatScope,
        defaultTags: tags,
        defaultTitle: title,
        donationAlertDurationSeconds,
        donationAmountVisible: isDonationAmountVisible,
        donationEnabled: isDonationEnabled,
        donationMinAmount,
        forbiddenWords,
        followerWaitSeconds,
        linkBlocked: isLinkBlocked,
        slowModeEnabled: isSlowModeEnabled,
        slowModeSeconds,
        ttsEnabled: isTtsEnabled,
        ttsRate,
      });

      if (!result.success || !result.data) {
        toastAppError(APP_MESSAGE_CODE.error.channel.liveSettingsSaveFailed);
        return;
      }

      if (broadcastId && (thumbnailFile || isThumbnailRemoved)) {
        const thumbnailResult = await saveChannelLiveThumbnailAction({
          broadcastId,
          file: thumbnailFile,
          shouldRemove: isThumbnailRemoved,
        });

        if (!thumbnailResult.success || !thumbnailResult.data) {
          toastAppError(APP_MESSAGE_CODE.error.channel.liveSettingsSaveFailed);
          return;
        }

        setThumbnailPreviewUrl(thumbnailResult.data.thumbnailUrl ?? "");
        setThumbnailPreviewName("");
        setThumbnailFile(null);
        setIsThumbnailRemoved(false);
      }

      setChatRuleText(result.data.settings.chatRuleText);
      setChatScope(result.data.settings.chatScope);
      setFollowerWaitSeconds(result.data.settings.followerWaitSeconds);
      setIsSlowModeEnabled(result.data.settings.slowModeEnabled);
      setSlowModeSeconds(result.data.settings.slowModeSeconds);
      setIsLinkBlocked(result.data.settings.linkBlocked);
      setForbiddenWords(result.data.settings.forbiddenWords);
      setIsDonationEnabled(result.data.settings.donationEnabled);
      setDonationMinAmount(result.data.settings.donationMinAmount);
      setIsDonationAmountVisible(result.data.settings.donationAmountVisible);
      setIsChatDonationMessageEnabled(result.data.settings.chatDonationMessageEnabled);
      setIsChatPaused(result.data.settings.chatPaused);
      setDonationAlertDurationSeconds(result.data.settings.donationAlertDurationSeconds);
      setIsAlertSoundEnabled(result.data.settings.alertSoundEnabled);
      setAlertVolume(result.data.settings.alertVolume);
      setIsTtsEnabled(result.data.settings.ttsEnabled);
      setTtsRate(result.data.settings.ttsRate);
      setSavedSettingsSnapshot({
        alertSoundEnabled: result.data.settings.alertSoundEnabled,
        alertVolume: result.data.settings.alertVolume,
        chatDonationMessageEnabled: result.data.settings.chatDonationMessageEnabled,
        chatRuleText: result.data.settings.chatRuleText,
        chatScope: result.data.settings.chatScope,
        defaultTags: [...result.data.settings.defaultTags],
        defaultTitle: result.data.settings.defaultTitle,
        donationAlertDurationSeconds: result.data.settings.donationAlertDurationSeconds,
        donationAmountVisible: result.data.settings.donationAmountVisible,
        donationEnabled: result.data.settings.donationEnabled,
        donationMinAmount: result.data.settings.donationMinAmount,
        forbiddenWords: [...result.data.settings.forbiddenWords],
        followerWaitSeconds: result.data.settings.followerWaitSeconds,
        linkBlocked: result.data.settings.linkBlocked,
        slowModeEnabled: result.data.settings.slowModeEnabled,
        slowModeSeconds: result.data.settings.slowModeSeconds,
        ttsEnabled: result.data.settings.ttsEnabled,
        ttsRate: result.data.settings.ttsRate,
      });
      toastAppSuccess(APP_MESSAGE_CODE.success.channel.liveSettingsSaved);
    });
  };

  const handleToggleChatPaused = () => {
    const nextChatPaused = !isChatPaused;

    setIsChatPaused(nextChatPaused);
    startChatPauseTransition(async () => {
      const result = await updateChannelLiveChatPausedAction({ chatPaused: nextChatPaused });

      if (!result.success || !result.data) {
        setIsChatPaused(!nextChatPaused);
        toastAppError(APP_MESSAGE_CODE.error.common.unknown);
        return;
      }

      setIsChatPaused(result.data.settings.chatPaused);
    });
  };

  return (
    <div className="flex flex-col gap-4 xl:h-full xl:min-h-0 xl:overflow-hidden">
      <div className="grid gap-4 xl:h-full xl:min-h-0 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)_minmax(16rem,0.85fr)] xl:overflow-hidden">
        <div className="flex min-w-0 flex-col gap-4 xl:h-full xl:max-h-full xl:min-h-0 xl:overflow-y-auto xl:pr-2 xl:pb-2">
          <div className="border-border bg-card flex shrink-0 flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
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
          <div className="shrink-0">
            <ChannelLivePreviewPanel
              isStreamOnline={isStreamOnline}
              liveState={liveState}
              streamPath={streamPath}
              title={title}
            />
          </div>
          <div className="shrink-0">
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
              thumbnailPreviewName={thumbnailPreviewName}
              thumbnailPreviewUrl={thumbnailPreviewUrl}
              title={title}
              tagInput={tagInput}
              tags={tags}
              liveState={liveState}
              onThumbnailFileChange={handleThumbnailFileChange}
              onThumbnailRemove={handleThumbnailRemove}
              onTitleChange={setTitle}
              onTagInputChange={setTagInput}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onSaveSettings={handleSaveSettings}
              onStartBroadcast={handleStartBroadcast}
              onEndBroadcast={handleEndBroadcast}
            />
          </div>
          <div className="shrink-0">
            <ChannelLiveStatusMetricsCard broadcast={statusMetricsBroadcast} />
          </div>
          <div className="shrink-0">
            <ChannelLivePollPanel broadcastId={broadcastId} creatorId={creatorId} />
          </div>
        </div>

        <div className="min-w-0 xl:h-full xl:min-h-0">
          <ChannelLiveChatPanel
            key={broadcastId ?? "channel-live-chat-idle"}
            broadcastId={broadcastId}
            creatorId={creatorId}
            chatRuleText={chatRuleText}
            liveState={liveState}
            isChatPausePending={isChatPausePending}
            onToggleChatPaused={handleToggleChatPaused}
          />
        </div>

        <div className="min-w-0 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:pr-2 xl:pb-2">
          <ChannelLiveQuickSettingsPanel
            canSaveSettings={isSettingsDirty}
            isAlertSoundEnabled={isAlertSoundEnabled}
            isChatDonationMessageEnabled={isChatDonationMessageEnabled}
            isDonationAmountVisible={isDonationAmountVisible}
            isDonationEnabled={isDonationEnabled}
            isLinkBlocked={isLinkBlocked}
            isSettingsActionPending={isSettingsActionPending}
            isSlowModeEnabled={isSlowModeEnabled}
            isTtsEnabled={isTtsEnabled}
            slowModeSeconds={slowModeSeconds}
            onAlertSoundEnabledChange={setIsAlertSoundEnabled}
            onChatDonationMessageEnabledChange={setIsChatDonationMessageEnabled}
            onDonationAmountVisibleChange={setIsDonationAmountVisible}
            onDonationEnabledChange={setIsDonationEnabled}
            onLinkBlockedChange={setIsLinkBlocked}
            onSaveSettings={handleSaveSettings}
            onSlowModeEnabledChange={setIsSlowModeEnabled}
            onSlowModeSecondsChange={setSlowModeSeconds}
            onTtsEnabledChange={setIsTtsEnabled}
          />
        </div>
      </div>
    </div>
  );
}
