// 랜딩 프리뷰 채팅 후원 메시지를 렌더링합니다.
import { LANDING_DONATION_TEXT } from "@/constants/preview/landing-preview";
import { cn } from "@/lib/utils";

export function LiveChatDonation() {
  return (
    <p
      className={cn(
        "border-live/35 rounded-xl border px-3 py-2.5",
        "from-live/20 to-brand/15 bg-linear-to-r",
        "text-xs leading-relaxed font-black",
      )}
    >
      <b className="text-live mr-1.5">{LANDING_DONATION_TEXT.badge}</b>
      {LANDING_DONATION_TEXT.message}
    </p>
  );
}
