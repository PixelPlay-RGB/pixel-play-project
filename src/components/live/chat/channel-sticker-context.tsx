"use client";
// 채널 채팅에서 쓰는 채널 이모지(스티커) 컨텍스트. LiveView 루트에서 한 번 provide하면
// 그 아래 채팅 메시지 렌더러·입력바 피커가 prop 드릴 없이 꺼내 쓴다(memo 메시지에도 안전 — context).
//
// - stickers: 렌더링용(누가 보냈든 모두가 채널 이모지를 이미지로 본다)
// - canUseInPicker: 피커에서 보내기 가능 여부. 지금은 크리에이터 본인만(구독자 게이팅은 구독 연동 시).

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useChannelEmojiStickers } from "@/hooks/channel/use-channel-emoji-stickers";
import { useNullableUser } from "@/hooks/profile/use-profile";
import type { Sticker } from "@/types/sticker/sticker";

interface ChannelStickerContextValue {
  stickers: Sticker[];
  // 채널 이모지 최초 로딩 여부 — 피커 채널 탭 로딩 인디케이터에 쓴다.
  isLoading: boolean;
  canUseInPicker: boolean;
  // 피커 채널 탭 아이콘(아바타)·라벨용 채널 표시 정보(크리에이터 본인 프로필에서 채운다).
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
  // 본인 프로필 — 채널 탭은 본인(크리에이터)만 뜨므로, 본인 프로필이 곧 채널 탭 표시 정보다.
  // (user 테이블은 authenticated 읽기라 비로그인은 못 읽지만, 그 경우 채널 탭 자체가 안 뜬다.)
  const { data: profile } = useNullableUser();

  const value = useMemo<ChannelStickerContextValue>(() => {
    // 지금은 크리에이터 본인만 채널 이모지를 보낼 수 있다(구독자 허용은 구독 연동 시 추가).
    const canUseInPicker = Boolean(creatorId) && profile?.id === creatorId;
    return {
      stickers: stickers ?? [],
      isLoading,
      canUseInPicker,
      // 채널 탭 아바타·라벨 = 본인 프로필(닉네임·사진). 표면별 prop 전달 없이 모든 채팅 표면에서 동작한다.
      channelName: canUseInPicker ? (profile?.nickname ?? null) : null,
      channelAvatarUrl: canUseInPicker ? (profile?.photo_url ?? null) : null,
    };
  }, [stickers, isLoading, profile, creatorId]);

  return <ChannelStickerContext.Provider value={value}>{children}</ChannelStickerContext.Provider>;
}

export function useChannelStickers(): ChannelStickerContextValue {
  return useContext(ChannelStickerContext);
}
