// 채널 관리 사이드바 메뉴 상수를 정의합니다.
import type { ChannelMenuItem } from "@/types/channel/channel-menu";
import {
  BarChart3,
  HandCoins,
  MessageSquareText,
  ShieldCheck,
  SlidersHorizontal,
  UserX,
  Users,
} from "lucide-react";

export interface ChannelMenuGroup {
  label: string;
  items: ChannelMenuItem[];
}

// 성격별 섹션: 방송(운영·채팅) / 수익(후원) / 관리(통계·보안).
export const CHANNEL_MENU_GROUPS: ChannelMenuGroup[] = [
  {
    label: "방송",
    items: [
      { id: "live", label: "방송 운영", href: "/channel/live", icon: SlidersHorizontal },
      { id: "chat", label: "채팅 설정", href: "/channel/chat", icon: MessageSquareText },
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
      { id: "permissions", label: "권한 관리", href: "/channel/permissions", icon: Users },
      { id: "viewers", label: "시청자 관리", href: "/channel/viewers", icon: UserX },
      { id: "security", label: "방송 연결", href: "/channel/security", icon: ShieldCheck },
    ],
  },
];

// 평면 배열(호환용).
export const CHANNEL_MENU_ITEMS: ChannelMenuItem[] = CHANNEL_MENU_GROUPS.flatMap(
  (group) => group.items,
);
