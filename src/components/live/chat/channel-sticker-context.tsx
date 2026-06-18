"use client";
// 사용할 수 있는 채널 이모지(스티커) 컨텍스트. LiveView 루트에서 한 번 provide하면
// 그 아래 채팅 메시지 렌더러·입력바 피커가 prop 드릴 없이 꺼내 쓴다(memo 메시지에도 안전 — context).
//
// - groups: 본인 채널과 구독 중인 방송인의 채널 이모지를 방송인 프로필별로 묶은 목록.
// - stickers: 채팅 입력 미리보기와 메시지 렌더링에 쓰는 평탄화된 채널 이모지 목록.
// - canUseInPicker: 피커에서 채널 이모지 프로필 탭을 열 수 있는지 여부.

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useAvailableChannelEmojiStickerGroups } from "@/hooks/channel/use-channel-emoji-stickers";
import { useAuthStore } from "@/stores/auth";
import type { ChannelStickerGroup, Sticker } from "@/types/sticker/sticker";

interface ChannelStickerContextValue {
  groups: ChannelStickerGroup[];
  stickers: Sticker[];
  // 채널 이모지 최초 로딩 여부.
  isLoading: boolean;
  canUseInPicker: boolean;
}

const ChannelStickerContext = createContext<ChannelStickerContextValue>({
  groups: [],
  stickers: [],
  isLoading: false,
  canUseInPicker: false,
});

export function ChannelStickerProvider({ children }: { children: ReactNode }) {
  const authUser = useAuthStore((state) => state.user);
  const { data: groups, isLoading } = useAvailableChannelEmojiStickerGroups(authUser?.id);
  const stickers = useMemo(() => (groups ?? []).flatMap((group) => group.stickers), [groups]);
  const canUseInPicker = (groups?.length ?? 0) > 0;

  const value = useMemo<ChannelStickerContextValue>(
    () => ({
      groups: groups ?? [],
      stickers,
      isLoading,
      canUseInPicker,
    }),
    [groups, stickers, isLoading, canUseInPicker],
  );

  return <ChannelStickerContext.Provider value={value}>{children}</ChannelStickerContext.Provider>;
}

export function useChannelStickers(): ChannelStickerContextValue {
  return useContext(ChannelStickerContext);
}
