// 채널 보안 설정의 OBS URL 카드 안내 상수를 정의합니다.
import { BellRing, MessageSquareText } from "lucide-react";

import {
  OBS_CHAT_OVERLAY_TUTORIAL_STEPS,
  OBS_CHAT_OVERLAY_TUTORIAL_TITLE,
  OBS_DONATION_OVERLAY_TUTORIAL_STEPS,
  OBS_DONATION_OVERLAY_TUTORIAL_TITLE,
} from "@/constants/channel/obs-tutorial";
import type {
  ChannelSecurityTokenKind,
  ChannelSecurityUrlCardMeta,
} from "@/types/channel/security";

export const CHANNEL_SECURITY_TOKEN_KIND_SET = new Set<ChannelSecurityTokenKind>([
  "stream_key",
  "chat_overlay",
  "donation_alert",
]);

// 스트림 키·OBS URL을 "보기"로 노출한 뒤 자동으로 다시 가리기까지의 시간(CSEC-011, 어깨너머 노출 차단).
// 복사 버튼이 따로 있어 길게 노출할 필요가 없으므로 보안상 짧게 둔다(값 확정 필요 — 스펙 본문 1분 모순).
export const SECURITY_REVEAL_DURATION_MS = 30_000;

export const CHANNEL_SECURITY_ROTATE_SUCCESS_DESCRIPTION = {
  stream_key: "새 스트림 키를 만들었어요. OBS에 다시 붙여 넣어주세요.",
  chat_overlay: "새 채팅창 주소를 만들었어요. OBS에 다시 붙여 넣어주세요.",
  donation_alert: "새 후원 알림 주소를 만들었어요. OBS에 다시 붙여 넣어주세요.",
} satisfies Record<ChannelSecurityTokenKind, string>;

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
    tutorial: {
      title: OBS_CHAT_OVERLAY_TUTORIAL_TITLE,
      steps: OBS_CHAT_OVERLAY_TUTORIAL_STEPS,
    },
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
      "후원 설정 페이지에서 테스트 후원을 보내 OBS 소스 연결을 확인할 수 있어요.",
      "알림은 설정한 표시 시간만큼 보여요.",
    ],
    tutorial: {
      title: OBS_DONATION_OVERLAY_TUTORIAL_TITLE,
      steps: OBS_DONATION_OVERLAY_TUTORIAL_STEPS,
    },
  },
];
