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

export function LiveChatDonationMessageCard({
  author,
  amount,
  content,
  variant = "panel",
}: Props) {
  const donorColor = getLiveChatOverlayNicknameColor(author);
  const isOverlay = variant === "overlay";

  return (
    <div
      className={cn(
        "from-brand/15 to-live/15 border-live/25 bg-linear-to-r shadow-sm",
        isOverlay
          ? "inline-flex max-w-130 flex-col rounded-xl border px-4 py-3 text-3xl leading-9 shadow-black/30 drop-shadow"
          : "rounded-lg border px-3.5 py-2.5 text-sm",
      )}
    >
      <div className={cn("flex items-start justify-between", isOverlay ? "gap-4" : "gap-2")}>
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
            "mt-1.5 wrap-break-word",
            isOverlay ? "text-white drop-shadow-sm" : "text-foreground",
          )}
        >
          {content}
        </p>
      ) : null}
    </div>
  );
}
