"use client";
// 현재 알림 설정으로 후원 알림(TTS)을 미리 들어보는 테스트 버튼입니다.

import { Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DONATION_TEST_ALERT_SAMPLE } from "@/constants/channel/donation";
import { useSpeechSynthesis } from "@/hooks/common/use-speech-synthesis";
import { cn } from "@/lib/utils";

interface Props {
  alertEnabled: boolean;
  ttsEnabled: boolean;
  ttsRate: number;
  alertVolume: number;
  disabled?: boolean;
}

export default function DonationTestAlertButton({
  alertEnabled,
  ttsEnabled,
  ttsRate,
  alertVolume,
  disabled,
}: Props) {
  const { isSupported, speak } = useSpeechSynthesis();

  // TTS 미지원 브라우저이거나 알림/TTS가 꺼져 있으면 미리듣기를 막습니다.
  const isPlayable = alertEnabled && ttsEnabled && isSupported && !disabled;

  const handleTest = () => {
    if (!isPlayable) {
      return;
    }

    const { donorNickname, amount, message } = DONATION_TEST_ALERT_SAMPLE;

    speak(`${donorNickname}님이 ${amount.toLocaleString()}포인트를 후원했습니다. ${message}`, {
      rate: ttsRate,
      volume: alertVolume / 100,
    });
  };

  const helperText = !isSupported
    ? "이 브라우저는 음성 읽기를 지원하지 않아요."
    : !alertEnabled
      ? "알림을 켜면 미리 들어볼 수 있어요."
      : !ttsEnabled
        ? "음성 읽기를 켜면 미리 들어볼 수 있어요."
        : "현재 설정한 속도·볼륨으로 후원 알림을 들어봐요.";

  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-xs leading-5">{helperText}</p>
      <Button
        type="button"
        variant="outline"
        disabled={!isPlayable}
        onClick={handleTest}
        className={cn(
          "h-9 shrink-0 rounded-full px-4 text-sm font-bold",
          "border-brand/40 text-brand",
        )}
      >
        <Volume2 className="size-4" />
        테스트 알림 보내기
      </Button>
    </div>
  );
}
