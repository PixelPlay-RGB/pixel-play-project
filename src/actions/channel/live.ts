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
  chatRuleText: string;
  defaultTags: string[];
  defaultTitle: string;
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

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function toChannelLiveStudioSnapshot(value: Json): ChannelLiveStudioSnapshot {
  if (!isRecord(value)) {
    return {
      activeBroadcast: null,
      settings: {
        chatRuleText: "",
        defaultTags: [],
        defaultTitle: "",
      },
    };
  }

  const activeBroadcast = value.activeBroadcast;
  const settings = value.settings;

  if (!isRecord(activeBroadcast)) {
    return {
      activeBroadcast: null,
      settings: isRecord(settings)
        ? {
            chatRuleText: readString(settings.chatRuleText),
            defaultTags: readStringArray(settings.defaultTags),
            defaultTitle: readString(settings.defaultTitle),
          }
        : {
            chatRuleText: "",
            defaultTags: [],
            defaultTitle: "",
          },
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
    settings: isRecord(settings)
      ? {
          chatRuleText: readString(settings.chatRuleText),
          defaultTags: readStringArray(settings.defaultTags),
          defaultTitle: readString(settings.defaultTitle),
        }
      : {
          chatRuleText: "",
          defaultTags: [],
          defaultTitle: "",
        },
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
    p_chat_rule_text: parsed.data.chatRuleText,
    p_default_tags: parsed.data.defaultTags,
    p_default_title: parsed.data.defaultTitle,
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
