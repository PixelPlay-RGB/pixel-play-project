"use client";
// 채널 이모지를 클라이언트에서 조회해 채팅 피커와 렌더러용 데이터로 돌려준다.
// channel_emoji는 읽기 공개(RLS using true)라 RPC 없이 테이블을 바로 SELECT한다.

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/common/query-keys";
import { createClient } from "@/lib/supabase/client";
import type { ChannelStickerGroup, Sticker } from "@/types/sticker/sticker";
import { getChannelEmojiSrc } from "@/utils/channel/channel-emoji";
import { createChannelStickerGroups } from "@/utils/sticker/channel-sticker-groups";

interface ChannelEmojiStickerRow {
  id: string;
  image_path: string;
  name: string;
}

interface ChannelEmojiStickerWithCreatorRow extends ChannelEmojiStickerRow {
  creator_id: string;
}

function toSticker(row: ChannelEmojiStickerRow): Sticker {
  return {
    id: row.id,
    label: row.name,
    src: getChannelEmojiSrc(row.image_path),
    isAnimated: false,
  };
}

async function fetchChannelEmojiStickers(creatorId: string): Promise<Sticker[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("channel_emoji")
    .select("id, image_path, name, sort_order")
    .eq("creator_id", creatorId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("채널 이모지 조회 실패", error);
    throw error;
  }

  return (data ?? []).map(toSticker);
}

async function fetchAvailableChannelEmojiStickerGroups(
  userId: string,
): Promise<ChannelStickerGroup[]> {
  const supabase = createClient();
  const { data: subscriptionRows, error: subscriptionError } = await supabase
    .from("creator_subscription")
    .select("creator_id")
    .eq("subscriber_id", userId)
    .in("status", ["active", "canceled"])
    .gt("end_at", new Date().toISOString());

  if (subscriptionError) {
    console.error("구독 채널 이모지 권한 조회 실패", subscriptionError);
    throw subscriptionError;
  }

  const creatorIds = [
    ...new Set([userId, ...(subscriptionRows ?? []).map((row) => row.creator_id)]),
  ];

  const { data: emojiRows, error: emojiError } = await supabase
    .from("channel_emoji")
    .select("id, image_path, name, sort_order, creator_id")
    .in("creator_id", creatorIds)
    .order("creator_id", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (emojiError) {
    console.error("구독 채널 이모지 조회 실패", emojiError);
    throw emojiError;
  }

  const emojiCreatorIds = [
    ...new Set((emojiRows ?? []).map((row: ChannelEmojiStickerWithCreatorRow) => row.creator_id)),
  ];

  if (emojiCreatorIds.length === 0) {
    return [];
  }

  const { data: profileRows, error: profileError } = await supabase
    .from("user")
    .select("id, nickname, photo_url")
    .in("id", emojiCreatorIds);

  if (profileError) {
    console.error("구독 채널 프로필 조회 실패", profileError);
    throw profileError;
  }

  return createChannelStickerGroups({
    creatorIds,
    profiles: (profileRows ?? []).map((row) => ({
      id: row.id,
      nickname: row.nickname,
      photoUrl: row.photo_url,
    })),
    stickers: (emojiRows ?? []).map((row: ChannelEmojiStickerWithCreatorRow) => ({
      creatorId: row.creator_id,
      sticker: toSticker(row),
    })),
  });
}

async function fetchChannelEmojiStickersByIds(emojiIds: readonly string[]): Promise<Sticker[]> {
  const uniqueEmojiIds = [...new Set(emojiIds)];

  if (uniqueEmojiIds.length === 0) {
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("channel_emoji")
    .select("id, image_path, name, sort_order")
    .in("id", uniqueEmojiIds);

  if (error) {
    console.error("채널 이모지 토큰 렌더 조회 실패", error);
    throw error;
  }

  return (data ?? []).map(toSticker);
}

// creatorId가 없으면 비활성(공개 페이지 등). 5분 캐싱 — 등록/수정은 설정 페이지에서만 일어난다.
export function useChannelEmojiStickers(creatorId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.channel.emojis(creatorId),
    queryFn: () => fetchChannelEmojiStickers(creatorId as string),
    enabled: Boolean(creatorId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAvailableChannelEmojiStickerGroups(userId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.channel.subscribedEmojis(userId),
    queryFn: () => fetchAvailableChannelEmojiStickerGroups(userId as string),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useChannelEmojiStickersByIds(emojiIds: readonly string[]) {
  const normalizedEmojiIds = [...new Set(emojiIds)].sort();

  return useQuery({
    queryKey: QUERY_KEYS.channel.emojiByIds(normalizedEmojiIds),
    queryFn: () => fetchChannelEmojiStickersByIds(normalizedEmojiIds),
    enabled: normalizedEmojiIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}
