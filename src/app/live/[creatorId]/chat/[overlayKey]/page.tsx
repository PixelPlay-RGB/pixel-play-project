// OBS 채팅창 URL의 보안 key 경로를 받는 화면을 렌더링합니다.
import { LiveChatOverlay } from "@/components/live/overlay/live-chat-overlay";
import { notFound } from "next/navigation";

import { getLiveChatOverlaySnapshot } from "../../_data/live-overlay-data";

export const metadata = {
  title: "OBS 채팅창",
  description: "방송 화면에 라이브 채팅을 띄우는 PixelPlay OBS 채팅창입니다.",
};

export default async function LiveChatOverlayPage({
  params,
}: {
  params: Promise<{ creatorId: string; overlayKey: string }>;
}) {
  const { creatorId, overlayKey } = await params;
  const snapshot = await getLiveChatOverlaySnapshot({ creatorId, overlayKey });

  if (!snapshot) {
    notFound();
  }

  return <LiveChatOverlay initialSnapshot={snapshot} />;
}
