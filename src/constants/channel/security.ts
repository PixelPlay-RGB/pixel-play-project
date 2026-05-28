// 채널 보안 설정의 OBS URL 카드 안내 상수를 정의합니다.
import { BellRing, Radio } from "lucide-react";

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
    title: "OBS 채팅창 URL",
    label: "채팅창 URL",
    description: "방송 화면에 채팅창을 띄울 때 OBS에 붙여 넣는 주소입니다.",
    icon: Radio,
    accent: "brand",
    popup: {
      width: 520,
      height: 599,
    },
    tutorialItems: [
      "OBS에서 브라우저 소스를 추가한 뒤 URL 입력란에 이 주소를 붙여 넣어주세요.",
      "너비 520, 높이 599로 시작하면 채팅창이 가장 자연스럽게 보입니다.",
      "채팅이 보이지 않으면 OBS 브라우저 소스를 한 번 새로고침해주세요.",
    ],
  },
  {
    tokenKind: "donation_alert",
    title: "OBS 후원 알림 URL",
    label: "후원 알림 URL",
    description: "후원이 들어왔을 때 방송 화면에 알림을 띄우는 주소입니다.",
    icon: BellRing,
    accent: "live",
    popup: {
      width: 640,
      height: 360,
    },
    tutorialItems: [
      "OBS에서 후원 알림용 브라우저 소스를 채팅창과 따로 추가해주세요.",
      "너비 640, 높이 360으로 시작하면 16:9 방송 화면에서 알림이 자연스럽게 보입니다.",
      "후원이 들어오면 닉네임, 금액, 메시지가 방송 화면에 잠시 표시됩니다.",
      "소리와 읽어주기 설정은 후원 설정 페이지에서 바꿀 수 있습니다.",
    ],
  },
];
