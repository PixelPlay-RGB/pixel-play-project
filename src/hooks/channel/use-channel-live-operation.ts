"use client";
// 방송 운영 화면의 방송 제어·설정 저장·스트림 상태를 관리합니다.

import { useCallback, useMemo, useRef, useState, useTransition } from "react";

import {
  endLiveBroadcastAction,
  saveChannelLiveThumbnailAction,
  startLiveBroadcastAction,
  type ChannelLiveStudioSnapshot,
  updateChannelLiveSettingsAction,
  uploadChannelLiveThumbnailAction,
} from "@/actions/channel/live";
import type {
  ChannelLiveChatScope,
  ChannelLiveState,
  ChannelLiveVisibility,
} from "@/components/channel/live/channel-live-operation-page";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { useChannelLiveThumbnail } from "@/hooks/channel/use-channel-live-thumbnail";
import type { ChannelLiveStreamStatusResponse } from "@/types/channel/channel-live-stream";
import { getAppMessage } from "@/utils/common/app-message";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

const DEFAULT_TITLE = "";
const DEFAULT_TAGS: string[] = [];
const STREAM_OFFLINE_AUTO_END_GRACE_MS = 15000;

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

function getBroadcastActionErrorMessage(code: Parameters<typeof getAppMessage>[0]) {
  const message = getAppMessage(code);

  return message.description ?? message.title;
}

export function useChannelLiveOperation(initialSnapshot?: ChannelLiveStudioSnapshot) {
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
  const [broadcastId, setBroadcastId] = useState<string | null>(activeBroadcast?.id ?? null);
  const [donationFeedBroadcastId, setDonationFeedBroadcastId] = useState<string | null>(
    activeBroadcast?.id ?? null,
  );
  const [broadcastStartedAt, setBroadcastStartedAt] = useState<string | null>(
    activeBroadcast?.startedAt ?? null,
  );
  const [broadcastActionError, setBroadcastActionError] = useState<string | null>(null);
  const [chatRuleText, setChatRuleText] = useState(initialSettings?.chatRuleText ?? "");
  const thumbnail = useChannelLiveThumbnail(activeBroadcast?.thumbnailUrl);
  const {
    isThumbnailRemoved,
    setIsThumbnailRemoved,
    setThumbnailFile,
    setThumbnailPreviewName,
    setThumbnailPreviewUrl,
    thumbnailFile,
    thumbnailPreviewUrl,
  } = thumbnail;
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
  const hasSeenOnlineStreamRef = useRef(Boolean(activeBroadcast));
  const streamOfflineSinceRef = useRef<number | null>(null);
  const isAutoEndPendingRef = useRef(false);

  const liveState: ChannelLiveState = {
    isBroadcasting,
    hasEnded,
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

  const completeBroadcastEnd = useCallback(() => {
    setBroadcastId(null);
    setBroadcastStartedAt(null);
    setIsBroadcasting(false);
    setHasEnded(true);
    streamOfflineSinceRef.current = null;
    isAutoEndPendingRef.current = false;
  }, []);

  const endBroadcast = useCallback(async () => {
    if (broadcastId) {
      const result = await endLiveBroadcastAction({ broadcastId });

      if (!result.success) {
        isAutoEndPendingRef.current = false;
        setBroadcastActionError(
          getBroadcastActionErrorMessage(APP_MESSAGE_CODE.error.channel.liveEndSaveFailed),
        );
        return;
      }
    }

    completeBroadcastEnd();
  }, [broadcastId, completeBroadcastEnd]);

  const handleStreamStatusChange = useCallback(
    (nextStatus: ChannelLiveStreamStatusResponse) => {
      setStreamStatus(nextStatus);

      if (nextStatus.state === "online") {
        hasSeenOnlineStreamRef.current = true;
        streamOfflineSinceRef.current = null;
        return;
      }

      if (
        !broadcastId ||
        !isBroadcasting ||
        !hasSeenOnlineStreamRef.current ||
        nextStatus.state !== "offline"
      ) {
        streamOfflineSinceRef.current = null;
        return;
      }

      const checkedAt = new Date(nextStatus.checkedAt).getTime();
      const now = Number.isFinite(checkedAt) ? checkedAt : Date.now();
      const offlineSince = streamOfflineSinceRef.current ?? now;
      streamOfflineSinceRef.current = offlineSince;

      if (now - offlineSince < STREAM_OFFLINE_AUTO_END_GRACE_MS || isAutoEndPendingRef.current) {
        return;
      }

      isAutoEndPendingRef.current = true;
      setBroadcastActionError(null);
      startBroadcastTransition(async () => {
        await endBroadcast();
      });
    },
    [broadcastId, endBroadcast, isBroadcasting, startBroadcastTransition],
  );

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
      setDonationFeedBroadcastId(result.data.broadcastId);
      setBroadcastStartedAt(new Date().toISOString());
      setIsBroadcasting(true);
      setHasEnded(false);
      hasSeenOnlineStreamRef.current = isStreamOnline;
      streamOfflineSinceRef.current = null;
      isAutoEndPendingRef.current = false;
      setThumbnailFile(null);
      setIsThumbnailRemoved(false);

      if (persistedThumbnailUrl) {
        setThumbnailPreviewUrl(persistedThumbnailUrl);
        setThumbnailPreviewName("");
      }
    });
  };

  const handleEndBroadcast = useCallback(() => {
    setBroadcastActionError(null);
    startBroadcastTransition(async () => {
      await endBroadcast();
    });
  }, [endBroadcast, startBroadcastTransition]);

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

  return {
    activeBroadcast,
    alertVolume,
    broadcastActionError,
    broadcastId,
    broadcastStartedAt,
    chatRuleText,
    chatScope,
    donationFeedBroadcastId,
    setChatScope,
    handleAddTag,
    handleEndBroadcast,
    handleRemoveTag,
    handleSaveSettings,
    handleStartBroadcast,
    handleStreamStatusChange,
    isAlertSoundEnabled,
    isBroadcastActionPending,
    isChatDonationMessageEnabled,
    isDonationAmountVisible,
    isDonationEnabled,
    isLinkBlocked,
    isSettingsActionPending,
    isSettingsDirty,
    isSlowModeEnabled,
    isStreamOnline,
    isTtsEnabled,
    liveState,
    setIsAlertSoundEnabled,
    setIsChatDonationMessageEnabled,
    setIsDonationAmountVisible,
    setIsDonationEnabled,
    setIsLinkBlocked,
    setIsSlowModeEnabled,
    setSlowModeSeconds,
    setIsTtsEnabled,
    setTagInput,
    setTitle,
    slowModeSeconds,
    tagInput,
    tags,
    thumbnail,
    title,
  };
}
