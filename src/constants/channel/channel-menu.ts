// 채널 관리 사이드바 메뉴 상수를 정의합니다.
import type { ChannelMenuItem } from "@/types/channel/channel-menu";
import {
  BarChart3,
  HandCoins,
  MessageSquareText,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

export const CHANNEL_MENU_ITEMS: ChannelMenuItem[] = [
  {
    id: "live",
    label: "방송 운영",
    href: "/channel/live",
    icon: SlidersHorizontal,
  },
  {
    id: "donation",
    label: "후원 설정",
    href: "/channel/donation",
    icon: HandCoins,
  },
  {
    id: "chat",
    label: "채팅 설정",
    href: "/channel/chat",
    icon: MessageSquareText,
  },
  {
    id: "security",
    label: "보안 설정",
    href: "/channel/security",
    icon: ShieldCheck,
  },
  {
    id: "analytics",
    label: "통계 분석",
    icon: BarChart3,
    children: [
      { id: "analytics-live", label: "실시간 통계", href: "/channel/analytics/live" },
      { id: "analytics-report", label: "지난 방송 분석", href: "/channel/analytics/report" },
    ],
  },
];
