// 시청·운영 채팅 패널의 후원 메시지 카드입니다.
// OBS 채팅 오버레이는 전용 카드(live-chat-overlay-donation-card)를 따로 쓴다 — 송출 화면용
// 스타일(불투명 바탕·큰 글자)과 패널용 스타일이 섞이지 않게 책임을 분리한다.

import { formatDonationAmount } from "@/utils/live/live-chat";
import { getLiveChatOverlayNicknameColor } from "@/utils/live/live-chat-overlay-style";

interface Props {
  author: string;
  amount?: number | null;
  content?: string | null;
}

export function LiveChatDonationMessageCard({ author, amount, content }: Props) {
  // 후원 마크와 같은 brand→live 그라데이션 배경, 닉네임·금액 pill은 채팅과 동일한 해시 컬러.
  const donorColor = getLiveChatOverlayNicknameColor(author);

  return (
    <div className="from-brand/15 to-live/15 border-live/25 rounded-lg border bg-linear-to-r px-3.5 py-2.5 text-sm shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 text-sm font-bold wrap-break-word" style={{ color: donorColor }}>
          {author}
        </span>
        {typeof amount === "number" ? (
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 text-sm font-bold tabular-nums"
            style={{
              color: donorColor,
              backgroundColor: `color-mix(in srgb, ${donorColor} 15%, transparent)`,
            }}
          >
            {formatDonationAmount(amount)}P
          </span>
        ) : null}
      </div>
      {content ? <p className="text-foreground mt-1.5 wrap-break-word">{content}</p> : null}
    </div>
  );
}
