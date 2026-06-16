"use client";
// 채널 구독뱃지와 이모티콘 설정 섹션을 렌더링합니다.

import { Plus, SmilePlus } from "lucide-react";
import { useState } from "react";

import { SubscriptionBadgeRegistrationDialog } from "@/components/channel/subscription/channel-subscription-badge-registration-dialog";
import { SettingsCard } from "@/components/common/settings-card";
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
    <div className="flex flex-col gap-6">
      <SettingsCard
        title="구독뱃지"
        action={
          <SubscriptionAssetActionButton
            actionLabel="등록하기"
            onAction={() => setBadgeDialogOpen(true)}
          />
        }
        contentClassName="gap-4"
      >
        <div className="border-border/70 bg-muted/30 rounded-lg border p-4 sm:p-5">
          <div className="grid grid-cols-3 gap-x-5 gap-y-6 sm:grid-cols-5 lg:grid-cols-7">
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
      </SettingsCard>

      <SettingsCard title="이모티콘" contentClassName="gap-4">
        <div className="border-border/70 bg-muted/30 flex min-h-66 flex-col rounded-lg border border-dashed p-5 sm:p-6">
          <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted text-muted-foreground mb-4 flex size-11 items-center justify-center rounded-xl">
              <SmilePlus className="size-5" aria-hidden />
            </div>
            <p className="text-foreground text-sm font-black">등록된 이모티콘이 없어요.</p>
          </div>
        </div>
      </SettingsCard>

      <SubscriptionBadgeRegistrationDialog
        open={badgeDialogOpen}
        onOpenChange={setBadgeDialogOpen}
      />
    </div>
  );
}

function SubscriptionAssetActionButton({
  actionLabel,
  onAction,
}: {
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="border-brand/30 text-brand hover:bg-brand/10 hover:text-brand"
      onClick={onAction}
    >
      <Plus className="size-4" />
      {actionLabel}
    </Button>
  );
}
