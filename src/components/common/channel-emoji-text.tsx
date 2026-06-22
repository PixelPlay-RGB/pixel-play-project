"use client";
// 채널 이모지 토큰(:pp-<UUID>:)을 포함할 수 있는 유저 작성 텍스트(커뮤니티 게시글·댓글)를 렌더한다.
// 본문에서 토큰 id를 뽑아 채널 이모지를 조회한 뒤 RichMessageText에 extraStickers로 주입해 이미지로
// 그린다. 라이브 채팅은 메시지 목록에서 한 번에 주입하므로 이 컴포넌트 대신 직접 extraStickers를 넘긴다.

import RichMessageText from "@/components/common/rich-message-text";
import { useChannelEmojiStickersByIds } from "@/hooks/channel/use-channel-emoji-stickers";
import { extractStickerTokenIds } from "@/utils/sticker/sticker-token";

interface Props {
  text: string;
  // 래퍼 태그 — 블록(게시글·댓글)은 "p", 인라인(카드 스니펫)은 "span". RichMessageText 기본은 "p".
  as?: "p" | "span" | "div";
  className?: string;
  // http(s) 링크 자동 연결 — 게시글 본문만 true.
  linkify?: boolean;
}

export default function ChannelEmojiText({ text, as, className, linkify }: Props) {
  const emojiIds = extractStickerTokenIds(text);
  const { data: stickers } = useChannelEmojiStickersByIds(emojiIds);

  return (
    <RichMessageText
      text={text}
      as={as}
      className={className}
      linkify={linkify}
      extraStickers={stickers}
    />
  );
}
