// 스티커 토큰(:pp-<id>:) 문자열 연산. 삽입·단독 판정·평문 변환을 한 곳에 모은다.
import {
  DEFAULT_STICKERS,
  STICKER_TOKEN_GLOBAL_PATTERN,
  STICKER_TOKEN_PREFIX,
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

// 글자수 제한을 넘기지 않을 때만 토큰을 덧붙인다(토큰이 중간에 잘려 깨지는 것 방지).
export function appendStickerToken(text: string, token: string, maxLength: number): string {
  const next = text + token;
  return next.length <= maxLength ? next : text;
}

// 본문이 "등록 스티커 토큰만"으로 이뤄졌는지(공백 제외). 채팅에서 단독 큰 렌더 판정에 쓴다.
export function isStickerOnly(text: string): boolean {
  let stickerCount = 0;
  const remainder = text.replace(STICKER_TOKEN_GLOBAL_PATTERN, (match) => {
    if (resolveTokenMatch(match)) {
      stickerCount += 1;
      return "";
    }
    return match; // 미등록 토큰은 평문으로 남겨 판정에 포함한다.
  });
  return stickerCount > 0 && remainder.trim().length === 0;
}

// 이미지로 못 띄우는 평문 맥락(목록 스니펫·알림)에서 토큰을 라벨로 치환한다. 미등록 토큰은 그대로 둔다.
export function stickerTokensToText(text: string): string {
  return text.replace(
    STICKER_TOKEN_GLOBAL_PATTERN,
    (match) => resolveTokenMatch(match)?.label ?? match,
  );
}
