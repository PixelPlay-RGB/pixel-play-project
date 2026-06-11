// 방송 운영 상호작용 도구(투표·추첨·룰렛)에서 사용하는 타입을 정의합니다.
import type { ChannelLiveDrawParticipant } from "@/actions/channel/live";

export type InteractionTool = "poll" | "draw" | "roulette";

export type InteractionNoticeType = "draw" | "roulette";

export interface DrawState {
  endedAt: string | null;
  noticeId: string | null;
  participants: ChannelLiveDrawParticipant[];
  startedAt: string;
  winnerUserIds: string[];
}

export interface PollResult {
  count: number;
  option: string;
  percent: number;
}

export interface RouletteItem {
  label: string;
}

export interface RouletteSegment {
  centerDegree: number;
  endPercent: number;
  index: number;
  item: RouletteItem;
  startPercent: number;
}

export interface LiveRouletteNoticePayload {
  createdAt: string;
  id: string;
  items: string[];
  resultLabel: string;
  rotation: number;
  status: "active" | "ended";
}
