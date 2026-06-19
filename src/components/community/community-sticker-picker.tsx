"use client";
// 커뮤니티 글·댓글 작성기의 스티커 피커 — 라이브 채팅과 동일하게 본인·구독 채널 이모지를 노출한다.
// ChannelStickerProvider는 authUser 기반이라 creatorId가 필요 없고, 작성기마다 감싸도
// useAvailableChannelEmojiStickerGroups(React Query)가 같은 캐시를 공유해 중복 조회가 없다.

import {
  ChannelStickerProvider,
  useChannelStickers,
} from "@/components/live/chat/channel-sticker-context";
import StickerPicker from "@/components/sticker/sticker-picker";

interface Props {
  onStickerSelect: (token: string) => void;
  disabled?: boolean;
}

function CommunityStickerPickerInner({ onStickerSelect, disabled }: Props) {
  const { groups, canUseInPicker } = useChannelStickers();

  return (
    <StickerPicker
      onStickerSelect={onStickerSelect}
      disabled={disabled}
      side="bottom"
      channelGroups={canUseInPicker ? groups : undefined}
    />
  );
}

export default function CommunityStickerPicker(props: Props) {
  return (
    <ChannelStickerProvider>
      <CommunityStickerPickerInner {...props} />
    </ChannelStickerProvider>
  );
}
