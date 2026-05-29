// 채널 보안 설정의 OBS URL 카드 안내 상수를 정의합니다.
import { BellRing, MessageSquareText } from "lucide-react";

import type {
  ChannelSecurityTokenKind,
  ChannelSecurityUrlCardMeta,
} from "@/types/channel/security";

export const CHANNEL_SECURITY_TOKEN_KIND_SET = new Set<ChannelSecurityTokenKind>([
  "stream_key",
  "chat_overlay",
  "donation_alert",
]);

export const CHANNEL_SECURITY_URL_CARD_META: ChannelSecurityUrlCardMeta[] = [
  {
    tokenKind: "chat_overlay",
    title: "채팅창 주소",
    label: "채팅창 주소",
    description: "방송 화면에 채팅을 띄울 때 쓰는 주소예요.",
    icon: MessageSquareText,
    accent: "brand",
    popup: {
      width: 520,
      height: 599,
    },
    tutorialItems: [
      "OBS에서 브라우저 소스를 추가한 뒤 이 주소를 붙여 넣어주세요.",
      "크기는 520 x 600으로 맞추면 안정적으로 보여요.",
      "채팅이 멈춘 것처럼 보이면 브라우저 소스를 새로고침해주세요.",
    ],
  },
  {
    tokenKind: "donation_alert",
    title: "후원 알림 주소",
    label: "후원 알림 주소",
    description: "후원이 들어오면 방송 화면에 알림을 띄우는 주소예요.",
    icon: BellRing,
    accent: "live",
    popup: {
      width: 640,
      height: 360,
    },
    tutorialItems: [
      "후원 알림은 채팅창과 별도의 브라우저 소스로 추가해주세요.",
      "크기는 640 x 360으로 두면 16:9 화면에 잘 맞아요.",
      "알림은 기본으로 5초 동안 보여요.",
    ],
  },
];
