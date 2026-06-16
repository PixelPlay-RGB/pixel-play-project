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
  canUseInPicker: boolean;
}

const ChannelStickerContext = createContext<ChannelStickerContextValue>({
  stickers: [],
  canUseInPicker: false,
});

export function ChannelStickerProvider({
  creatorId,
  children,
}: {
  // 운영 콘솔 등 creatorId가 아직 없을 수 있는 표면도 안전하게 감싸도록 undefined 허용.
  creatorId: string | undefined;
  children: ReactNode;
}) {
  const { data: stickers } = useChannelEmojiStickers(creatorId);
  const { data: user } = useNullableUser();

  const value = useMemo<ChannelStickerContextValue>(
    () => ({
      stickers: stickers ?? [],
      // 지금은 크리에이터 본인만 채널 이모지를 보낼 수 있다(구독자 허용은 구독 연동 시 추가).
      canUseInPicker: Boolean(creatorId) && Boolean(user) && user?.id === creatorId,
    }),
    [stickers, user, creatorId],
  );

  return <ChannelStickerContext.Provider value={value}>{children}</ChannelStickerContext.Provider>;
}

export function useChannelStickers(): ChannelStickerContextValue {
  return useContext(ChannelStickerContext);
}
