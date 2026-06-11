"use client";
// 후원 알림 설정 카드 — 노출 시간, 알림 소리, TTS 옵션과 미리듣기를 관리합니다.

import { Controller, useWatch, type Control } from "react-hook-form";

import { DonationPreviewButton } from "@/components/channel/donation/donation-preview-button";
import { DonationVolumeSlider } from "@/components/channel/donation/donation-volume-slider";
import { SettingFieldRow } from "@/components/common/setting-field-row";
import { SettingNumberSelectControl } from "@/components/common/setting-number-select-control";
import { SettingSegmentedControl } from "@/components/common/setting-segmented-control";
import { SettingToggleControl } from "@/components/common/setting-toggle-control";
import { SettingsCard } from "@/components/common/settings-card";
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectList,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DONATION_ALERT_DURATION_OPTIONS,
  DONATION_ALERT_SOUND_OPTIONS,
  DONATION_TEST_ALERT_SAMPLE,
  DONATION_TTS_RATE_OPTIONS,
} from "@/constants/channel/donation";
import type { ChannelDonationSettingsInput } from "@/lib/zod/channel-donation";
import { useSpeechSynthesis } from "@/hooks/common/use-speech-synthesis";
import { playDonationSound } from "@/utils/channel/donation-sound";
import { buildDonationTtsText } from "@/utils/channel/donation-tts";

interface Props {
  control: Control<ChannelDonationSettingsInput>;
  isSaving: boolean;
}

export function ChannelDonationAlertSettingsCard({ control, isSaving }: Props) {
  const { voices, speak } = useSpeechSynthesis();

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

  return (
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
                      <SelectItem key={option.value} value={option.value} label={option.label}>
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
          <SettingFieldRow label="TTS 속도" description="음성 읽기 속도" isDimmed={!ttsEnabled}>
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
                    <SelectItem key={option.value} value={option.value} label={option.label}>
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
  );
}
