"use client";
// 채널 후원 설정 화면 — 폼 훅과 설정 카드, 미리보기 사이드를 조합합니다.

import { ChannelDonationAlertSettingsCard } from "@/components/channel/donation/channel-donation-alert-settings-card";
import { ChannelDonationChatSettingsCard } from "@/components/channel/donation/channel-donation-chat-settings-card";
import { ChannelDonationPreviewSide } from "@/components/channel/donation/channel-donation-preview-side";
import { SettingsPage } from "@/components/common/settings-page";
import { StickySaveBar } from "@/components/common/sticky-save-bar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useChannelDonationSettingsForm } from "@/hooks/channel/use-channel-donation-settings-form";
import { useStickyActionBar } from "@/hooks/common/use-sticky-action-bar";
import { cn } from "@/lib/utils";
import type { ChannelDonationSnapshot } from "@/types/channel/donation";

interface Props {
  initialSnapshot: ChannelDonationSnapshot;
}

export function ChannelDonationControls({ initialSnapshot }: Props) {
  const { form, handleSubmit, isSaving } = useChannelDonationSettingsForm(initialSnapshot.settings);
  const {
    control,
    reset,
    formState: { isDirty, errors },
  } = form;
  const { sentinelRef, show } = useStickyActionBar(isDirty);

  return (
    <SettingsPage
      kicker="방송 후원 관리"
      title="후원 설정을 관리해요"
      description="채팅 후원 수신 조건과 방송 화면 알림, 알림 소리, TTS를 한 곳에서 관리해요."
      action={
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving || !isDirty}
          className={cn(
            "h-11 shrink-0 rounded-xl px-7 font-bold lg:w-auto",
            "bg-brand hover:bg-brand/90 text-brand-foreground",
            "shadow-brand/20 shadow-sm transition-all active:scale-95",
          )}
        >
          {isSaving ? <Spinner /> : "변경사항 저장"}
        </Button>
      }
    >
      <div ref={sentinelRef} aria-hidden />

      <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <ChannelDonationAlertSettingsCard control={control} isSaving={isSaving} />
            <ChannelDonationChatSettingsCard
              control={control}
              errors={errors}
              isSaving={isSaving}
            />
          </div>

          <ChannelDonationPreviewSide
            control={control}
            creatorId={initialSnapshot.creatorId}
            isSaving={isSaving}
          />
        </div>
      </form>

      <StickySaveBar
        show={show}
        isSaving={isSaving}
        canSave={isDirty}
        onSave={handleSubmit}
        onReset={() => reset()}
      />
    </SettingsPage>
  );
}
