// 강퇴(밴) 차단 화면 — 강퇴당한 시청자에게 플레이어/채팅 대신 보여준다(#119).
// 입장 차단(강퇴 상태로 재진입) vs 시청 중 강퇴(즉시 퇴장)를 구분해 문구를 바꾼다.

import Link from "next/link";
import { Ban } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";

interface Props {
  // true = 시청 중 강퇴(즉시 퇴장), false = 강퇴 상태로 입장 시도(입장 차단).
  wasEvicted: boolean;
}

export function LiveBannedScreen({ wasEvicted }: Props) {
  const title = wasEvicted ? LIVE_LABEL.bannedEvictedTitle : LIVE_LABEL.bannedEntryTitle;
  const description = wasEvicted
    ? LIVE_LABEL.bannedEvictedDescription
    : LIVE_LABEL.bannedEntryDescription;

  return (
    <div
      className={cn(
        "bg-background flex flex-col items-center justify-center gap-5 px-4 text-center",
        "min-h-app-content md:h-full md:min-h-0",
      )}
    >
      <div className="bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-2xl">
        <Ban className="size-7" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-foreground text-lg font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <Link
        href="/live"
        className={cn(buttonVariants({ variant: "outline" }), "rounded-full font-semibold")}
      >
        {LIVE_LABEL.browseLive}
      </Link>
    </div>
  );
}
