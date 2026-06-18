// 라이브 투표/추첨/룰렛 팝오버 카드들이 공유하는 헤더·상태 배지·옵션 바 프리미티브를 제공합니다.
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";

export function StatusPill({
  children,
  tone,
}: {
  children: string;
  tone: "brand" | "live" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
        tone === "brand" && "bg-brand/10 text-brand",
        tone === "live" && "bg-live/10 text-live",
        tone === "muted" && "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function InteractionHeader({
  onClose,
  status,
  title,
  titleId,
  tone,
}: {
  onClose: () => void;
  status: string;
  title: string;
  titleId?: string;
  tone: "brand" | "live" | "muted";
}) {
  return (
    <div className="flex items-center justify-between gap-3 pb-3">
      <p id={titleId} className="text-foreground min-w-0 flex-1 text-sm font-bold">
        {title}
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <StatusPill tone={tone}>{status}</StatusPill>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-7"
          onClick={onClose}
        >
          <X className="size-4" />
          <span className="sr-only">{LIVE_LABEL.close}</span>
        </Button>
      </div>
    </div>
  );
}

export function getVoteOptionClass(isSelected: boolean) {
  return cn(
    "border-border relative flex h-9 w-full items-center justify-start overflow-hidden rounded-md border px-3 text-sm font-bold transition-all",
    isSelected
      ? "border-brand bg-brand/10 text-brand shadow-[inset_0_0_0_1px_var(--brand)]"
      : "hover:border-brand/40",
  );
}

export function VoteOptionBar({ percent, emphasized }: { emphasized: boolean; percent: number }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute inset-y-0 left-0 transition-all duration-300",
        emphasized ? "bg-brand/20" : "bg-muted",
      )}
      style={{ width: `${percent}%` }}
    />
  );
}
