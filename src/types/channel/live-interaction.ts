// 방송 운영 상호작용 도구(투표·추첨·룰렛)에서 사용하는 타입을 정의합니다.

export type InteractionTool = "poll" | "draw" | "roulette";

export type InteractionNoticeType = "poll" | "draw";

// 추첨 참여자 — getChannelLiveDrawParticipantsAction 응답 단위(액션·유틸·UI 공용).
export interface ChannelLiveDrawParticipant {
  firstMessageAt: string;
  isFollower: boolean;
  nickname: string;
  userId: string;
}

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
