"use client";
// 채널 후원 설정 화면의 폼 상호작용을 관리합니다.

import { useState } from "react";
import { Controller, useWatch } from "react-hook-form";
import { ChevronDown, ChevronUp, HandCoins, Send } from "lucide-react";

import DonationAlertPreview from "@/components/channel/donation/donation-alert-preview";
import { DonationPreviewButton } from "@/components/channel/donation/donation-preview-button";
import DonationTestAlertButton from "@/components/channel/donation/donation-test-alert-button";
import { DonationVolumeSlider } from "@/components/channel/donation/donation-volume-slider";
import { HintNote } from "@/components/common/hint-note";
import { SettingFieldRow } from "@/components/common/setting-field-row";
import { SettingNumberSelectControl } from "@/components/common/setting-number-select-control";
import { SettingSegmentedControl } from "@/components/common/setting-segmented-control";
import { SettingToggleControl } from "@/components/common/setting-toggle-control";
import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import { SideTipCard, SideTipStep } from "@/components/common/side-tip-card";
import { StickySaveBar } from "@/components/common/sticky-save-bar";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectList,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import {
  DONATION_ALERT_DURATION_OPTIONS,
  DONATION_ALERT_SOUND_OPTIONS,
  DONATION_MIN_AMOUNT_FLOOR,
  DONATION_MIN_AMOUNT_STEP,
  DONATION_TEST_ALERT_SAMPLE,
  DONATION_TTS_RATE_OPTIONS,
} from "@/constants/channel/donation";
import { useChannelDonationSettingsForm } from "@/hooks/channel/use-channel-donation-settings-form";
import { useSpeechSynthesis } from "@/hooks/common/use-speech-synthesis";
import { useStickyActionBar } from "@/hooks/common/use-sticky-action-bar";
import { cn } from "@/lib/utils";
import type { ChannelDonationSnapshot } from "@/types/channel/donation";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";
import { playDonationSound } from "@/utils/channel/donation-sound";
import { buildDonationTtsText } from "@/utils/channel/donation-tts";
import { sendTestDonationAlert } from "@/utils/live/donation-alert-test";

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
  const { voices, speak } = useSpeechSynthesis();
  const [isSendingTest, setIsSendingTest] = useState(false);

  const donationEnabled = useWatch({ control, name: "donationEnabled" });
  const amountVisible = useWatch({ control, name: "donationAmountVisible" });
  const alertSoundEnabled = useWatch({ control, name: "alertSoundEnabled" });
  const alertSoundKey = useWatch({ control, name: "alertSoundKey" });
  const ttsEnabled = useWatch({ control, name: "ttsEnabled" });
  const ttsRate = useWatch({ control, name: "ttsRate" });
  const alertVolume = useWatch({ control, name: "alertVolume" });
  const ttsVolume = useWatch({ control, name: "ttsVolume" });
  const ttsVoiceUri = useWatch({ control, name: "ttsVoiceUri" });

  // 사용 가능한 한국어 음성 목록.
  // OBS 브라우저 소스(CEF)에는 Google 클라우드 음성 같은 "원격 음성"이 없어 기본 음성으로 대체되므로,
  // OS에 설치돼 OBS·Chrome 양쪽에서 동작하는 "로컬 음성"만 노출합니다.
  // (엔진명이 낯설어 일반화된 라벨로 표시하고, 같은 이름으로 중복되는 음성은 합칩니다.)
  const seenVoiceNames = new Set<string>();
  const voiceItems = voices
    .filter((voice) => voice.lang.toLowerCase().startsWith("ko"))
    .filter((voice) => voice.localService)
    .filter((voice) => {
      if (seenVoiceNames.has(voice.name)) {
        return false;
      }
      seenVoiceNames.add(voice.name);
      return true;
    })
    .map((voice, index) => ({
      value: voice.voiceURI,
      label: `TTS 기본 음성 - ${String(index + 1).padStart(2, "0")}`,
    }));
  // 저장값이 현재 목록(로컬 음성)에 없으면(예: 기존에 저장된 원격 음성) Select를 비워 다시 고르도록 유도합니다.
  // 폼 값 자체는 건드리지 않습니다(사용자가 직접 고른 값만 저장).
  const voiceValueSet = new Set(voiceItems.map((item) => item.value));
  const ttsVoiceValue = ttsVoiceUri && voiceValueSet.has(ttsVoiceUri) ? ttsVoiceUri : "";

  // 알림음만 현재 볼륨으로 미리듣기.
  const handlePreviewSound = () => {
    playDonationSound(alertSoundKey ?? "", alertVolume ?? 0);
  };

  // TTS만 현재 속도·볼륨·음성으로 미리듣기.
  const handlePreviewTts = () => {
    const { donorNickname, amount, message } = DONATION_TEST_ALERT_SAMPLE;

    // 음성 선택은 준비 중이라 기본 음성으로 고정합니다(voiceURI 미지정).
    speak(
      buildDonationTtsText({
        donorNickname,
        amount,
        message,
        amountVisible: Boolean(amountVisible),
      }),
      {
        rate: ttsRate ?? 1,
        volume: (ttsVolume ?? 0) / 100,
      },
    );
  };

  // 현재 설정 그대로 OBS 후원 알림 오버레이에 테스트 후원을 전송합니다(DB·방송 무관, 통계 미반영).
  const handleSendTestToObs = async () => {
    setIsSendingTest(true);

    try {
      const { donorNickname, amount, message } = DONATION_TEST_ALERT_SAMPLE;

      await sendTestDonationAlert(initialSnapshot.creatorId, {
        donorName: donorNickname,
        amount,
        message,
        audio: {
          alertSoundEnabled: Boolean(alertSoundEnabled),
          alertSoundKey: alertSoundKey ?? "classic",
          alertVolume: alertVolume ?? 0,
          ttsEnabled: Boolean(ttsEnabled),
          ttsRate: ttsRate ?? 1,
          ttsVolume: ttsVolume ?? 0,
          ttsVoiceUri: ttsVoiceUri ?? "",
          amountVisible: Boolean(amountVisible),
        },
      });

      toastAppSuccess(APP_MESSAGE_CODE.success.channel.donationTestSent);
    } catch (error) {
      console.error("테스트 후원 전송 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.channel.donationTestFailed);
    } finally {
      setIsSendingTest(false);
    }
  };

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
            "bg-brand hover:bg-brand/90 text-white",
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
          {/* 메인 컬럼: 후원 알림 설정 + 채팅 후원 설정 */}
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <SettingsCard
              title="후원 알림 설정"
              description="후원이 들어오면 방송 화면에 뜨는 알림과 알림 소리, TTS를 설정해요."
            >
              <Controller
                name="donationAlertDurationSeconds"
                control={control}
                render={({ field }) => (
                  <SettingFieldRow
                    label="알림 노출 유지 시간"
                    description="후원 알림이 방송 화면에 표시된 뒤 사라지기까지의 시간이에요."
                  >
                    <SettingNumberSelectControl
                      ariaLabel="알림 노출 유지 시간"
                      value={field.value}
                      options={DONATION_ALERT_DURATION_OPTIONS}
                      disabled={isSaving}
                      onChange={field.onChange}
                    />
                  </SettingFieldRow>
                )}
              />
              <Controller
                name="alertSoundEnabled"
                control={control}
                render={({ field }) => (
                  <SettingFieldRow label="알림 소리" description="알림이 뜰 때 효과음을 재생해요.">
                    <SettingToggleControl
                      checked={field.value}
                      checkedLabel="ON"
                      uncheckedLabel="OFF"
                      ariaLabel="알림 소리 사용"
                      disabled={isSaving}
                      onChange={field.onChange}
                    />
                  </SettingFieldRow>
                )}
              />
              <Controller
                name="alertSoundKey"
                control={control}
                render={({ field }) => (
                  <SettingFieldRow
                    label="알림 효과음"
                    description="재생할 효과음을 골라요."
                    isDimmed={!alertSoundEnabled}
                  >
                    <div className="flex items-center gap-2">
                      <Select
                        value={field.value}
                        items={DONATION_ALERT_SOUND_OPTIONS}
                        disabled={isSaving || !alertSoundEnabled}
                        onValueChange={(value) => field.onChange(value as string)}
                      >
                        <SelectTrigger aria-label="알림 효과음" className="w-40">
                          <SelectValue />
                          <SelectIcon />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectList>
                            {DONATION_ALERT_SOUND_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                label={option.label}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectList>
                        </SelectContent>
                      </Select>
                      <DonationPreviewButton
                        ariaLabel="알림음 미리듣기"
                        disabled={isSaving || !alertSoundEnabled}
                        onPreview={handlePreviewSound}
                      />
                    </div>
                  </SettingFieldRow>
                )}
              />
              <Controller
                name="alertVolume"
                control={control}
                render={({ field }) => (
                  <SettingFieldRow
                    label="알림 소리 볼륨"
                    description="효과음 크기"
                    isDimmed={!alertSoundEnabled}
                  >
                    <DonationVolumeSlider
                      value={field.value}
                      disabled={isSaving || !alertSoundEnabled}
                      onChange={field.onChange}
                    />
                  </SettingFieldRow>
                )}
              />
              <Controller
                name="ttsEnabled"
                control={control}
                render={({ field }) => (
                  <SettingFieldRow label="TTS" description="후원 메시지를 음성으로 읽어줘요.">
                    <SettingToggleControl
                      checked={field.value}
                      checkedLabel="ON"
                      uncheckedLabel="OFF"
                      ariaLabel="TTS 사용"
                      disabled={isSaving}
                      onChange={field.onChange}
                    />
                  </SettingFieldRow>
                )}
              />
              <Controller
                name="ttsRate"
                control={control}
                render={({ field }) => (
                  <SettingFieldRow
                    label="TTS 속도"
                    description="음성 읽기 속도"
                    isDimmed={!ttsEnabled}
                  >
                    <div className="flex items-center gap-2">
                      <SettingSegmentedControl
                        ariaLabel="TTS 속도"
                        value={field.value}
                        options={DONATION_TTS_RATE_OPTIONS}
                        disabled={isSaving || !ttsEnabled}
                        onChange={field.onChange}
                      />
                      <DonationPreviewButton
                        ariaLabel="TTS 미리듣기"
                        disabled={isSaving || !ttsEnabled}
                        onPreview={handlePreviewTts}
                      />
                    </div>
                  </SettingFieldRow>
                )}
              />
              <Controller
                name="ttsVolume"
                control={control}
                render={({ field }) => (
                  <SettingFieldRow label="TTS 볼륨" description="음성 크기" isDimmed={!ttsEnabled}>
                    <DonationVolumeSlider
                      value={field.value}
                      disabled={isSaving || !ttsEnabled}
                      onChange={field.onChange}
                    />
                  </SettingFieldRow>
                )}
              />
              <Controller
                name="ttsVoiceUri"
                control={control}
                render={({ field }) => (
                  <SettingFieldRow
                    label="TTS 음성"
                    description="현재는 기본 TTS 음성만 지원해요. 음성 선택은 준비 중이에요."
                    isDimmed={!ttsEnabled}
                  >
                    <Select
                      value={ttsVoiceValue}
                      items={voiceItems}
                      disabled
                      onValueChange={(value) => field.onChange(value as string)}
                    >
                      <SelectTrigger aria-label="TTS 음성" className="w-52">
                        <SelectValue placeholder="기본 음성 (준비중)" />
                        <SelectIcon />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectList>
                          {voiceItems.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              label={option.label}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectList>
                      </SelectContent>
                    </Select>
                  </SettingFieldRow>
                )}
              />
            </SettingsCard>

            <SettingsCard
              title="채팅 후원 설정"
              description="시청자가 라이브 채팅에서 보낼 수 있는 후원의 기본 조건이에요."
            >
              <Controller
                name="donationEnabled"
                control={control}
                render={({ field }) => (
                  <SettingFieldRow
                    label="후원 받기"
                    description="끄면 시청자가 채팅에서 후원을 보낼 수 없어요."
                  >
                    <SettingToggleControl
                      checked={field.value}
                      checkedLabel="ON"
                      uncheckedLabel="OFF"
                      ariaLabel="채팅 후원 받기"
                      disabled={isSaving}
                      onChange={field.onChange}
                    />
                  </SettingFieldRow>
                )}
              />
              <Controller
                name="donationAmountVisible"
                control={control}
                render={({ field }) => (
                  <SettingFieldRow
                    label="후원 금액 표시"
                    description="채팅·알림에 금액 표시"
                    isDimmed={!donationEnabled}
                  >
                    <SettingToggleControl
                      checked={field.value}
                      checkedLabel="ON"
                      uncheckedLabel="OFF"
                      ariaLabel="후원 금액 표시"
                      disabled={isSaving || !donationEnabled}
                      onChange={field.onChange}
                    />
                  </SettingFieldRow>
                )}
              />
              <Controller
                name="donationMinAmount"
                control={control}
                render={({ field }) => (
                  <SettingFieldRow
                    label="최소 후원 금액"
                    description="이 금액 이상부터 후원을 받아요."
                    isDimmed={!donationEnabled}
                  >
                    <div className="flex w-full flex-col gap-1 sm:w-44">
                      <InputGroup>
                        <InputGroupInput
                          type="number"
                          inputMode="numeric"
                          min={DONATION_MIN_AMOUNT_FLOOR}
                          step={DONATION_MIN_AMOUNT_STEP}
                          value={field.value}
                          disabled={isSaving || !donationEnabled}
                          aria-label="최소 후원 금액"
                          onChange={(event) => field.onChange(event.target.valueAsNumber || 0)}
                          className="[appearance:textfield] text-right [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <InputGroupAddon align="inline-end" className="gap-1.5">
                          <div className="flex flex-col">
                            <button
                              type="button"
                              tabIndex={-1}
                              aria-label="금액 올리기"
                              disabled={isSaving || !donationEnabled}
                              onClick={() =>
                                field.onChange((field.value || 0) + DONATION_MIN_AMOUNT_STEP)
                              }
                              className="text-muted-foreground hover:text-brand hover:bg-muted flex h-3.5 w-4 items-center justify-center rounded-sm transition-colors disabled:opacity-30"
                            >
                              <ChevronUp className="size-3" />
                            </button>
                            <button
                              type="button"
                              tabIndex={-1}
                              aria-label="금액 내리기"
                              disabled={
                                isSaving ||
                                !donationEnabled ||
                                (field.value || 0) <= DONATION_MIN_AMOUNT_FLOOR
                              }
                              onClick={() =>
                                field.onChange(
                                  Math.max(
                                    (field.value || 0) - DONATION_MIN_AMOUNT_STEP,
                                    DONATION_MIN_AMOUNT_FLOOR,
                                  ),
                                )
                              }
                              className="text-muted-foreground hover:text-brand hover:bg-muted flex h-3.5 w-4 items-center justify-center rounded-sm transition-colors disabled:opacity-30"
                            >
                              <ChevronDown className="size-3" />
                            </button>
                          </div>
                          P
                        </InputGroupAddon>
                      </InputGroup>
                      <FieldError errors={[errors.donationMinAmount]} />
                    </div>
                  </SettingFieldRow>
                )}
              />
            </SettingsCard>
          </div>

          {/* 사이드 컬럼: 알림 미리보기 + 가이드 */}
          <div className="flex min-w-0 flex-col gap-5 xl:w-120 xl:shrink-0">
            <SettingsCard
              title="알림 미리보기"
              description="실제 후원 알림 화면과 같은 모습이에요. 현재 설정한 속도·볼륨으로 미리 들어볼 수 있어요."
            >
              <DonationAlertPreview amountVisible={Boolean(amountVisible)} />
              <DonationTestAlertButton
                alertSoundEnabled={Boolean(alertSoundEnabled)}
                alertSoundKey={alertSoundKey ?? ""}
                alertVolume={alertVolume ?? 0}
                ttsEnabled={Boolean(ttsEnabled)}
                ttsRate={ttsRate ?? 1}
                ttsVolume={ttsVolume ?? 0}
                amountVisible={Boolean(amountVisible)}
                disabled={isSaving}
                className="w-full"
              />
              <Button
                type="button"
                variant="outline"
                disabled={isSendingTest}
                onClick={handleSendTestToObs}
                className="h-10 w-full rounded-xl font-semibold"
              >
                {isSendingTest ? <Spinner /> : <Send className="size-4" />}
                OBS에 테스트 후원 보내기
              </Button>
              <HintNote>
                OBS에 후원 알림 주소를 연결해 두면,
                <br />
                보낸 테스트 후원이 실제 알림으로 화면에 떠요.
                <br />
                방송 시청자에게는 보이지 않고, 후원 통계에도 잡히지 않아요.
              </HintNote>
            </SettingsCard>

            <SideTipCard
              icon={<HandCoins className="size-5" />}
              title="후원 설정을 적용하기 전에 확인해요"
              description={`후원 설정은 다음 방송부터 적용돼요.\n알림은 OBS 후원 알림 화면에 그대로 보여집니다.`}
            >
              <SideTipStep
                number="1"
                title="후원 조건을 정해요"
                description={`최소 후원 금액과 금액 표시 여부를 설정해요.\n금액을 숨기면 시청자에게 후원 금액이 보이지 않아요.`}
              />
              <SideTipStep
                number="2"
                title="알림 소리와 TTS는 달라요"
                description={`알림 소리는 알림이 뜰 때 나는 효과음이에요.\nTTS는 후원 메시지를 음성으로 읽어줘요.`}
              />
              <SideTipStep
                number="3"
                title="알림 주소를 연결해요"
                description={`OBS 후원 알림 오버레이 주소는 채널 보안 설정에서 확인할 수 있어요.\n표시 시간은 오버레이에 그대로 적용돼요.`}
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
