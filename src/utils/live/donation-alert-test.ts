// 테스트 후원 알림(ephemeral)을 Supabase Realtime Broadcast로 오버레이에 전송합니다.
// DB에 남지 않고, 시청자에게도 보이지 않으며, 정산/통계에도 잡히지 않습니다.

import { createClient } from "@/lib/supabase/client";
import type { LiveDonationAlertAudioSettings } from "@/types/live/live-donation-alert-overlay";

export const DONATION_ALERT_TEST_EVENT = "test_donation";
const TEST_DONATION_CHANNEL_TIMEOUT_MS = 5000;
const TEST_DONATION_CHANNEL_CLEANUP_DELAY_MS = 1000;

// 크리에이터별 전용 테스트 채널. 설정 페이지(전송)와 후원 알림 오버레이(수신)가 함께 구독합니다.
export function donationAlertTestChannel(creatorId: string): string {
  return `donation-alert-test:${creatorId}`;
}

export interface DonationAlertTestPayload {
  donorName: string;
  amount: number;
  message: string;
  audio: LiveDonationAlertAudioSettings;
}

// 테스트 후원 알림을 오버레이로 1회 전송합니다.
export async function sendTestDonationAlert(
  creatorId: string,
  payload: DonationAlertTestPayload,
): Promise<void> {
  const supabase = createClient();
  const channel = supabase.channel(donationAlertTestChannel(creatorId), {
    config: {
      broadcast: {
        ack: true,
      },
    },
  });
  let shouldDelayCleanup = false;
  // window.setTimeout(브라우저)은 number 핸들을 반환한다(@types/node의 Timeout과 구분).
  let subscribeTimeoutId: number | undefined;

  try {
    const subscribePromise = new Promise<void>((resolve, reject) => {
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          resolve();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          reject(new Error(`테스트 후원 채널 구독 실패: ${status}`));
        }
      });
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      subscribeTimeoutId = window.setTimeout(() => {
        reject(new Error("테스트 후원 채널 구독 시간이 초과되었습니다."));
      }, TEST_DONATION_CHANNEL_TIMEOUT_MS);
    });

    try {
      await Promise.race([subscribePromise, timeoutPromise]);
    } finally {
      if (subscribeTimeoutId !== undefined) {
        window.clearTimeout(subscribeTimeoutId);
      }
    }

    const sendStatus = await channel.send({
      type: "broadcast",
      event: DONATION_ALERT_TEST_EVENT,
      payload,
    });

    if (sendStatus !== "ok") {
      throw new Error(`테스트 후원 전송 실패: ${sendStatus}`);
    }

    shouldDelayCleanup = true;
  } finally {
    if (shouldDelayCleanup) {
      // 전송 후 채널 정리(전송이 전달될 시간을 약간 둠).
      window.setTimeout(() => {
        void supabase.removeChannel(channel);
      }, TEST_DONATION_CHANNEL_CLEANUP_DELAY_MS);
    } else {
      void supabase.removeChannel(channel);
    }
  }
}
