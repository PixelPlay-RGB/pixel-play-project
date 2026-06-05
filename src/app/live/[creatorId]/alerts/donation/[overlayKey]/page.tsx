// OBS 후원 알림 URL의 보안 key 경로를 받는 화면을 렌더링합니다.
import { LiveDonationAlertOverlay } from "@/components/live/overlay/live-donation-alert-overlay";
import { notFound } from "next/navigation";

import { getLiveDonationAlertOverlaySnapshot } from "../../../_data/live-overlay-data";

export const metadata = {
  title: "후원 알림",
  description: "방송 화면에 채팅 후원 알림을 띄우는 PixelPlay OBS 화면입니다.",
};

export default async function LiveDonationAlertOverlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ creatorId: string; overlayKey: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { creatorId, overlayKey } = await params;
  const { preview } = await searchParams;
  const snapshot = await getLiveDonationAlertOverlaySnapshot({ creatorId, overlayKey });

  if (!snapshot) {
    notFound();
  }

  return <LiveDonationAlertOverlay initialSnapshot={snapshot} isPreview={preview === "1"} />;
}
