// 채널 스튜디오 설정 화면에서 공통으로 쓰는 기본값과 포맷 유틸입니다.

import type { ChannelLiveStudioSettings } from "@/actions/channel/live";
import type { UpdateChannelLiveSettingsInput } from "@/lib/zod/channel-live";

export const CHANNEL_STUDIO_SETTINGS_FALLBACK: ChannelLiveStudioSettings = {
  alertSoundEnabled: true,
  alertVolume: 32,
  chatOverlayVersion: 1,
  chatRuleText: "",
  chatRuleVersion: 1,
  chatScope: "authenticated",
  defaultTags: [],
  defaultTitle: "",
  donationAlertDurationSeconds: 5,
  donationAlertEnabled: true,
  donationAlertVersion: 1,
  donationAmountVisible: true,
  donationEnabled: true,
  donationMinAmount: 1000,
  forbiddenWords: [],
  followerWaitSeconds: 0,
  linkBlocked: true,
  slowModeEnabled: false,
  slowModeSeconds: 3,
  streamKeyVersion: 1,
  ttsEnabled: true,
  ttsRate: 1,
};

export const FOLLOWER_WAIT_OPTIONS = [
  { label: "바로", value: 0 },
  { label: "5분", value: 300 },
  { label: "10분", value: 600 },
  { label: "30분", value: 1800 },
  { label: "1시간", value: 3600 },
  { label: "1일", value: 86400 },
  { label: "7일", value: 604800 },
];

export const SLOW_MODE_OPTIONS = [3, 5, 10, 30, 60, 120, 300];
export const DONATION_ALERT_DURATION_OPTIONS = [3, 5, 10, 15, 30];
export const TTS_RATE_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function createStudioSettingsInput(
  settings: ChannelLiveStudioSettings,
  overrides: Partial<UpdateChannelLiveSettingsInput>,
): UpdateChannelLiveSettingsInput {
  return {
    alertSoundEnabled: settings.alertSoundEnabled,
    alertVolume: settings.alertVolume,
    chatRuleText: settings.chatRuleText,
    chatScope: settings.chatScope,
    defaultTags: settings.defaultTags,
    defaultTitle: settings.defaultTitle,
    donationAlertDurationSeconds: settings.donationAlertDurationSeconds,
    donationAlertEnabled: settings.donationAlertEnabled,
    donationAmountVisible: settings.donationAmountVisible,
    donationEnabled: settings.donationEnabled,
    donationMinAmount: settings.donationMinAmount,
    forbiddenWords: settings.forbiddenWords,
    followerWaitSeconds: settings.followerWaitSeconds,
    linkBlocked: settings.linkBlocked,
    slowModeEnabled: settings.slowModeEnabled,
    slowModeSeconds: settings.slowModeSeconds,
    ttsEnabled: settings.ttsEnabled,
    ttsRate: settings.ttsRate,
    ...overrides,
  };
}

export function formatSecondsLabel(seconds: number) {
  if (seconds < 60) return `${seconds}초`;
  if (seconds < 3600) return `${seconds / 60}분`;
  if (seconds < 86400) return `${seconds / 3600}시간`;

  return `${seconds / 86400}일`;
}

export function formatWon(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}
