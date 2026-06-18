"use client";
// 채널 구독 배지 설정 섹션을 렌더링합니다.

import { ImagePlus, Plus } from "lucide-react";
import { useState } from "react";

import { SubscriptionBadgeRegistrationDialog } from "@/components/channel/subscription/channel-subscription-badge-registration-dialog";
import { formatUploadFileSize } from "@/components/channel/subscription/subscription-asset-upload-controls";
import { SettingsCard } from "@/components/common/settings-card";
import { SideTipCard } from "@/components/common/side-tip-card";
import { SideTipStep } from "@/components/common/side-tip-step";
import { LiveSubscriptionBadge } from "@/components/live/chat/live-subscription-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CHANNEL_SUBSCRIPTION_BADGE_IMAGE_SIZE,
  CHANNEL_SUBSCRIPTION_BADGE_MAX_FILE_SIZE,
} from "@/utils/channel/channel-subscription-badge-upload";
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
  const [selectedPreviewMonth, setSelectedPreviewMonth] = useState(1);
  const badgeMonths = buildLiveSubscriptionBadgeMonths(customMonths);

  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <SettingsCard
          title="등록한 구독 배지"
          description="구독 기간별 채팅 배지를 확인하고 필요한 구간의 이미지를 등록해요."
          action={
            <SubscriptionAssetActionButton
              actionLabel="등록하기"
              onAction={() => setBadgeDialogOpen(true)}
            />
          }
          contentClassName="gap-4"
        >
          <div className="grid grid-cols-3 gap-x-5 gap-y-6 sm:grid-cols-5 lg:grid-cols-7">
            {badgeMonths.map((month) => (
              <SubscriptionBadgeMonthPreview
                key={month}
                creatorId={creatorId}
                month={month}
                customMonths={customMonths}
                version={subscriptionBadgeVersion}
                imageSourcesByMonth={subscriptionBadgeImageSources}
              />
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            기본 구독 배지 슬롯은 1개월과 동일하며, 필요한 개월 수는 등록 창에서 직접 선택하거나
            입력할 수 있어요.
          </p>
        </SettingsCard>

        <SettingsCard
          title="구독자에게 이렇게 보여요"
          description="구독자가 채팅에서 보게 되는 구독 배지 미리보기예요. 등록과 수정 내용은 저장 후 반영돼요."
        >
          <div className="bg-popover ring-foreground/10 rounded-xl p-3 ring-1">
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
              {badgeMonths.map((month) => {
                const isSelected = month === selectedPreviewMonth;

                return (
                  <button
                    key={month}
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={`${month}개월 구독 배지 미리보기`}
                    className={cn(
                      "rounded-lg p-2 transition-colors outline-none",
                      "focus-visible:ring-brand/60 focus-visible:ring-2",
                      isSelected ? "bg-brand/10 ring-brand/40 ring-1" : "hover:bg-muted",
                    )}
                    onClick={() => setSelectedPreviewMonth(month)}
                  >
                    <SubscriptionBadgeMonthPreview
                      creatorId={creatorId}
                      month={month}
                      customMonths={customMonths}
                      version={subscriptionBadgeVersion}
                      imageSourcesByMonth={subscriptionBadgeImageSources}
                      compact
                      isSelected={isSelected}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-border bg-muted/40 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm">
            <LiveSubscriptionBadge
              creatorId={creatorId}
              totalMonths={selectedPreviewMonth}
              customMonths={customMonths}
              version={subscriptionBadgeVersion}
              imageSourcesByMonth={subscriptionBadgeImageSources}
              size="sm"
            />
            <span className="text-brand shrink-0 font-bold">구독자</span>
            <span className="text-foreground min-w-0 truncate">
              선택한 배지는 채팅 닉네임 왼쪽에 표시돼요.
            </span>
          </div>
        </SettingsCard>
      </div>

      <div className="flex min-w-0 flex-col gap-5 xl:w-120 xl:shrink-0">
        <SideTipCard
          icon={<ImagePlus className="size-5" />}
          title="배지를 등록하기 전에 확인해요"
          description="구독 배지는 채팅에서 작은 크기로 보이므로 선명한 정사각형 PNG 파일로 준비해주세요."
        >
          <SideTipStep
            number="1"
            title="이미지 규격"
            description={`사이즈: ${CHANNEL_SUBSCRIPTION_BADGE_IMAGE_SIZE}×${CHANNEL_SUBSCRIPTION_BADGE_IMAGE_SIZE}px / 파일크기: ${formatUploadFileSize(
              CHANNEL_SUBSCRIPTION_BADGE_MAX_FILE_SIZE,
            )} 이내\npng 형식의 이미지 파일\n이미지 파일명: 영문, 숫자로 구성`}
          />
          <SideTipStep
            number="2"
            title="등록과 검수"
            description="신청한 구독 배지는 기본적인 검수 진행 후 1일 1회 일괄 등록 예정입니다."
          />
          <SideTipStep
            number="3"
            title="기본 슬롯 관리"
            description="기본 구독 배지 슬롯은 1개월과 동일하며 이미지 등록 및 수정, 삭제가 가능합니다."
          />
          <SideTipStep
            number="4"
            title="개월 수 설정"
            description="개월 수는 직접 선택 및 입력이 가능합니다."
          />
        </SideTipCard>
      </div>

      <SubscriptionBadgeRegistrationDialog
        open={badgeDialogOpen}
        onOpenChange={setBadgeDialogOpen}
      />
    </div>
  );
}

function SubscriptionBadgeMonthPreview({
  creatorId,
  month,
  customMonths,
  version,
  imageSourcesByMonth,
  compact = false,
  isSelected = false,
}: {
  creatorId: string;
  month: number;
  customMonths: number[];
  version: string | null;
  imageSourcesByMonth: Record<number, string>;
  compact?: boolean;
  isSelected?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      <LiveSubscriptionBadge
        creatorId={creatorId}
        totalMonths={month}
        customMonths={customMonths}
        version={version}
        imageSourcesByMonth={imageSourcesByMonth}
        size="lg"
      />
      <span
        className={cn(
          "leading-none whitespace-nowrap",
          compact ? "text-muted-foreground text-xs" : "text-foreground text-sm font-bold",
          isSelected && "text-brand font-bold",
        )}
      >
        {month}개월
      </span>
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
      size="sm"
      className="bg-brand hover:bg-brand/90 text-brand-foreground hover:text-brand-foreground shadow-brand/20 h-8 rounded-xl px-3 font-bold shadow-sm"
      onClick={onAction}
    >
      <Plus className="size-4" />
      {actionLabel}
    </Button>
  );
}
