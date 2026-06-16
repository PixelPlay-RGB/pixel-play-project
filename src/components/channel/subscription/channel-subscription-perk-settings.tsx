"use client";
// 채널 구독뱃지와 이모티콘 설정 섹션을 렌더링합니다.

import { CircleHelp, Plus, SmilePlus } from "lucide-react";
import { useState } from "react";

import { SubscriptionBadgeRegistrationDialog } from "@/components/channel/subscription/channel-subscription-badge-registration-dialog";
import { LiveSubscriptionBadge } from "@/components/live/chat/live-subscription-badge";
import { Button } from "@/components/ui/button";

interface Props {
  creatorId: string;
  customMonths: number[];
}

export function ChannelSubscriptionPerkSettings({ creatorId, customMonths }: Props) {
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <SubscriptionAssetSectionHeader
          title="구독뱃지"
          actionLabel="등록하기"
          showHelp
          onAction={() => setBadgeDialogOpen(true)}
        />

        <div className="bg-card min-h-48 rounded-xl p-5 shadow-sm ring-1 ring-black/5 sm:p-7">
          <h3 className="text-foreground text-base font-black">사용중인 구독뱃지</h3>

          <div className="mt-8 flex w-fit flex-col items-center gap-2 px-4">
            <LiveSubscriptionBadge
              creatorId={creatorId}
              totalMonths={1}
              customMonths={customMonths}
              size="lg"
            />
            <div className="text-center leading-5">
              <p className="text-foreground text-sm font-bold">기본</p>
              <p className="text-muted-foreground text-xs">(1개월)</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SubscriptionAssetSectionHeader title="이모티콘" />

        <div className="bg-card flex min-h-66 flex-col rounded-xl p-5 shadow-sm ring-1 ring-black/5 sm:p-7">
          <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
            <SmilePlus className="text-muted-foreground mb-3 size-6" aria-hidden />
            <p className="text-foreground text-sm font-black">등록된 이모티콘이 없어요.</p>
          </div>
        </div>
      </section>

      <SubscriptionBadgeRegistrationDialog
        open={badgeDialogOpen}
        onOpenChange={setBadgeDialogOpen}
      />
    </div>
  );
}

function SubscriptionAssetSectionHeader({
  title,
  actionLabel,
  showHelp,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  showHelp?: boolean;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-1.5">
        <h2 className="text-foreground text-xl font-black">{title}</h2>
        {showHelp ? <CircleHelp className="text-muted-foreground size-4" aria-hidden /> : null}
      </div>

      {actionLabel && onAction ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary"
          onClick={onAction}
        >
          <Plus className="size-4" />
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
