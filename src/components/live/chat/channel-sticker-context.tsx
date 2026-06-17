"use client";
// 채널 채팅에서 쓰는 채널 이모지(스티커) 컨텍스트. LiveView 루트에서 한 번 provide하면
// 그 아래 채팅 메시지 렌더러·입력바 피커가 prop 드릴 없이 꺼내 쓴다(memo 메시지에도 안전 — context).
//
// - stickers: 렌더링용(누가 보냈든 모두가 채널 이모지를 이미지로 본다)
// - canUseInPicker: 피커에서 보내기 가능 여부. 지금은 크리에이터 본인만(구독자 게이팅은 구독 연동 시).

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useChannelEmojiStickers } from "@/hooks/channel/use-channel-emoji-stickers";
import { useChannelProfile } from "@/hooks/channel/use-channel-profile";
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

export function ChannelStickerProvider({
  creatorId,
  children,
}: {
  // 운영 콘솔 등 creatorId가 아직 없을 수 있는 표면도 안전하게 감싸도록 undefined 허용.
  creatorId: string | undefined;
  children: ReactNode;
}) {
  const { data: stickers, isLoading } = useChannelEmojiStickers(creatorId);
  const authUser = useAuthStore((state) => state.user);
  // 지금은 크리에이터 본인만 채널 이모지를 보낼 수 있다(구독자 허용은 구독 연동 시 canUseInPicker에 구독 체크 추가).
  const canUseInPicker = Boolean(creatorId) && authUser?.id === creatorId;
  // 채널 탭 표시정보 = 채널 주인(creatorId) 프로필. 본인이든 (향후) 구독자든 채널 이름이 맞다.
  // 채널 탭이 뜰 때(canUseInPicker)만 조회해 비로그인·일반 시청자의 불필요한 쿼리를 막는다.
  const { data: channelProfile } = useChannelProfile(creatorId, canUseInPicker);

  const value = useMemo<ChannelStickerContextValue>(
    () => ({
      stickers: stickers ?? [],
      isLoading,
      canUseInPicker,
      channelName: channelProfile?.name ?? null,
      channelAvatarUrl: channelProfile?.avatarUrl ?? null,
    }),
    [stickers, isLoading, canUseInPicker, channelProfile],
  );

  return <ChannelStickerContext.Provider value={value}>{children}</ChannelStickerContext.Provider>;
}

export function useChannelStickers(): ChannelStickerContextValue {
  return useContext(ChannelStickerContext);
}
