// 스티커 토큰(:pp-<id>:) 문자열 연산. 삽입·세그먼트 분할·평문 변환을 한 곳에 모은다.
import {
  DEFAULT_STICKERS,
  STICKER_TOKEN_EXACT_PATTERN,
  STICKER_TOKEN_GLOBAL_PATTERN,
  STICKER_TOKEN_PREFIX,
  STICKER_TOKEN_SPLIT_PATTERN,
} from "@/constants/sticker/sticker";
import type { Sticker } from "@/types/sticker/sticker";

const STICKER_BY_ID = new Map<string, Sticker>(
  DEFAULT_STICKERS.map((sticker) => [sticker.id, sticker]),
);

export function getStickerById(id: string): Sticker | undefined {
  return STICKER_BY_ID.get(id);
}

// 피커 삽입용 토큰 문자열 :pp-<id>: 생성.
export function buildStickerToken(id: string): string {
  return `${STICKER_TOKEN_PREFIX}${id}:`;
}

// 토큰 매치 문자열(:pp-xxx:)에서 등록 스티커를 찾는다. 미등록이면 undefined(평문 취급).
function resolveTokenMatch(match: string): Sticker | undefined {
  // STICKER_TOKEN_PREFIX(":pp-") 이후 ~ 끝의 ":" 직전이 id.
  const id = match.slice(STICKER_TOKEN_PREFIX.length, -1);
  return getStickerById(id);
}

export type StickerSegment =
  | { type: "text"; value: string }
  | { type: "sticker"; sticker: Sticker };

// 본문을 텍스트/스티커 세그먼트로 쪼갠다(렌더러·리치 입력기 공용). 미등록 토큰은 text로 남긴다.
export function splitStickerSegments(text: string): StickerSegment[] {
  const segments: StickerSegment[] = [];
  for (const chunk of text.split(STICKER_TOKEN_SPLIT_PATTERN)) {
    if (!chunk) continue;
    const matched = STICKER_TOKEN_EXACT_PATTERN.exec(chunk);
    const sticker = matched ? getStickerById(matched[1]) : undefined;
    if (sticker) segments.push({ type: "sticker", sticker });
    else segments.push({ type: "text", value: chunk });
  }
  return segments;
}

// 글자수 제한을 넘기지 않을 때만 토큰을 덧붙인다(토큰이 중간에 잘려 깨지는 것 방지).
export function appendStickerToken(text: string, token: string, maxLength: number): string {
  const next = text + token;
  return next.length <= maxLength ? next : text;
}

// 이미지로 못 띄우는 평문 맥락(목록 스니펫·알림)에서 토큰을 라벨로 치환한다. 미등록 토큰은 그대로 둔다.
export function stickerTokensToText(text: string): string {
  return text.replace(
    STICKER_TOKEN_GLOBAL_PATTERN,
    (match) => resolveTokenMatch(match)?.label ?? match,
  );
}
