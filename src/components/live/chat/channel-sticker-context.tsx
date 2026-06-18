"use client";
// 구독한 방송인의 채널 이모지(스티커) 컨텍스트. LiveView 루트에서 한 번 provide하면
// 그 아래 채팅 메시지 렌더러·입력바 피커가 prop 드릴 없이 꺼내 쓴다(memo 메시지에도 안전 — context).
//
// - stickers: 로그인 사용자가 활성 구독 중인 방송인의 채널 이모지
// - canUseInPicker: 피커에서 구독 이모지 탭을 열 수 있는지 여부.

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useSubscribedChannelEmojiStickers } from "@/hooks/channel/use-channel-emoji-stickers";
import { useAuthStore } from "@/stores/auth";
import type { Sticker } from "@/types/sticker/sticker";

interface ChannelStickerContextValue {
  stickers: Sticker[];
  // 채널 이모지 최초 로딩 여부 — 피커 채널 탭 로딩 인디케이터에 쓴다.
  isLoading: boolean;
  canUseInPicker: boolean;
  // 피커 채널 탭 아이콘(아바타)·라벨용 채널 표시 정보(채널 주인 프로필에서 채운다).
  channelName: string | null;
  channelAvatarUrl: string | null;
}

const ChannelStickerContext = createContext<ChannelStickerContextValue>({
  stickers: [],
  isLoading: false,
  canUseInPicker: false,
  channelName: null,
  channelAvatarUrl: null,
});

const SUBSCRIBED_CHANNEL_STICKER_LABEL = "구독 이모지";

export function ChannelStickerProvider({ children }: { children: ReactNode }) {
  const authUser = useAuthStore((state) => state.user);
  const { data: stickers, isLoading } = useSubscribedChannelEmojiStickers(authUser?.id);
  const canUseInPicker = (stickers?.length ?? 0) > 0;

  const value = useMemo<ChannelStickerContextValue>(
    () => ({
      stickers: stickers ?? [],
      isLoading,
      canUseInPicker,
      channelName: canUseInPicker ? SUBSCRIBED_CHANNEL_STICKER_LABEL : null,
      channelAvatarUrl: null,
    }),
    [stickers, isLoading, canUseInPicker],
  );

  return <ChannelStickerContext.Provider value={value}>{children}</ChannelStickerContext.Provider>;
}

export function useChannelStickers(): ChannelStickerContextValue {
  return useContext(ChannelStickerContext);
}
