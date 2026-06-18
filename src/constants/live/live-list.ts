// 라이브 목록 화면의 필터, 정렬, 기본값을 관리합니다.

import type { LucideIcon } from "lucide-react";
import { Heart, MessageCircle, Radio, Sparkles } from "lucide-react";

import type { LiveListFilter, LiveListSort } from "@/types/live/live";

export const LIVE_LIST_PAGE_SIZE = 20;
export const LIVE_LIST_GRID_BREAKPOINTS = {
  sm: 640,
  xl: 1280,
  "2xl": 1536,
} as const;
export const LIVE_LIST_PAGE_SIZE_BY_COLUMN_COUNT = {
  one: 8,
  two: 12,
  three: 12,
  four: 20,
} as const;

export const LIVE_LIST_DEFAULT_FILTER: LiveListFilter = "ALL";
export const LIVE_LIST_DEFAULT_SORT: LiveListSort = "VIEWER_COUNT_DESC";

export const LIVE_LIST_FILTER_ICON = {
  ALL: Radio,
  FOLLOWING: Heart,
  RECENT: Sparkles,
  ACTIVE_CHAT: MessageCircle,
} as const satisfies Record<LiveListFilter, LucideIcon>;

export const LIVE_LIST_FILTER_OPTIONS = [
  {
    value: "ALL",
    label: "전체",
    description: "지금 방송 중인 라이브를 모두 보여드려요.",
  },
  {
    value: "FOLLOWING",
    label: "팔로잉",
    description: "팔로잉한 크리에이터의 라이브만 모아드려요.",
  },
  {
    value: "RECENT",
    label: "방금 시작",
    description: "30분 안에 시작한 라이브를 먼저 볼 수 있어요.",
  },
  {
    value: "ACTIVE_CHAT",
    label: "채팅 활발",
    description: "최근 5분 동안 채팅이 올라온 라이브를 보여드려요.",
  },
] as const satisfies ReadonlyArray<{
  value: LiveListFilter;
  label: string;
  description: string;
}>;

export const LIVE_LIST_SORT_OPTIONS = [
  {
    value: "VIEWER_COUNT_DESC",
    label: "시청자 많은순",
  },
  {
    value: "STARTED_AT_DESC",
    label: "최근 시작순",
  },
  {
    value: "RECENT_CHAT_DESC",
    label: "채팅 많은순",
  },
] as const satisfies ReadonlyArray<{
  value: LiveListSort;
  label: string;
}>;

export const LIVE_LIST_SORT_TITLE = {
  VIEWER_COUNT_DESC: "시청자가 많은 방송",
  STARTED_AT_DESC: "최근 시작한 방송",
  RECENT_CHAT_DESC: "채팅이 활발한 방송",
} as const satisfies Record<LiveListSort, string>;

export const LIVE_LIST_EMPTY_MESSAGE = {
  ALL: {
    title: "지금은 켜진 방송이 없어요.",
    description: "새 방송이 시작되면 이곳에서 바로 보여드릴게요.",
  },
  FOLLOWING: {
    title: "팔로잉한 채널의 라이브가 없어요.",
    description: "관심 있는 크리에이터를 팔로잉해두면 여기에서 바로 볼 수 있어요.",
  },
  RECENT: {
    title: "방금 시작한 방송이 없어요.",
    description: "30분 안에 시작한 방송이 생기면 먼저 보여드릴게요.",
  },
  ACTIVE_CHAT: {
    title: "채팅이 활발한 방송이 없어요.",
    description: "대화가 올라오는 방송이 생기면 바로 모아드릴게요.",
  },
} as const satisfies Record<LiveListFilter, { title: string; description: string }>;

export const LIVE_THUMBNAIL_FALLBACK_URLS = [
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556438064-2d7646166914?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511882150382-421056c89033?q=80&w=1200&auto=format&fit=crop",
] as const;

export function isLiveListSort(value: string): value is LiveListSort {
  return LIVE_LIST_SORT_OPTIONS.some((option) => option.value === value);
}
