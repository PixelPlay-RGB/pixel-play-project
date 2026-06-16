"use client";
// 채널 구독뱃지와 이모티콘 설정 섹션을 렌더링합니다.

import { CircleHelp, Plus, SmilePlus } from "lucide-react";
import { useState } from "react";

import { SubscriptionBadgeRegistrationDialog } from "@/components/channel/subscription/channel-subscription-badge-registration-dialog";
import { LiveSubscriptionBadge } from "@/components/live/chat/live-subscription-badge";
import { Button } from "@/components/ui/button";
import { buildLiveSubscriptionBadgeMonths } from "@/utils/live/live-subscription-badge";

interface Props {
  creatorId: string;
  customMonths: number[];
  subscriptionBadgeVersion: string | null;
  subscriptionBadgeImageSources: Record<number, string>;
}

export function ChannelSubscriptionPerkSettings({
  creatorId,
  customMonths,
  subscriptionBadgeVersion,
  subscriptionBadgeImageSources,
}: Props) {
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const badgeMonths = buildLiveSubscriptionBadgeMonths(customMonths);

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

          <div className="mt-8 grid grid-cols-3 gap-x-5 gap-y-6 sm:grid-cols-5 lg:grid-cols-7">
            {badgeMonths.map((month) => (
              <div key={month} className="flex min-w-0 flex-col items-center gap-2">
                <LiveSubscriptionBadge
                  creatorId={creatorId}
                  totalMonths={month}
                  customMonths={customMonths}
                  version={subscriptionBadgeVersion}
                  imageSourcesByMonth={subscriptionBadgeImageSources}
                  size="lg"
                />
                <div className="text-center leading-5">
                  <p className="text-foreground text-sm font-bold">
                    {month === 1 ? "기본" : `${month}개월`}
                  </p>
                  <p className="text-muted-foreground text-xs">({month}개월)</p>
                </div>
              </div>
            ))}
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
