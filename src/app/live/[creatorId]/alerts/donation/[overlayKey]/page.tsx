// OBS 후원 알림 URL의 보안 key 경로를 받는 화면을 렌더링합니다.
import { getLiveDonationAlertOverlaySnapshot } from "@/actions/live/overlay";
import { LiveDonationAlertOverlay } from "@/components/live/overlay/live-donation-alert-overlay";
import { notFound } from "next/navigation";

export const metadata = {
  title: "후원 알림",
  description: "방송 화면에 채팅 후원 알림을 띄우는 PixelPlay OBS 화면입니다.",
};

export default async function LiveDonationAlertOverlayPage({
  params,
}: {
  params: Promise<{ creatorId: string; overlayKey: string }>;
}) {
  const { creatorId, overlayKey } = await params;
  const snapshot = await getLiveDonationAlertOverlaySnapshot({ creatorId, overlayKey });

  if (!snapshot) {
    notFound();
  }

  return <LiveDonationAlertOverlay initialSnapshot={snapshot} />;
}
