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
  className?: string;
}

export default function DonationTestAlertButton({
  alertEnabled,
  ttsEnabled,
  ttsRate,
  alertVolume,
  disabled,
  className,
}: Props) {
  const { isSupported, speak } = useSpeechSynthesis();

  const isPlayable = alertEnabled && ttsEnabled && isSupported && !disabled;

  const title = !isSupported
    ? "이 브라우저는 음성 읽기를 지원하지 않아요."
    : !alertEnabled
      ? "알림을 켜면 미리 들어볼 수 있어요."
      : !ttsEnabled
        ? "음성 읽기를 켜면 미리 들어볼 수 있어요."
        : undefined;

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

  return (
    <Button
      type="button"
      disabled={!isPlayable}
      onClick={handleTest}
      title={title}
      className={cn(
        "h-10 rounded-xl px-5 font-bold",
        "bg-brand hover:bg-brand/90 shadow-brand/20 text-white shadow-sm",
        className,
      )}
    >
      <Volume2 className="size-4" />
      테스트 알림 보내기
    </Button>
  );
}
