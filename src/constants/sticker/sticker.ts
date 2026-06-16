// 기본 스티커(이모지) 레지스트리와 토큰·렌더 상수를 정의합니다.
// 기본 스티커는 "고정값" — DB/스토리지가 아니라 정적 public 에셋(/stickers/<id>.png)으로 둔다.
import type { Sticker } from "@/types/sticker/sticker";

// 정적 에셋 베이스 경로(public 기준 절대 경로).
export const STICKER_BASE_PATH = "/stickers";

// 본문에 삽입되는 스티커 토큰: :pp-<id>: (예: :pp-hi-rgb:). 등록된 id만 이미지로 치환되고,
// 그 외 :...: 모양은 평문으로 남는다(오인식 방지). 평문 길이로 세어 글자수 제한에도 포함된다.
export const STICKER_TOKEN_PREFIX = ":pp-";
// split(캡처)·replace용 전역 패턴 / 단일 토큰 정확 검사용 패턴.
export const STICKER_TOKEN_SPLIT_PATTERN = /(:pp-[a-z0-9-]+:)/g;
export const STICKER_TOKEN_GLOBAL_PATTERN = /:pp-[a-z0-9-]+:/g;
export const STICKER_TOKEN_EXACT_PATTERN = /^:pp-([a-z0-9-]+):$/;

// 렌더 크기(px) — 인라인(본문 중)·오버레이(OBS)·피커 그리드. 치지직처럼 작게 유지한다.
export const STICKER_PX = {
  inline: 28,
  overlay: 44,
  picker: 56,
} as const;

export const STICKER_LABEL = {
  trigger: "스티커 선택",
  item: (label: string) => `${label} 스티커`,
  // 피커 탭 — 기본(PixelPlay) / 내 채널(채널 이모지).
  tabDefault: "기본",
  tabChannel: "내 채널",
} as const;

// 기본 스티커 정의(id ↔ public/stickers/<id>.png). label은 접근성·스니펫용 짧은 한글.
const DEFAULT_STICKER_DEFS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "hi-rgb", label: "하이" },
  { id: "heart", label: "하트" },
  { id: "gg", label: "GG" },
  { id: "joystick", label: "게임" },
  { id: "live", label: "라이브" },
  { id: "popcorn", label: "팝콘" },
  { id: "shhh", label: "쉿" },
  { id: "huh", label: "엥" },
  { id: "sad", label: "슬퍼" },
  { id: "bye", label: "바이" },
];

export const DEFAULT_STICKERS: Sticker[] = DEFAULT_STICKER_DEFS.map((def) => ({
  id: def.id,
  label: def.label,
  src: `${STICKER_BASE_PATH}/${def.id}.png`,
  isAnimated: false,
}));
