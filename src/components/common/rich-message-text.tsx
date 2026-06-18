// 유저 작성 메시지(채팅·게시글·댓글)를 렌더링한다. 평문 + http(s) 링크(linkify) + 스티커
// 토큰(:pp-<id>:)을 인라인 이미지로 치환한다. 링크 자동연결은 게시글 본문에서만 켠다(기존 동작 유지).
// 개행은 호출부 className의 whitespace-pre-wrap으로 보존된다(linkified-text 승격본).
import { Fragment, type ElementType, type ReactNode } from "react";

import StickerImage from "@/components/sticker/sticker-image";
import { STICKER_PX } from "@/constants/sticker/sticker";
import { cn } from "@/lib/utils";
import type { Sticker } from "@/types/sticker/sticker";
import { splitStickerSegments } from "@/utils/sticker/sticker-token";

// 캡처 그룹으로 split하면 URL 조각도 결과 배열에 포함된다.
const URL_SPLIT_PATTERN = /(https?:\/\/[^\s]+)/g;
const URL_TEST_PATTERN = /^https?:\/\//;

interface Props {
  text: string;
  // 래퍼 태그 — 인라인(채팅·오버레이)은 "span", 블록(게시글·댓글)은 "p". 기본 "p".
  as?: "p" | "span" | "div";
  className?: string;
  linkClassName?: string;
  // http(s) 링크 자동 연결 — 게시글 본문만 true(채팅·댓글은 기존대로 평문 유지).
  linkify?: boolean;
  // 스티커 렌더 px. 기본 인라인(STICKER_PX.inline). 오버레이는 STICKER_PX.overlay를 넘긴다.
  stickerPx?: number;
  // 기본 스티커 외에 맥락별로 해석할 추가 스티커(채널 채팅의 채널 이모지). 미지정 시 기본만.
  extraStickers?: Sticker[];
}

function renderNodes(
  text: string,
  linkify: boolean,
  stickerPx: number,
  linkClassName: string | undefined,
  extraStickers: Sticker[] | undefined,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let key = 0;

  for (const segment of splitStickerSegments(text, extraStickers)) {
    if (segment.type === "sticker") {
      nodes.push(<StickerImage key={key++} sticker={segment.sticker} px={stickerPx} />);
      continue;
    }

    if (!linkify) {
      nodes.push(<Fragment key={key++}>{segment.value}</Fragment>);
      continue;
    }

    for (const part of segment.value.split(URL_SPLIT_PATTERN)) {
      if (!part) continue;
      if (URL_TEST_PATTERN.test(part)) {
        nodes.push(
          <a
            key={key++}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className={cn("text-brand break-all hover:underline", linkClassName)}
          >
            {part}
          </a>,
        );
      } else {
        nodes.push(<Fragment key={key++}>{part}</Fragment>);
      }
    }
  }

  return nodes;
}

export default function RichMessageText({
  text,
  as,
  className,
  linkClassName,
  linkify = false,
  stickerPx = STICKER_PX.inline,
  extraStickers,
}: Props) {
  const Tag = (as ?? "p") as ElementType;
  return (
    <Tag className={className}>
      {renderNodes(text, linkify, stickerPx, linkClassName, extraStickers)}
    </Tag>
  );
}
