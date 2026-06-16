"use server";
// 방송 운영 페이지에서 사용하는 라이브 방송 RPC Server Action입니다.

import { randomUUID } from "crypto";
import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import { getChannelLiveStreamPath } from "@/constants/channel/channel-live-media";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import {
  createChannelLivePollSchema,
  endChannelLivePollSchema,
  getChannelLiveDrawParticipantsSchema,
  sendChannelLiveInteractionNoticeSchema,
  sendChannelLiveRouletteNoticeSchema,
  type CreateChannelLivePollInput,
  type EndChannelLivePollInput,
  type GetChannelLiveDrawParticipantsInput,
  type SendChannelLiveInteractionNoticeInput,
  type SendChannelLiveRouletteNoticeInput,
  startLiveBroadcastSchema,
  type StartLiveBroadcastInput,
  updateChannelLiveSettingsSchema,
  type UpdateChannelLiveSettingsInput,
} from "@/lib/zod/channel-live";
import type { AppActionResult } from "@/types/common/action";
import type { Database, Json } from "@/types/database.types";
import {
  isManualLiveThumbnailFileName,
  LIVE_THUMBNAIL_DIRECTORY,
} from "@/utils/channel/channel-live-thumbnail";
import { buildLiveStreamKey } from "@/utils/live/live-security";
import {
  createServerStampedLiveRouletteSsePayload,
  liveRouletteSseStore,
} from "@/utils/live/live-roulette-sse";
import { revalidatePath } from "next/cache";

interface EndLiveBroadcastInput {
  broadcastId: string;
}

interface SaveLiveThumbnailInput {
  broadcastId: string | null;
  file?: File | null;
  shouldRemove: boolean;
}

interface ChannelLiveDrawParticipationRow {
  created_at: string;
  metadata: Json;
  sender: { nickname: string | null } | null;
  sender_id: string | null;
}

const LIVE_THUMBNAIL_BUCKET = "user-media";
const LIVE_THUMBNAIL_MAX_BYTES = 5 * 1024 * 1024;
const LIVE_DRAW_PARTICIPATION_SOURCE = "live_draw_participation";
const LIVE_THUMBNAIL_EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const CHANNEL_LIVE_DRAW_PARTICIPANT_PAGE_SIZE = 1000;
const ACTIVE_LIVE_BROADCAST_NOT_FOUND_CODE = "PX404";
const ACTIVE_LIVE_BROADCAST_NOT_FOUND_MESSAGE = "active live broadcast not found";

type UpsertCreatorStudioSettingArgs =
  Database["public"]["Functions"]["upsert_creator_studio_setting"]["Args"];

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
  creatorId: string;
  recentDonations: ChannelLiveRecentDonation[];
  settings: ChannelLiveStudioSettings;
  streamPath: string;
}

export interface ChannelLiveRecentDonation {
  amount: number;
  broadcastId: string | null;
  createdAt: string;
  donorNickname: string;
  id: string;
}

export interface ChannelLiveChatMessage {
  authorName: string;
  content: string;
  createdAt: string;
  id: string;
  isCreator: boolean;
}

export interface ChannelLiveDrawParticipant {
  firstMessageAt: string;
  isFollower: boolean;
  nickname: string;
  userId: string;
}

export interface ChannelLiveStudioSettings {
  alertSoundEnabled: boolean;
  alertSoundKey: string;
  alertVolume: number;
  chatDonationMessageEnabled: boolean;
  chatRuleText: string;
  chatRuleVersion: number;
  chatScope: "authenticated" | "follower" | "manager";
  donationAlertDurationSeconds: number;
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
  ttsVoiceUri: string;
  ttsVolume: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isActiveLiveBroadcastNotFoundError(error: unknown) {
  if (!isRecord(error)) return false;

  return (
    error.code === ACTIVE_LIVE_BROADCAST_NOT_FOUND_CODE &&
    error.message === ACTIVE_LIVE_BROADCAST_NOT_FOUND_MESSAGE
  );
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

function readRecordArray(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
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

function toJsonMetadata(value: Record<string, unknown> | undefined): Json {
  return value ? (JSON.parse(JSON.stringify(value)) as Json) : {};
}

function getLiveThumbnailExtension(file: File) {
  return LIVE_THUMBNAIL_EXTENSION_BY_TYPE[file.type] ?? null;
}

function isValidLiveThumbnailFile(file: File | null | undefined) {
  return Boolean(
    file &&
    file.size > 0 &&
    file.size <= LIVE_THUMBNAIL_MAX_BYTES &&
    getLiveThumbnailExtension(file),
  );
}

function getLiveThumbnailDirectoryPath(userId: string) {
  return `${userId}/${LIVE_THUMBNAIL_DIRECTORY}`;
}

function getLiveThumbnailFilePath(userId: string, extension: string) {
  return `${getLiveThumbnailDirectoryPath(userId)}/thumbnail.${extension}`;
}

function appendCacheBuster(url: string) {
  return `${url}?t=${Date.now()}`;
}

async function removeLiveThumbnailFiles(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
) {
  const directoryPath = getLiveThumbnailDirectoryPath(userId);
  const { data: files, error: listError } = await supabase.storage
    .from(LIVE_THUMBNAIL_BUCKET)
    .list(directoryPath);

  if (listError) {
    console.error("방송 미리보기 이미지 목록 조회 실패", listError);
    return false;
  }

  const filePaths = (files ?? [])
    .filter((file) => file.name && isManualLiveThumbnailFileName(file.name))
    .map((file) => `${directoryPath}/${file.name}`);

  if (filePaths.length === 0) {
    return true;
  }

  const { error: removeError } = await supabase.storage
    .from(LIVE_THUMBNAIL_BUCKET)
    .remove(filePaths);

  if (removeError) {
    console.error("방송 미리보기 이미지 삭제 실패", removeError);
    return false;
  }

  return true;
}

async function uploadLiveThumbnailFile(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  file: File,
) {
  if (!isValidLiveThumbnailFile(file)) {
    return null;
  }

  const extension = getLiveThumbnailExtension(file);

  if (!extension) {
    return null;
  }

  const filePath = getLiveThumbnailFilePath(userId, extension);
  const { error: uploadError } = await supabase.storage
    .from(LIVE_THUMBNAIL_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("방송 미리보기 이미지 업로드 실패", uploadError);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(LIVE_THUMBNAIL_BUCKET).getPublicUrl(filePath);

  return publicUrl ? appendCacheBuster(publicUrl) : null;
}

function createDefaultSettings(): ChannelLiveStudioSettings {
  return {
    alertSoundEnabled: true,
    alertSoundKey: "classic",
    alertVolume: 32,
    chatDonationMessageEnabled: false,
    chatOverlayVersion: 1,
    chatRuleText: "",
    chatRuleVersion: 1,
    chatScope: "authenticated",
    defaultTags: [],
    defaultTitle: "",
    donationAlertDurationSeconds: 5,
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
    ttsVoiceUri: "",
    ttsVolume: 80,
  };
}

function createSettingsFromRecord(settings: unknown): ChannelLiveStudioSettings {
  if (!isRecord(settings)) return createDefaultSettings();

  return {
    alertSoundEnabled: readBoolean(settings.alertSoundEnabled, true),
    alertSoundKey: readString(settings.alertSoundKey) || "classic",
    alertVolume: readNumberWithFallback(settings.alertVolume, 32),
    chatDonationMessageEnabled: readBoolean(settings.chatDonationMessageEnabled, false),
    chatOverlayVersion: readNumberWithFallback(settings.chatOverlayVersion, 1),
    chatRuleText: readString(settings.chatRuleText),
    chatRuleVersion: readNumberWithFallback(settings.chatRuleVersion, 1),
    chatScope: readChatScope(settings.chatScope),
    defaultTags: readStringArray(settings.defaultTags),
    defaultTitle: readString(settings.defaultTitle),
    donationAlertDurationSeconds: readNumberWithFallback(settings.donationAlertDurationSeconds, 5),
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
    ttsVoiceUri: readString(settings.ttsVoiceUri),
    ttsVolume: readNumberWithFallback(settings.ttsVolume, 80),
  };
}

function createChannelLiveStreamPath(creatorId: string, settings: ChannelLiveStudioSettings) {
  return getChannelLiveStreamPath(buildLiveStreamKey(creatorId, settings.streamKeyVersion));
}

function createRecentDonationFromRecord(
  value: Record<string, unknown>,
): ChannelLiveRecentDonation | null {
  const id = readString(value.id);
  const amount = readNumber(value.amount);
  const createdAt = readString(value.createdAt);

  if (!id || !createdAt || amount <= 0) {
    return null;
  }

  return {
    amount,
    broadcastId: typeof value.broadcastId === "string" ? value.broadcastId : null,
    createdAt,
    donorNickname: readString(value.donorNickname) || "익명",
    id,
  };
}

function createRecentDonations(value: unknown) {
  return readRecordArray(value).flatMap((item) => {
    const donation = createRecentDonationFromRecord(item);

    return donation ? [donation] : [];
  });
}

function toChannelLiveStudioSnapshot(value: Json, creatorId: string): ChannelLiveStudioSnapshot {
  if (!isRecord(value)) {
    const settings = createDefaultSettings();

    return {
      activeBroadcast: null,
      creatorId,
      recentDonations: [],
      settings,
      streamPath: createChannelLiveStreamPath(creatorId, settings),
    };
  }

  const activeBroadcast = value.activeBroadcast;
  const settings = createSettingsFromRecord(value.settings);
  const recentDonations = createRecentDonations(value.recentDonations);

  if (!isRecord(activeBroadcast)) {
    return {
      activeBroadcast: null,
      creatorId,
      recentDonations,
      settings,
      streamPath: createChannelLiveStreamPath(creatorId, settings),
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
    creatorId,
    recentDonations,
    settings,
    streamPath: createChannelLiveStreamPath(creatorId, settings),
  };
}

async function getChannelLiveDrawParticipantsByPeriod({
  broadcastId,
  creatorId,
  endedAt,
  startedAt,
  supabase,
}: {
  broadcastId: string;
  creatorId: string;
  endedAt: string;
  startedAt: string;
  supabase: ReturnType<typeof createAdminClient>;
}) {
  const participantBaseByUserId = new Map<string, Omit<ChannelLiveDrawParticipant, "isFollower">>();
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("live_message")
      .select("created_at, metadata, sender_id")
      .eq("broadcast_id", broadcastId)
      .eq("message_type", "chat")
      .gte("created_at", startedAt)
      .lte("created_at", endedAt)
      .not("sender_id", "is", null)
      .order("created_at", { ascending: true })
      .range(offset, offset + CHANNEL_LIVE_DRAW_PARTICIPANT_PAGE_SIZE - 1);

    if (error) {
      console.error("방송 추첨 참여자 채팅 조회 실패", error);
      return null;
    }

    (data ?? []).forEach((message) => {
      if (!message.sender_id || participantBaseByUserId.has(message.sender_id)) {
        return;
      }

      const metadata = readJsonObject(message.metadata);

      participantBaseByUserId.set(message.sender_id, {
        firstMessageAt: message.created_at,
        nickname: readMetadataString(metadata.senderNickname) ?? "시청자",
        userId: message.sender_id,
      });
    });

    if (!data || data.length < CHANNEL_LIVE_DRAW_PARTICIPANT_PAGE_SIZE) {
      break;
    }

    offset += CHANNEL_LIVE_DRAW_PARTICIPANT_PAGE_SIZE;
  }

  const participantUserIds = Array.from(participantBaseByUserId.keys());
  const followerUserIdSet = new Set<string>();

  if (participantUserIds.length > 0) {
    const { data: relations, error: relationError } = await supabase
      .from("viewer_creator_relation")
      .select("viewer_id")
      .eq("creator_id", creatorId)
      .in("viewer_id", participantUserIds)
      .not("followed_at", "is", null);

    if (relationError) {
      console.error("방송 추첨 팔로우 관계 조회 실패", relationError);
      return null;
    }

    (relations ?? []).forEach((relation) => {
      followerUserIdSet.add(relation.viewer_id);
    });
  }

  return Array.from(participantBaseByUserId.values()).map<ChannelLiveDrawParticipant>(
    (participant) => ({
      ...participant,
      isFollower: followerUserIdSet.has(participant.userId),
    }),
  );
}

async function getChannelLiveDrawParticipantsByNotice({
  broadcastId,
  creatorId,
  drawNoticeId,
  supabase,
}: {
  broadcastId: string;
  creatorId: string;
  drawNoticeId: string;
  supabase: ReturnType<typeof createAdminClient>;
}) {
  const participantBaseByUserId = new Map<string, Omit<ChannelLiveDrawParticipant, "isFollower">>();
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("live_message")
      .select("created_at, metadata, sender_id, sender:sender_id(nickname)")
      .eq("broadcast_id", broadcastId)
      .eq("message_type", "moderation_notice")
      .contains("metadata", {
        drawNoticeId,
        source: LIVE_DRAW_PARTICIPATION_SOURCE,
      })
      .not("sender_id", "is", null)
      .order("created_at", { ascending: true })
      .range(offset, offset + CHANNEL_LIVE_DRAW_PARTICIPANT_PAGE_SIZE - 1)
      .returns<ChannelLiveDrawParticipationRow[]>();

    if (error) {
      console.error("방송 추첨 UI 참여자 조회 실패", error);
      return null;
    }

    (data ?? []).forEach((message) => {
      if (!message.sender_id || participantBaseByUserId.has(message.sender_id)) {
        return;
      }

      const metadata = readJsonObject(message.metadata);

      participantBaseByUserId.set(message.sender_id, {
        firstMessageAt: message.created_at,
        nickname:
          message.sender?.nickname ?? readMetadataString(metadata.senderNickname) ?? "시청자",
        userId: message.sender_id,
      });
    });

    if (!data || data.length < CHANNEL_LIVE_DRAW_PARTICIPANT_PAGE_SIZE) {
      break;
    }

    offset += CHANNEL_LIVE_DRAW_PARTICIPANT_PAGE_SIZE;
  }

  const participantUserIds = Array.from(participantBaseByUserId.keys());
  const followerUserIdSet = new Set<string>();

  if (participantUserIds.length > 0) {
    const { data: relations, error: relationError } = await supabase
      .from("viewer_creator_relation")
      .select("viewer_id")
      .eq("creator_id", creatorId)
      .in("viewer_id", participantUserIds)
      .not("followed_at", "is", null);

    if (relationError) {
      console.error("방송 추첨 UI 참여자 팔로우 관계 조회 실패", relationError);
      return null;
    }

    (relations ?? []).forEach((relation) => {
      followerUserIdSet.add(relation.viewer_id);
    });
  }

  return Array.from(participantBaseByUserId.values()).map<ChannelLiveDrawParticipant>(
    (participant) => ({
      ...participant,
      isFollower: followerUserIdSet.has(participant.userId),
    }),
  );
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
    data: toChannelLiveStudioSnapshot(data, actor.userId),
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
  const upsertParams = {
    p_actor_user_id: actor.userId,
    p_alert_sound_enabled: parsed.data.alertSoundEnabled,
    p_alert_volume: parsed.data.alertVolume,
    p_chat_donation_message_enabled: parsed.data.chatDonationMessageEnabled,
    p_chat_rule_text: parsed.data.chatRuleText,
    p_chat_scope: parsed.data.chatScope,
    p_default_tags: parsed.data.defaultTags,
    p_default_title: parsed.data.defaultTitle,
    p_donation_alert_duration_seconds: parsed.data.donationAlertDurationSeconds,
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
  } satisfies UpsertCreatorStudioSettingArgs;

  const { data, error } = await supabase.rpc("upsert_creator_studio_setting", upsertParams);

  if (error || !data) {
    console.error("방송 설정 저장 RPC 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  revalidatePath("/channel/live");

  return {
    success: true,
    data: toChannelLiveStudioSnapshot(data, actor.userId),
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
  const actor = await getAuthenticatedActorId({
    logLabel: "방송 미리보기 이미지 업로드 중 인증 사용자 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const isValidFile = isValidLiveThumbnailFile(file);

  if (!isValidFile) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const didRemoveExistingFiles = await removeLiveThumbnailFiles(supabase, actor.userId);

  if (!didRemoveExistingFiles) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const thumbnailUrl = await uploadLiveThumbnailFile(supabase, actor.userId, file);

  if (!thumbnailUrl) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  return {
    success: true,
    data: { thumbnailUrl },
  };
}

export async function saveChannelLiveThumbnailAction({
  broadcastId,
  file,
  shouldRemove,
}: SaveLiveThumbnailInput): Promise<AppActionResult<{ thumbnailUrl: string | null }>> {
  if (!broadcastId) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "방송 미리보기 이미지 저장 중 인증 사용자 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  let thumbnailUrl: string | null = null;

  if (file && !isValidLiveThumbnailFile(file)) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  if (shouldRemove || file) {
    const didRemoveExistingFiles = await removeLiveThumbnailFiles(supabase, actor.userId);

    if (!didRemoveExistingFiles) {
      return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
    }
  }

  if (!shouldRemove && file) {
    thumbnailUrl = await uploadLiveThumbnailFile(supabase, actor.userId, file);

    if (!thumbnailUrl) {
      return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
    }
  }

  const { data, error } = await supabase
    .from("live_broadcast")
    .update({ thumbnail_url: thumbnailUrl })
    .eq("id", broadcastId)
    .eq("creator_id", actor.userId)
    .is("ended_at", null)
    .select("thumbnail_url")
    .maybeSingle();

  if (error || !data) {
    console.error("방송 미리보기 이미지 DB 저장 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  revalidatePath("/channel/live");

  return {
    success: true,
    data: { thumbnailUrl: data.thumbnail_url },
  };
}

export async function createChannelLivePollAction(
  input: CreateChannelLivePollInput,
): Promise<AppActionResult<{ pollId: string }>> {
  const parsed = createChannelLivePollSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "방송 투표 생성 중 인증 사용자 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const pollOptions: Json = parsed.data.options.map((option) => ({
    count: 0,
    id: randomUUID(),
    label: option.trim(),
  }));
  const supabase = createAdminClient();
  const { data: pollId, error } = await supabase.rpc("create_live_poll", {
    p_actor_user_id: actor.userId,
    p_broadcast_id: parsed.data.broadcastId,
    p_ends_at: parsed.data.endsAt ?? undefined,
    p_options: pollOptions,
    p_title: parsed.data.title.trim(),
  });

  if (error || !pollId) {
    console.error("방송 투표 생성 RPC 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  return {
    success: true,
    data: { pollId },
  };
}

export async function endChannelLivePollAction(
  input: EndChannelLivePollInput,
): Promise<AppActionResult> {
  const parsed = endChannelLivePollSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "방송 투표 종료 중 인증 사용자 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("end_live_poll", {
    p_actor_user_id: actor.userId,
    p_poll_id: parsed.data.pollId,
  });

  if (error) {
    console.error("방송 투표 종료 RPC 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  return { success: true };
}

export async function sendChannelLiveInteractionNoticeAction(
  input: SendChannelLiveInteractionNoticeInput,
): Promise<AppActionResult<{ messageId: string }>> {
  const parsed = sendChannelLiveInteractionNoticeSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "라이브 상호작용 결과 공지 중 인증 사용자 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const { data: messageId, error } = await supabase.rpc("send_live_interaction_notice", {
    p_actor_user_id: actor.userId,
    p_broadcast_id: parsed.data.broadcastId,
    p_content: parsed.data.content.trim(),
    p_interaction_type: parsed.data.interactionType,
    p_metadata: toJsonMetadata(parsed.data.metadata),
  });

  if (error || !messageId) {
    console.error("라이브 상호작용 결과 공지 RPC 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  return {
    success: true,
    data: { messageId },
  };
}

export async function sendChannelLiveRouletteNoticeAction(
  input: SendChannelLiveRouletteNoticeInput,
): Promise<AppActionResult> {
  const parsed = sendChannelLiveRouletteNoticeSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "방송 룰렛 SSE 공지 전송 중 인증 사용자 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const { data: broadcast, error } = await supabase
    .from("live_broadcast")
    .select("id")
    .eq("id", parsed.data.broadcastId)
    .eq("creator_id", actor.userId)
    .is("ended_at", null)
    .maybeSingle();

  if (error || !broadcast) {
    console.error("방송 룰렛 SSE 공지 대상 방송 조회 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  liveRouletteSseStore.publish(
    parsed.data.broadcastId,
    createServerStampedLiveRouletteSsePayload(parsed.data.payload),
  );

  return { success: true };
}

export async function getChannelLiveDrawParticipantsAction(
  input: GetChannelLiveDrawParticipantsInput,
): Promise<AppActionResult<{ participants: ChannelLiveDrawParticipant[] }>> {
  const parsed = getChannelLiveDrawParticipantsSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "방송 추첨 참여자 조회 중 인증 사용자 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const { data: broadcast, error: broadcastError } = await supabase
    .from("live_broadcast")
    .select("id")
    .eq("id", parsed.data.broadcastId)
    .eq("creator_id", actor.userId)
    .maybeSingle();

  if (broadcastError || !broadcast) {
    console.error("방송 추첨 대상 방송 조회 실패", broadcastError);
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const participants = parsed.data.drawNoticeId
    ? await getChannelLiveDrawParticipantsByNotice({
        broadcastId: parsed.data.broadcastId,
        creatorId: actor.userId,
        drawNoticeId: parsed.data.drawNoticeId,
        supabase,
      })
    : await getChannelLiveDrawParticipantsByPeriod({
        broadcastId: parsed.data.broadcastId,
        creatorId: actor.userId,
        endedAt: parsed.data.endedAt,
        startedAt: parsed.data.startedAt,
        supabase,
      });

  if (!participants) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  return {
    success: true,
    data: { participants },
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
    if (isActiveLiveBroadcastNotFoundError(error)) {
      revalidatePath("/channel/live");

      return { success: true };
    }

    console.error("방송 종료 RPC 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  revalidatePath("/channel/live");

  return { success: true };
}
