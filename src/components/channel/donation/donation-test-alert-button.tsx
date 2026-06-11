"use client";
// 현재 알림 설정으로 후원 알림(효과음 → TTS)을 미리 들어보는 테스트 버튼입니다.

import { Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DONATION_TEST_ALERT_SAMPLE } from "@/constants/channel/donation";
import { useSpeechSynthesis } from "@/hooks/common/use-speech-synthesis";
import { cn } from "@/lib/utils";
import { playDonationSound } from "@/utils/channel/donation-sound";
import { buildDonationTtsText } from "@/utils/channel/donation-tts";

interface Props {
  alertSoundEnabled: boolean;
  alertSoundKey: string;
  alertVolume: number;
  ttsEnabled: boolean;
  ttsRate: number;
  ttsVolume: number;
  ttsVoiceUri?: string;
  amountVisible: boolean;
  disabled?: boolean;
  className?: string;
}

export default function DonationTestAlertButton({
  alertSoundEnabled,
  alertSoundKey,
  alertVolume,
  ttsEnabled,
  ttsRate,
  ttsVolume,
  ttsVoiceUri,
  amountVisible,
  disabled,
  className,
}: Props) {
  const { isSupported, speak } = useSpeechSynthesis();

  // 효과음만으로도 미리듣기가 가능하므로 둘 중 하나라도 켜져 있으면 재생합니다.
  const isPlayable = !disabled && (alertSoundEnabled || (ttsEnabled && isSupported));

  const title =
    !alertSoundEnabled && !ttsEnabled
      ? "효과음이나 음성 읽기를 켜면 미리 들어볼 수 있어요."
      : !alertSoundEnabled && !isSupported
        ? "이 브라우저는 음성 읽기를 지원하지 않아요."
        : undefined;

  const playTts = () => {
    if (!ttsEnabled || !isSupported) {
      return;
    }

    const { donorNickname, amount, message } = DONATION_TEST_ALERT_SAMPLE;

    speak(buildDonationTtsText({ donorNickname, amount, message, amountVisible }), {
      rate: ttsRate,
      volume: ttsVolume / 100,
      voiceURI: ttsVoiceUri || undefined,
    });
  };

  const handleTest = () => {
    if (!isPlayable) {
      return;
    }

    // 효과음 재생이 끝나면(또는 파일 누락 시) TTS를 이어서 재생합니다.
    if (alertSoundEnabled) {
      playDonationSound(alertSoundKey, alertVolume, playTts);
      return;
    }

    playTts();
  };

  return (
    <Button
      type="button"
      disabled={!isPlayable}
      onClick={handleTest}
      title={title}
      className={cn(
        "h-10 rounded-xl px-5 font-bold",
        "bg-brand hover:bg-brand/90 shadow-brand/20 text-brand-foreground shadow-sm",
        className,
      )}
    >
      <Volume2 className="size-4" />
      테스트 알림 보내기
    </Button>
  );
}
