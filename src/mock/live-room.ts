// 라이브 시청 화면에서 사용하는 mock 데이터를 정의합니다.

import type { LiveBroadcast, LiveChatMessage, LiveDonation, LivePoll } from "@/types/live/live";

export const MOCK_LIVE_BROADCASTS: Record<string, LiveBroadcast> = {
  test123: {
    id: "mock-test123",
    creatorId: "test123",
    title: "첫 방송입니다! 잘 부탁드려요 ㅎㅎ",
    tags: ["입문", "배우는중", "즐겜"],
    viewerCount: 47,
    elapsedSeconds: 720,
    creator: {
      id: "test123",
      name: "테스트유저",
      avatarUrl: null,
      followerCount: 12,
      broadcastCount: 1,
    },
  },
  pixel: {
    id: "mock-pixel",
    creatorId: "pixel",
    title: "시즌 마무리 랭크 달리기 | 목표 그랜드마스터",
    tags: ["랭크", "그마도전", "탑"],
    viewerCount: 5820,
    elapsedSeconds: 9143,
    creator: {
      id: "pixel",
      name: "픽셀",
      avatarUrl: null,
      followerCount: 142000,
      broadcastCount: 891,
    },
  },
};

export function getMockLiveBroadcast(creatorId: string): LiveBroadcast {
  return MOCK_LIVE_BROADCASTS[creatorId] ?? MOCK_LIVE_BROADCASTS["test123"];
}

export const MOCK_LIVE_CHAT_MESSAGES: LiveChatMessage[] = [
  {
    id: "msg-1",
    type: "system",
    content: "방송이 시작되었습니다.",
  },
  {
    id: "msg-2",
    type: "text",
    author: "구경꾼123",
    content: "안녕하세요~",
  },
  {
    id: "msg-3",
    type: "text",
    author: "팬클럽회장",
    content: "오늘도 화이팅이에요!!",
  },
  {
    id: "msg-4",
    type: "donation",
    author: "익명의 후원자",
    content: "응원합니다! 오늘도 좋은 방송 기대할게요.",
    donationAmount: 1000,
  },
  {
    id: "msg-5",
    type: "text",
    author: "늦게온사람",
    content: "방금 들어왔는데 무슨 게임 하는 중인가요?",
  },
  {
    id: "msg-7",
    type: "text",
    author: "단골시청자",
    content: "ㅋㅋㅋㅋ 저 장면 대박이다",
  },
  {
    id: "msg-8",
    type: "donation",
    author: "열성팬",
    content: "오늘 퇴근하고 바로 달려왔어요 ㅎㅎ 화이팅!",
    donationAmount: 5000,
  },
  {
    id: "msg-9",
    type: "text",
    author: "구경꾼123",
    content: "와 저 플레이 진짜 멋있다",
  },
  {
    id: "msg-10",
    type: "text",
    author: "신규시청자",
    content: "처음 왔는데 재미있네요 팔로우 하고 갑니다!",
  },
  {
    id: "msg-12",
    type: "text",
    author: "단골시청자",
    content: "ㅋㅋㅋ 오늘 너무 재밌다",
  },
];

export const MOCK_LIVE_DONATIONS: LiveDonation[] = [
  {
    id: "don-1",
    author: "열성팬",
    amount: 5000,
  },
  {
    id: "don-2",
    author: "익명의 후원자",
    amount: 1000,
  },
  {
    id: "don-3",
    author: "단골팬",
    amount: 10000,
  },
];

export const MOCK_LIVE_POLLS: LivePoll[] = [
  {
    id: "poll-1",
    title: "다음 게임 뭐 할까요?",
    options: [
      { id: "opt-1", label: "리그 오브 레전드", count: 128 },
      { id: "opt-2", label: "발로란트", count: 94 },
      { id: "opt-3", label: "배틀그라운드", count: 61 },
    ],
    status: "active",
    endsAt: null,
    userVotedOptionId: null,
    totalCount: 283,
  },
];
