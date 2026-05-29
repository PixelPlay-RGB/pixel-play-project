"use server";
// 방송 운영 페이지에서 사용하는 라이브 방송 RPC Server Action입니다.

import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import {
  startLiveBroadcastSchema,
  type StartLiveBroadcastInput,
  updateChannelLiveSettingsSchema,
  type UpdateChannelLiveSettingsInput,
} from "@/lib/zod/channel-live";
import type { AppActionResult } from "@/types/common/action";
import type { Json } from "@/types/database.types";
import { revalidatePath } from "next/cache";

interface EndLiveBroadcastInput {
  broadcastId: string;
}

export interface ChannelLiveActiveBroadcast {
  id: string;
  title: string;
  tags: string[];
  thumbnailUrl: string | null;
  startedAt: string;
  currentViewerCount: number;
  peakViewerCount: number;
  chatMessageCount: number;
  donationCount: number;
  donationAmountTotal: number;
}

export interface ChannelLiveStudioSnapshot {
  activeBroadcast: ChannelLiveActiveBroadcast | null;
  settings: ChannelLiveStudioSettings;
}

export interface ChannelLiveStudioSettings {
  alertSoundEnabled: boolean;
  alertVolume: number;
  chatRuleText: string;
  chatRuleVersion: number;
  chatScope: "authenticated" | "follower" | "manager";
  donationAlertDurationSeconds: number;
  donationAlertEnabled: boolean;
  donationAlertVersion: number;
  donationAmountVisible: boolean;
  donationEnabled: boolean;
  donationMinAmount: number;
  forbiddenWords: string[];
  defaultTags: string[];
  defaultTitle: string;
  followerWaitSeconds: number;
  linkBlocked: boolean;
  slowModeEnabled: boolean;
  slowModeSeconds: number;
  streamKeyVersion: number;
  chatOverlayVersion: number;
  ttsEnabled: boolean;
  ttsRate: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readNumber(value: unknown) {
  return typeof value === "number" ? value : 0;
}

function readBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function readNumberWithFallback(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readChatScope(value: unknown): ChannelLiveStudioSettings["chatScope"] {
  if (value === "follower" || value === "manager") return value;

  return "authenticated";
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function createDefaultSettings(): ChannelLiveStudioSettings {
  return {
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
}

function createSettingsFromRecord(settings: unknown): ChannelLiveStudioSettings {
  if (!isRecord(settings)) return createDefaultSettings();

  return {
    alertSoundEnabled: readBoolean(settings.alertSoundEnabled, true),
    alertVolume: readNumberWithFallback(settings.alertVolume, 32),
    chatOverlayVersion: readNumberWithFallback(settings.chatOverlayVersion, 1),
    chatRuleText: readString(settings.chatRuleText),
    chatRuleVersion: readNumberWithFallback(settings.chatRuleVersion, 1),
    chatScope: readChatScope(settings.chatScope),
    defaultTags: readStringArray(settings.defaultTags),
    defaultTitle: readString(settings.defaultTitle),
    donationAlertDurationSeconds: readNumberWithFallback(settings.donationAlertDurationSeconds, 5),
    donationAlertEnabled: readBoolean(settings.donationAlertEnabled, true),
    donationAlertVersion: readNumberWithFallback(settings.donationAlertVersion, 1),
    donationAmountVisible: readBoolean(settings.donationAmountVisible, true),
    donationEnabled: readBoolean(settings.donationEnabled, true),
    donationMinAmount: readNumberWithFallback(settings.donationMinAmount, 1000),
    forbiddenWords: readStringArray(settings.forbiddenWords),
    followerWaitSeconds: readNumberWithFallback(settings.followerWaitSeconds, 0),
    linkBlocked: readBoolean(settings.linkBlocked, true),
    slowModeEnabled: readBoolean(settings.slowModeEnabled),
    slowModeSeconds: readNumberWithFallback(settings.slowModeSeconds, 3),
    streamKeyVersion: readNumberWithFallback(settings.streamKeyVersion, 1),
    ttsEnabled: readBoolean(settings.ttsEnabled, true),
    ttsRate: readNumberWithFallback(settings.ttsRate, 1),
  };
}

function toChannelLiveStudioSnapshot(value: Json): ChannelLiveStudioSnapshot {
  if (!isRecord(value)) {
    return {
      activeBroadcast: null,
      settings: createDefaultSettings(),
    };
  }

  const activeBroadcast = value.activeBroadcast;
  const settings = value.settings;

  if (!isRecord(activeBroadcast)) {
    return {
      activeBroadcast: null,
      settings: createSettingsFromRecord(settings),
    };
  }

  return {
    activeBroadcast: {
      chatMessageCount: readNumber(activeBroadcast.chatMessageCount),
      currentViewerCount: readNumber(activeBroadcast.currentViewerCount),
      donationAmountTotal: readNumber(activeBroadcast.donationAmountTotal),
      donationCount: readNumber(activeBroadcast.donationCount),
      id: readString(activeBroadcast.id),
      peakViewerCount: readNumber(activeBroadcast.peakViewerCount),
      startedAt: readString(activeBroadcast.startedAt),
      tags: readStringArray(activeBroadcast.tags),
      thumbnailUrl:
        typeof activeBroadcast.thumbnailUrl === "string" ? activeBroadcast.thumbnailUrl : null,
      title: readString(activeBroadcast.title),
    },
    settings: createSettingsFromRecord(settings),
  };
}

export async function getChannelLiveStudioSnapshotAction(): Promise<
  AppActionResult<ChannelLiveStudioSnapshot>
> {
  const actor = await getAuthenticatedActorId({
    logLabel: "방송 운영 snapshot 조회 중 인증 사용자 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_creator_studio_snapshot", {
    p_actor_user_id: actor.userId,
  });

  if (error || !data) {
    console.error("방송 운영 snapshot RPC 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  return {
    success: true,
    data: toChannelLiveStudioSnapshot(data),
  };
}

export async function updateChannelLiveSettingsAction(
  input: UpdateChannelLiveSettingsInput,
): Promise<AppActionResult<ChannelLiveStudioSnapshot>> {
  const parsed = updateChannelLiveSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "방송 설정 저장 중 인증 사용자 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("upsert_creator_studio_setting", {
    p_actor_user_id: actor.userId,
    p_alert_sound_enabled: parsed.data.alertSoundEnabled,
    p_alert_volume: parsed.data.alertVolume,
    p_chat_rule_text: parsed.data.chatRuleText,
    p_chat_scope: parsed.data.chatScope,
    p_default_tags: parsed.data.defaultTags,
    p_default_title: parsed.data.defaultTitle,
    p_donation_alert_duration_seconds: parsed.data.donationAlertDurationSeconds,
    p_donation_alert_enabled: parsed.data.donationAlertEnabled,
    p_donation_amount_visible: parsed.data.donationAmountVisible,
    p_donation_enabled: parsed.data.donationEnabled,
    p_donation_min_amount: parsed.data.donationMinAmount,
    p_forbidden_words: parsed.data.forbiddenWords,
    p_follower_wait_seconds: parsed.data.followerWaitSeconds,
    p_link_blocked: parsed.data.linkBlocked,
    p_slow_mode_enabled: parsed.data.slowModeEnabled,
    p_slow_mode_seconds: parsed.data.slowModeSeconds,
    p_tts_enabled: parsed.data.ttsEnabled,
    p_tts_rate: parsed.data.ttsRate,
  });

  if (error || !data) {
    console.error("방송 설정 저장 RPC 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  revalidatePath("/channel/live");

  return {
    success: true,
    data: toChannelLiveStudioSnapshot(data),
  };
}

export async function startLiveBroadcastAction(
  input: StartLiveBroadcastInput,
): Promise<AppActionResult<{ broadcastId: string }>> {
  const parsed = startLiveBroadcastSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "방송 시작 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const { data: broadcastId, error } = await supabase.rpc("start_live_broadcast", {
    p_actor_user_id: actor.userId,
    p_tags: parsed.data.tags,
    p_thumbnail_url: parsed.data.thumbnailUrl ?? null,
    p_title: parsed.data.title,
  });

  if (error || !broadcastId) {
    console.error("방송 시작 RPC 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  revalidatePath("/channel/live");

  return {
    success: true,
    data: { broadcastId },
  };
}

export async function endLiveBroadcastAction({
  broadcastId,
}: EndLiveBroadcastInput): Promise<AppActionResult> {
  if (!broadcastId) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "방송 종료 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return actor.result;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("end_live_broadcast", {
    p_actor_user_id: actor.userId,
    p_broadcast_id: broadcastId,
  });

  if (error) {
    console.error("방송 종료 RPC 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  revalidatePath("/channel/live");

  return { success: true };
}
