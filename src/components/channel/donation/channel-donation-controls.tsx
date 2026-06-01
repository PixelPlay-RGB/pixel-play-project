"use client";
// 채널 후원 설정 화면의 폼 상호작용을 관리합니다.

import { Controller, useWatch } from "react-hook-form";
import { HandCoins } from "lucide-react";

import DonationRecentList from "@/components/channel/donation/donation-recent-list";
import DonationStatsSummary from "@/components/channel/donation/donation-stats-summary";
import DonationTestAlertButton from "@/components/channel/donation/donation-test-alert-button";
import { DonationFieldRow } from "@/components/channel/donation/donation-field-row";
import { DonationVolumeSlider } from "@/components/channel/donation/donation-volume-slider";
import { SettingNumberSelectControl } from "@/components/common/setting-number-select-control";
import { SettingToggleControl } from "@/components/common/setting-toggle-control";
import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import { SideTipCard, SideTipStep } from "@/components/common/side-tip-card";
import { StickySaveBar } from "@/components/common/sticky-save-bar";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import {
  DONATION_ALERT_DURATION_OPTIONS,
  DONATION_MIN_AMOUNT_CEILING,
  DONATION_MIN_AMOUNT_FLOOR,
  DONATION_MIN_AMOUNT_STEP,
  DONATION_TTS_RATE_OPTIONS,
} from "@/constants/channel/donation";
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

  const donationEnabled = useWatch({ control, name: "donationEnabled" });
  const alertEnabled = useWatch({ control, name: "donationAlertEnabled" });
  const ttsEnabled = useWatch({ control, name: "ttsEnabled" });
  const ttsRate = useWatch({ control, name: "ttsRate" });
  const alertVolume = useWatch({ control, name: "alertVolume" });

  return (
    <SettingsPage
      kicker="방송 후원 관리"
      title="후원 설정을 관리해요"
      description={
        <>
          후원 수신 조건과 알림, 음성 읽기를 한 곳에서 설정해요.
          <br />
          시청자에게 보여질 후원 알림을 현재 설정으로 미리 들어볼 수 있어요.
        </>
      }
      action={
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving || !isDirty}
          className={cn(
            "h-11 shrink-0 rounded-xl px-7 font-bold lg:w-auto",
            "bg-brand hover:bg-brand/90 text-white",
            "shadow-brand/20 shadow-sm transition-all active:scale-95",
          )}
        >
          {isSaving ? <Spinner /> : "변경사항 저장"}
        </Button>
      }
    >
      <div ref={sentinelRef} aria-hidden />

      <DonationStatsSummary
        monthlyDonation={initialSnapshot.monthlyDonation}
        settlement={initialSnapshot.settlement}
      />

      <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <SettingsCard title="후원 받기" description="시청자가 보낼 수 있는 후원 조건을 정해요.">
              <Controller
                name="donationEnabled"
                control={control}
                render={({ field }) => (
                  <DonationFieldRow label="후원 받기" description="후원 수신 사용 여부">
                    <SettingToggleControl
                      checked={field.value}
                      checkedLabel="받는 중"
                      uncheckedLabel="받지 않음"
                      ariaLabel="후원 받기 사용"
                      disabled={isSaving}
                      onChange={field.onChange}
                    />
                  </DonationFieldRow>
                )}
              />
              <Controller
                name="donationMinAmount"
                control={control}
                render={({ field }) => (
                  <DonationFieldRow
                    label="최소 후원 금액"
                    description="이 금액 이상부터 후원을 받아요."
                    isDimmed={!donationEnabled}
                  >
                    <div className="flex w-full flex-col items-end gap-1 sm:w-48">
                      <InputGroup>
                        <InputGroupInput
                          type="number"
                          inputMode="numeric"
                          min={DONATION_MIN_AMOUNT_FLOOR}
                          max={DONATION_MIN_AMOUNT_CEILING}
                          step={DONATION_MIN_AMOUNT_STEP}
                          value={field.value}
                          disabled={isSaving || !donationEnabled}
                          aria-label="최소 후원 금액"
                          onChange={(event) => field.onChange(event.target.valueAsNumber || 0)}
                          className="text-right"
                        />
                        <InputGroupAddon align="inline-end">P</InputGroupAddon>
                      </InputGroup>
                      <FieldError errors={[errors.donationMinAmount]} />
                    </div>
                  </DonationFieldRow>
                )}
              />
              <Controller
                name="donationAmountVisible"
                control={control}
                render={({ field }) => (
                  <DonationFieldRow
                    label="후원 금액 표시"
                    description="채팅과 알림에 후원 금액을 보여줘요."
                    isDimmed={!donationEnabled}
                  >
                    <SettingToggleControl
                      checked={field.value}
                      checkedLabel="표시"
                      uncheckedLabel="숨김"
                      ariaLabel="후원 금액 표시"
                      disabled={isSaving || !donationEnabled}
                      onChange={field.onChange}
                    />
                  </DonationFieldRow>
                )}
              />
            </SettingsCard>

            <SettingsCard title="후원 알림" description="OBS 오버레이에 표시할 후원 알림이에요.">
              <Controller
                name="donationAlertEnabled"
                control={control}
                render={({ field }) => (
                  <DonationFieldRow label="알림 표시" description="후원 시 오버레이 알림">
                    <SettingToggleControl
                      checked={field.value}
                      checkedLabel="ON"
                      uncheckedLabel="OFF"
                      ariaLabel="후원 알림 표시"
                      disabled={isSaving}
                      onChange={field.onChange}
                    />
                  </DonationFieldRow>
                )}
              />
              <Controller
                name="alertSoundEnabled"
                control={control}
                render={({ field }) => (
                  <DonationFieldRow
                    label="알림 사운드"
                    description="알림과 함께 효과음을 재생해요."
                    isDimmed={!alertEnabled}
                  >
                    <SettingToggleControl
                      checked={field.value}
                      checkedLabel="ON"
                      uncheckedLabel="OFF"
                      ariaLabel="알림 사운드 사용"
                      disabled={isSaving || !alertEnabled}
                      onChange={field.onChange}
                    />
                  </DonationFieldRow>
                )}
              />
              <Controller
                name="alertVolume"
                control={control}
                render={({ field }) => (
                  <DonationFieldRow
                    label="알림 볼륨"
                    description="알림 사운드와 음성 크기예요."
                    isDimmed={!alertEnabled}
                  >
                    <DonationVolumeSlider
                      value={field.value}
                      disabled={isSaving || !alertEnabled}
                      onChange={field.onChange}
                    />
                  </DonationFieldRow>
                )}
              />
              <Controller
                name="donationAlertDurationSeconds"
                control={control}
                render={({ field }) => (
                  <DonationFieldRow
                    label="알림 표시 시간"
                    description="오버레이에 알림이 보이는 시간이에요."
                    isDimmed={!alertEnabled}
                  >
                    <SettingNumberSelectControl
                      ariaLabel="알림 표시 시간"
                      value={field.value}
                      options={DONATION_ALERT_DURATION_OPTIONS}
                      disabled={isSaving || !alertEnabled}
                      compact
                      onChange={field.onChange}
                    />
                  </DonationFieldRow>
                )}
              />
              <div className="border-border/70 border-t pt-5">
                <DonationTestAlertButton
                  alertEnabled={Boolean(alertEnabled)}
                  ttsEnabled={Boolean(ttsEnabled)}
                  ttsRate={ttsRate ?? 1}
                  alertVolume={alertVolume ?? 0}
                  disabled={isSaving}
                />
              </div>
            </SettingsCard>

            <SettingsCard
              title="음성 읽기 (TTS)"
              description="후원 메시지를 브라우저 음성으로 읽어줘요."
            >
              <Controller
                name="ttsEnabled"
                control={control}
                render={({ field }) => (
                  <DonationFieldRow label="후원 메시지 읽기" description="Web Speech API 사용">
                    <SettingToggleControl
                      checked={field.value}
                      checkedLabel="ON"
                      uncheckedLabel="OFF"
                      ariaLabel="후원 메시지 음성 읽기"
                      disabled={isSaving}
                      onChange={field.onChange}
                    />
                  </DonationFieldRow>
                )}
              />
              <Controller
                name="ttsRate"
                control={control}
                render={({ field }) => (
                  <DonationFieldRow
                    label="읽기 속도"
                    description="음성으로 읽는 속도예요."
                    isDimmed={!ttsEnabled}
                  >
                    <SettingNumberSelectControl
                      ariaLabel="음성 읽기 속도"
                      value={field.value}
                      options={DONATION_TTS_RATE_OPTIONS}
                      disabled={isSaving || !ttsEnabled}
                      compact
                      onChange={field.onChange}
                    />
                  </DonationFieldRow>
                )}
              />
            </SettingsCard>
          </div>

          <div className="flex min-w-0 flex-col gap-5 xl:w-120 xl:shrink-0">
            <DonationRecentList items={initialSnapshot.recentDonations} />

            <SideTipCard
              icon={<HandCoins className="size-5" />}
              title="후원 설정을 적용하기 전에 확인해요"
              description={`후원 설정은 다음 방송부터 적용돼요.\n알림은 OBS 후원 알림 오버레이에서 그대로 보여집니다.`}
            >
              <SideTipStep
                number="1"
                title="후원 조건을 정해요"
                description={`최소 후원 금액과 금액 표시 여부를 설정해요.\n금액을 숨기면 시청자에게 후원 금액이 보이지 않아요.`}
              />
              <SideTipStep
                number="2"
                title="알림을 미리 들어봐요"
                description={`테스트 알림으로 현재 속도·볼륨을 바로 확인할 수 있어요.\n음성 읽기는 브라우저 기본 TTS를 사용해요.`}
              />
              <SideTipStep
                number="3"
                title="오버레이에 반영해요"
                description={`알림 오버레이 주소는 채널 보안 설정에서 확인할 수 있어요.\n표시 시간은 오버레이에 그대로 적용돼요.`}
              />
            </SideTipCard>
          </div>
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
