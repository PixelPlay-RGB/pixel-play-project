"use client";
// 강퇴(밴) 안내 다이얼로그 — 강퇴당한 시청자에게 시청 화면 위로 모달을 띄운다(#119).
// 입장 차단(강퇴 상태 재진입) vs 시청 중 강퇴(즉시 퇴장)를 구분해 문구를 바꾼다.
// onOpenChange 없이 open 만 넘겨 완전 제어 모드(Escape·바깥 클릭 비해제), 유일한 출구는 라이브 목록 이동.

import Link from "next/link";
import { Ban } from "lucide-react";

import { DestructiveAlertDialog } from "@/components/common/destructive-alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  // true = 시청 중 강퇴(즉시 퇴장), false = 강퇴 상태로 입장 시도(입장 차단).
  wasEvicted: boolean;
}

export function LiveBannedDialog({ open, wasEvicted }: Props) {
  const title = wasEvicted ? LIVE_LABEL.bannedEvictedTitle : LIVE_LABEL.bannedEntryTitle;
  const description = wasEvicted
    ? LIVE_LABEL.bannedEvictedDescription
    : LIVE_LABEL.bannedEntryDescription;

  return (
    <DestructiveAlertDialog
      open={open}
      icon={<Ban />}
      title={title}
      description={description}
      contentClassName="sm:max-w-md"
    >
      <Link
        href="/live"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-10 min-w-24 rounded-xl px-4 font-bold",
        )}
      >
        {LIVE_LABEL.browseLive}
      </Link>
    </DestructiveAlertDialog>
  );
}
