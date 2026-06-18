// 채널 채팅 설정 화면의 고정 옵션과 제한값을 정의합니다.

import type { LiveChatScope } from "@/types/channel/chat";

export const CHANNEL_CHAT_RULE_MAX_LENGTH = 300;
export const CHANNEL_CHAT_FORBIDDEN_WORD_MAX_COUNT = 100;
// 서버 검증(src/lib/zod/channel-live.ts의 forbiddenWords .max(30))과 일치시켜 드리프트 제거.
// 클라가 먼저 차단해 "서버만 거절" UX 불일치를 막는다.
export const CHANNEL_CHAT_FORBIDDEN_WORD_MAX_LENGTH = 30;

export const CHANNEL_CHAT_DEFAULT_RULE_TEXT =
  "서로를 존중하며 대화해주세요. 반복 도배, 비방, 홍보성 메시지는 제한될 수 있습니다.";

export const CHANNEL_CHAT_SCOPE_OPTIONS = [
  {
    value: "authenticated",
    label: "모든 로그인 유저",
    description: "로그인한 시청자라면 바로 채팅할 수 있어요.",
  },
  {
    value: "follower",
    label: "팔로워만",
    description: "채널을 팔로우한 시청자에게만 채팅을 열어요.",
  },
] as const satisfies ReadonlyArray<{
  value: LiveChatScope;
  label: string;
  description: string;
}>;

export const CHANNEL_CHAT_FOLLOWER_WAIT_OPTIONS = [
  { value: 0, label: "바로 가능" },
  { value: 300, label: "5분" },
  { value: 600, label: "10분" },
  { value: 1800, label: "30분" },
  { value: 3600, label: "1시간" },
  { value: 86400, label: "1일" },
  { value: 604800, label: "1주일" },
  { value: 2592000, label: "1개월" },
  { value: 5184000, label: "2개월" },
  { value: 7776000, label: "3개월" },
  { value: 10368000, label: "4개월" },
  { value: 12960000, label: "5개월" },
  { value: 15552000, label: "6개월" },
] as const;

export const CHANNEL_CHAT_SLOW_MODE_OPTIONS = [
  { value: 3, label: "3초" },
  { value: 5, label: "5초" },
  { value: 10, label: "10초" },
  { value: 30, label: "30초" },
  { value: 60, label: "1분" },
  { value: 120, label: "2분" },
  { value: 300, label: "5분" },
] as const;
