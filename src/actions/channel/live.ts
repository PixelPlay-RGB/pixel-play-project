"use server";
// 방송 운영 페이지에서 사용하는 라이브 방송 RPC Server Action입니다.

import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
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

const LIVE_THUMBNAIL_BUCKET = "live-thumbnails";
const LIVE_THUMBNAIL_MAX_BYTES = 5 * 1024 * 1024;
const LIVE_THUMBNAIL_EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const CHANNEL_LIVE_CHAT_MESSAGE_LIMIT = 50;

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
  chatMessages: ChannelLiveChatMessage[];
  settings: ChannelLiveStudioSettings;
}

export interface ChannelLiveChatMessage {
  authorName: string;
  content: string;
  createdAt: string;
  id: string;
  isCreator: boolean;
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

function readJsonObject(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : {};
}

function readMetadataString(value: Json | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : "";

  return trimmed.length > 0 ? trimmed : null;
}

function getLiveThumbnailExtension(file: File) {
  return LIVE_THUMBNAIL_EXTENSION_BY_TYPE[file.type] ?? null;
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
      chatMessages: [],
      settings: createDefaultSettings(),
    };
  }

  const activeBroadcast = value.activeBroadcast;
  const settings = value.settings;

  if (!isRecord(activeBroadcast)) {
    return {
      activeBroadcast: null,
      chatMessages: [],
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
    chatMessages: [],
    settings: createSettingsFromRecord(settings),
  };
}

function toChannelLiveChatMessage(
  message: {
    content: string;
    created_at: string;
    id: string;
    metadata: Json;
    sender_id: string | null;
  },
  creatorId: string,
): ChannelLiveChatMessage {
  const metadata = readJsonObject(message.metadata);

  return {
    authorName: readMetadataString(metadata.senderNickname) ?? "시청자",
    content: message.content,
    createdAt: message.created_at,
    id: message.id,
    isCreator: message.sender_id === creatorId,
  };
}

async function getChannelLiveChatMessagesByBroadcastId(
  supabase: ReturnType<typeof createAdminClient>,
  broadcastId: string,
  creatorId: string,
) {
  const { data, error } = await supabase
    .from("live_message")
    .select("content, created_at, id, metadata, sender_id")
    .eq("broadcast_id", broadcastId)
    .eq("message_type", "chat")
    .order("created_at", { ascending: false })
    .limit(CHANNEL_LIVE_CHAT_MESSAGE_LIMIT);

  if (error) {
    console.error("방송 운영 채팅 메시지 조회 실패", error);
    return [];
  }

  return [...(data ?? [])].reverse().map((message) => toChannelLiveChatMessage(message, creatorId));
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

  const snapshot = toChannelLiveStudioSnapshot(data);

  if (snapshot.activeBroadcast) {
    snapshot.chatMessages = await getChannelLiveChatMessagesByBroadcastId(
      supabase,
      snapshot.activeBroadcast.id,
      actor.userId,
    );
  }

  return {
    success: true,
    data: snapshot,
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
    p_thumbnail_url: parsed.data.thumbnailUrl ?? undefined,
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

export async function uploadChannelLiveThumbnailAction(
  file: File,
): Promise<AppActionResult<{ thumbnailUrl: string }>> {
  if (!file || file.size === 0 || file.size > LIVE_THUMBNAIL_MAX_BYTES) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const extension = getLiveThumbnailExtension(file);

  if (!extension) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "諛⑹넚 誘몃━蹂닿린 ?대?吏 ?낅줈??以??몄쬆 ?좎? 議고쉶 ?ㅽ뙣",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = await createClient();
  const filePath = `${actor.userId}/${Date.now()}-${globalThis.crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from(LIVE_THUMBNAIL_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("諛⑹넚 誘몃━蹂닿린 ?대?吏 Storage ?낅줈???ㅽ뙣", uploadError);
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(LIVE_THUMBNAIL_BUCKET).getPublicUrl(filePath);

  if (!publicUrl) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  return {
    success: true,
    data: { thumbnailUrl: publicUrl },
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
