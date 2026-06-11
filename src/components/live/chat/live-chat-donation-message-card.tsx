"use client";
// 라이브 채팅 후원 메시지 카드를 시청 화면과 OBS 채팅 오버레이에서 공통으로 렌더링합니다.

import { cn } from "@/lib/utils";
import { formatDonationAmount } from "@/utils/live/live-chat";
import { getLiveChatOverlayNicknameColor } from "@/utils/live/live-chat-overlay-style";

interface Props {
  author: string;
  amount?: number | null;
  content?: string | null;
  variant?: "panel" | "overlay";
}

export function LiveChatDonationMessageCard({ author, amount, content, variant = "panel" }: Props) {
  const donorColor = getLiveChatOverlayNicknameColor(author);
  const isOverlay = variant === "overlay";

  return (
    // 시청 채팅 후원 카드와 동일한 레이아웃(풀폭 블록 + 닉네임/금액 pill 양끝 정렬).
    // 오버레이는 송출 화면 위라 일반 채팅 박스와 같은 완전 불투명 바탕을 깔고
    // 그 위에 같은 brand→live 그라데이션을 얹어 가독성과 디자인을 함께 유지한다.
    <div
      className={cn(
        "border-live/25 shadow-sm",
        isOverlay
          ? "relative w-full max-w-130 overflow-hidden rounded-xl border bg-zinc-950 px-4 py-3 text-3xl leading-9 drop-shadow"
          : "from-brand/15 to-live/15 rounded-lg border bg-linear-to-r px-3.5 py-2.5 text-sm",
      )}
    >
      {isOverlay ? (
        <div aria-hidden className="from-brand/15 to-live/15 absolute inset-0 bg-linear-to-r" />
      ) : null}
      <div
        className={cn("relative flex items-start justify-between", isOverlay ? "gap-4" : "gap-2")}
      >
        <span
          className={cn("min-w-0 font-bold wrap-break-word", isOverlay ? "text-3xl" : "text-sm")}
          style={{ color: donorColor }}
        >
          {author}
        </span>
        {typeof amount === "number" ? (
          <span
            className={cn(
              "shrink-0 rounded-full font-bold tabular-nums",
              isOverlay ? "px-3 py-0.5 text-2xl leading-8" : "px-2.5 py-0.5 text-sm",
            )}
            style={{
              color: donorColor,
              backgroundColor: `color-mix(in srgb, ${donorColor} 15%, transparent)`,
            }}
          >
            {formatDonationAmount(amount)}P
          </span>
        ) : null}
      </div>
      {content ? (
        <p
          className={cn(
            "relative mt-1.5 wrap-break-word",
            isOverlay ? "text-white drop-shadow-sm" : "text-foreground",
          )}
        >
          {content}
        </p>
      ) : null}
    </div>
  );
}
