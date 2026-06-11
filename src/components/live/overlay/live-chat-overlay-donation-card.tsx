// OBS 채팅 오버레이 전용 후원 메시지 카드 — 시청/운영 채팅 카드와 컴포넌트를 공유하지 않는다.
// 송출 화면 위라 완전 불투명 바탕 + 큰 글자(text-3xl)가 전제라, 패널용과 스타일 책임을 분리한다.

import { formatDonationAmount } from "@/utils/live/live-chat";
import { getLiveChatOverlayNicknameColor } from "@/utils/live/live-chat-overlay-style";

interface Props {
  author: string;
  amount?: number | null;
  content?: string | null;
}

export function LiveChatOverlayDonationCard({ author, amount, content }: Props) {
  const donorColor = getLiveChatOverlayNicknameColor(author);

  return (
    // 일반 채팅 박스와 같은 완전 불투명 바탕 위에 brand→live 그라데이션을 얹는다.
    // overflow-hidden(그라데이션 클립)이 flex 아이템의 자동 최소 높이 보호를 없애 스택 공간이
    // 부족하면 카드가 세로로 눌리므로, shrink-0으로 눌림을 금지한다(넘친 위 항목은 스택이 제거).
    <div className="border-live/25 relative w-full max-w-130 shrink-0 overflow-hidden rounded-xl border bg-zinc-950 px-4 py-3 shadow-sm drop-shadow">
      <div aria-hidden className="from-brand/15 to-live/15 absolute inset-0 bg-linear-to-r" />
      {/* 좁은 소스 폭에서는 금액 pill이 닉네임을 짓누르지 않게 줄바꿈으로 내려간다. */}
      <div className="relative flex flex-wrap items-center gap-x-4 gap-y-1">
        <span
          className="min-w-0 text-3xl leading-9 font-bold wrap-break-word"
          style={{ color: donorColor }}
        >
          {author}
        </span>
        {typeof amount === "number" && (
          <span
            className="ml-auto shrink-0 rounded-full px-3 py-0.5 text-2xl leading-8 font-bold tabular-nums"
            style={{
              color: donorColor,
              backgroundColor: `color-mix(in srgb, ${donorColor} 15%, transparent)`,
            }}
          >
            {formatDonationAmount(amount)}P
          </span>
        )}
      </div>
      {content && (
        <p className="relative mt-5 text-3xl leading-9 wrap-break-word text-white drop-shadow-sm">
          {content}
        </p>
      )}
    </div>
  );
}
