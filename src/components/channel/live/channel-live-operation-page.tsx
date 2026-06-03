"use client";
// 방송 운영 UI의 설정, 상태, 채팅 패널을 조합합니다.

import {
  endLiveBroadcastAction,
  saveChannelLiveThumbnailAction,
  startLiveBroadcastAction,
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
import { CHANNEL_LIVE_MEDIA_CONFIG } from "@/constants/channel/channel-live-media";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { cn } from "@/lib/utils";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";
import { BadgeCheck } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

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

function getBroadcastStatusLabel(liveState: ChannelLiveState) {
  if (liveState.isBroadcasting) return "방송 중";
  if (liveState.hasEnded) return "방송 종료";

  return "방송 준비";
}

function getBroadcastStatusClassName(liveState: ChannelLiveState) {
  if (liveState.isBroadcasting) {
    return "bg-destructive/10 text-destructive";
  }

  if (liveState.hasEnded) {
    return "bg-muted text-muted-foreground";
  }

  return "bg-warning/10 text-warning";
}

export default function ChannelLiveOperationPage({ initialSnapshot }: Props) {
  const activeBroadcast = initialSnapshot?.activeBroadcast ?? null;
  const initialSettings = initialSnapshot?.settings;
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
  const [isChatPaused, setIsChatPaused] = useState(false);
  const [broadcastId, setBroadcastId] = useState<string | null>(activeBroadcast?.id ?? null);
  const [broadcastStartedAt, setBroadcastStartedAt] = useState<string | null>(
    activeBroadcast?.startedAt ?? null,
  );
  const [broadcastActionError, setBroadcastActionError] = useState<string | null>(null);
  const [chatRuleText, setChatRuleText] = useState(initialSettings?.chatRuleText ?? "");
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState(
    activeBroadcast?.thumbnailUrl ?? "",
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
  const [isDonationAlertEnabled, setIsDonationAlertEnabled] = useState(
    initialSettings?.donationAlertEnabled ?? true,
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
  const [liveChatMessages, setLiveChatMessages] = useState(initialSnapshot?.chatMessages ?? []);
  const [isBroadcastActionPending, startBroadcastTransition] = useTransition();
  const [isSettingsActionPending, startSettingsTransition] = useTransition();

  const liveState: ChannelLiveState = {
    isBroadcasting,
    hasEnded,
    isChatPaused,
    visibility,
  };

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
          setBroadcastActionError("미리보기 이미지를 업로드하지 못했습니다.");
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
        setBroadcastActionError("방송 시작 정보를 저장하지 못했습니다.");
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

  const handleEndBroadcast = () => {
    setBroadcastActionError(null);
    startBroadcastTransition(async () => {
      if (broadcastId) {
        const result = await endLiveBroadcastAction({ broadcastId });

        if (!result.success) {
          setBroadcastActionError("방송 종료 정보를 저장하지 못했습니다.");
          return;
        }
      }

      setBroadcastId(null);
      setBroadcastStartedAt(null);
      setIsBroadcasting(false);
      setHasEnded(true);
    });
  };

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
    startSettingsTransition(async () => {
      const result = await updateChannelLiveSettingsAction({
        alertSoundEnabled: isAlertSoundEnabled,
        alertVolume,
        chatRuleText,
        chatScope,
        defaultTags: tags,
        defaultTitle: title,
        donationAlertDurationSeconds,
        donationAlertEnabled: isDonationAlertEnabled,
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
      setIsDonationAlertEnabled(result.data.settings.donationAlertEnabled);
      setDonationAlertDurationSeconds(result.data.settings.donationAlertDurationSeconds);
      setIsAlertSoundEnabled(result.data.settings.alertSoundEnabled);
      setAlertVolume(result.data.settings.alertVolume);
      setIsTtsEnabled(result.data.settings.ttsEnabled);
      setTtsRate(result.data.settings.ttsRate);
      toastAppSuccess(APP_MESSAGE_CODE.success.channel.liveSettingsSaved);
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
                  getBroadcastStatusClassName(liveState),
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
                        : liveState.hasEnded
                          ? "bg-muted-foreground"
                          : "bg-warning",
                    )}
                  />
                </span>
                {getBroadcastStatusLabel(liveState)}
              </span>
              <span className="text-foreground text-sm font-semibold">
                {isBroadcasting ? "송출 중" : "송출 대기"}
              </span>
            </div>
            <span className="bg-brand/10 text-brand inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold">
              <BadgeCheck className="size-3.5" />
              {visibility === "public"
                ? "공개 예정"
                : visibility === "private"
                  ? "비공개"
                  : "일부 공개"}
            </span>
          </div>
          <div className="shrink-0">
            <ChannelLivePreviewPanel liveState={liveState} title={title} />
          </div>
          <div className="shrink-0">
            <ChannelLiveSettingsPanel
              broadcastActionError={broadcastActionError}
              isBroadcastActionPending={isBroadcastActionPending}
              isSettingsActionPending={isSettingsActionPending}
              secondaryPanel={
                <ChannelLiveStreamStatusPanel
                  activeBroadcastStartedAt={broadcastStartedAt}
                  liveState={liveState}
                  streamPath={CHANNEL_LIVE_MEDIA_CONFIG.streamPath}
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
            <ChannelLivePollPanel messages={liveChatMessages} />
          </div>
        </div>

        <div className="min-w-0 xl:h-full xl:min-h-0">
          <ChannelLiveChatPanel
            key={broadcastId ?? "channel-live-chat-idle"}
            broadcastId={broadcastId}
            initialMessages={initialSnapshot?.chatMessages ?? []}
            liveState={liveState}
            onMessagesChange={setLiveChatMessages}
            onToggleChatPaused={() => setIsChatPaused((currentValue) => !currentValue)}
          />
        </div>

        <div className="min-w-0 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:pr-2 xl:pb-2">
          <ChannelLiveQuickSettingsPanel
            isAlertSoundEnabled={isAlertSoundEnabled}
            isDonationAlertEnabled={isDonationAlertEnabled}
            isDonationAmountVisible={isDonationAmountVisible}
            isDonationEnabled={isDonationEnabled}
            isLinkBlocked={isLinkBlocked}
            isSlowModeEnabled={isSlowModeEnabled}
            isTtsEnabled={isTtsEnabled}
            onAlertSoundEnabledChange={setIsAlertSoundEnabled}
            onDonationAlertEnabledChange={setIsDonationAlertEnabled}
            onDonationAmountVisibleChange={setIsDonationAmountVisible}
            onDonationEnabledChange={setIsDonationEnabled}
            onLinkBlockedChange={setIsLinkBlocked}
            onSlowModeEnabledChange={setIsSlowModeEnabled}
            onTtsEnabledChange={setIsTtsEnabled}
          />
        </div>
      </div>
    </div>
  );
}
