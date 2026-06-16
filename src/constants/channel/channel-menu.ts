// 채널 관리 사이드바 메뉴 상수를 정의합니다.
import type { ChannelMenuItem } from "@/types/channel/channel-menu";
import {
  BarChart3,
  Crown,
  HandCoins,
  MessageSquareText,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";

export interface ChannelMenuGroup {
  label: string;
  items: ChannelMenuItem[];
}

// 성격별 섹션: 방송(운영·채팅·연결) / 수익(후원·구독) / 관리(통계·권한). 구독 아코디언 하위에 이모지.
export const CHANNEL_MENU_GROUPS: ChannelMenuGroup[] = [
  {
    label: "방송",
    items: [
      { id: "live", label: "방송 운영", href: "/channel/live", icon: SlidersHorizontal },
      { id: "chat", label: "채팅 설정", href: "/channel/chat", icon: MessageSquareText },
      { id: "security", label: "방송 연결", href: "/channel/security", icon: ShieldCheck },
    ],
  },
  {
    label: "수익",
    items: [
      {
        id: "donation",
        label: "후원",
        icon: HandCoins,
        children: [
          { id: "donation-settings", label: "설정", href: "/channel/donation" },
          { id: "settlement", label: "정산", href: "/channel/settlement" },
        ],
      },
      {
        id: "subscription",
        label: "구독",
        icon: Crown,
        children: [{ id: "subscription-emoji", label: "이모지", href: "/channel/emoji" }],
      },
    ],
  },
  {
    label: "관리",
    items: [
      {
        id: "analytics",
        label: "통계 분석",
        icon: BarChart3,
        children: [
          { id: "analytics-live", label: "실시간 통계", href: "/channel/analytics/live" },
          { id: "analytics-report", label: "지난 방송 분석", href: "/channel/analytics/report" },
        ],
      },
      { id: "permissions", label: "매니저 관리", href: "/channel/permissions", icon: Users },
    ],
  },
];

// 평면 배열(호환용).
export const CHANNEL_MENU_ITEMS: ChannelMenuItem[] = CHANNEL_MENU_GROUPS.flatMap(
  (group) => group.items,
);
