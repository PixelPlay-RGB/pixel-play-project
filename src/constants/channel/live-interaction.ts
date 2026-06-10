// 방송 운영 상호작용 도구(투표·추첨·룰렛)의 기본값과 동작 상수를 정의합니다.
import { FerrisWheel, Gift, Vote } from "lucide-react";

import type { RouletteItem } from "@/types/channel/live-interaction";

export const DEFAULT_POLL_OPTIONS = ["", ""];

export const DEFAULT_ROULETTE_ITEMS: RouletteItem[] = [
  { label: "당첨" },
  { label: "다시 뽑기" },
  { label: "꽝" },
];

export const ROULETTE_SEGMENT_COLORS = [
  "var(--brand)",
  "var(--live)",
  "var(--info)",
  "var(--warning)",
  "var(--success)",
  "var(--muted-foreground)",
];

export const POLL_TIMER_MAX_SECONDS = 3600;
export const DRAW_TIMER_MAX_SECONDS = 3600;
export const DRAW_REEL_ROW_HEIGHT_PX = 40;
export const DRAW_REEL_REPEAT_COUNT = 9;
export const DRAW_REEL_DURATION_MS = 2200;
export const ROULETTE_SPIN_DURATION_SECONDS = 4.2;
export const ROULETTE_SPIN_TURNS = 8;
export const ROULETTE_POINTER_DEGREE = 45;
export const ROULETTE_RECOIL_DEGREE = 46;

export const INTERACTION_TOOLS = [
  { icon: Vote, label: "투표", value: "poll" },
  { icon: Gift, label: "추첨", value: "draw" },
  { icon: FerrisWheel, label: "룰렛", value: "roulette" },
] as const;
