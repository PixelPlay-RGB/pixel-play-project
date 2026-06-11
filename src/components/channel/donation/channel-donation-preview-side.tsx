"use client";
// 후원 설정 사이드 컬럼 — 알림 미리보기, OBS 테스트 전송, 적용 가이드를 렌더링합니다.

import { useState } from "react";
import { HandCoins, Send } from "lucide-react";
import { useWatch, type Control } from "react-hook-form";

import DonationAlertPreview from "@/components/channel/donation/donation-alert-preview";
import DonationTestAlertButton from "@/components/channel/donation/donation-test-alert-button";
import { HintNote } from "@/components/common/hint-note";
import { SettingsCard } from "@/components/common/settings-card";
import { SideTipCard, SideTipStep } from "@/components/common/side-tip-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DONATION_TEST_ALERT_SAMPLE } from "@/constants/channel/donation";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { ChannelDonationSettingsInput } from "@/lib/zod/channel-donation";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";
import { sendTestDonationAlert } from "@/utils/live/donation-alert-test";

interface Props {
  control: Control<ChannelDonationSettingsInput>;
  creatorId: string;
  isSaving: boolean;
}

export function ChannelDonationPreviewSide({ control, creatorId, isSaving }: Props) {
  const [isSendingTest, setIsSendingTest] = useState(false);

  const amountVisible = useWatch({ control, name: "donationAmountVisible" });
  const alertSoundEnabled = useWatch({ control, name: "alertSoundEnabled" });
  const alertSoundKey = useWatch({ control, name: "alertSoundKey" });
  const ttsEnabled = useWatch({ control, name: "ttsEnabled" });
  const ttsRate = useWatch({ control, name: "ttsRate" });
  const alertVolume = useWatch({ control, name: "alertVolume" });
  const ttsVolume = useWatch({ control, name: "ttsVolume" });
  const ttsVoiceUri = useWatch({ control, name: "ttsVoiceUri" });

  // 현재 설정 그대로 OBS 후원 알림 오버레이에 테스트 후원을 전송합니다(DB·방송 무관, 통계 미반영).
  const handleSendTestToObs = async () => {
    setIsSendingTest(true);

    try {
      const { donorNickname, amount, message } = DONATION_TEST_ALERT_SAMPLE;

      await sendTestDonationAlert(creatorId, {
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
          방송 중이 아니어도 테스트 후원이 실제 OBS 소스에 떠요.
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
          description={`OBS 후원 알림 오버레이 주소는 방송 연결 페이지에서 확인할 수 있어요.\n표시 시간은 오버레이에 그대로 적용돼요.`}
        />
      </SideTipCard>
    </div>
  );
}
