"use client";
// OBS 후원 알림 오버레이의 실시간 후원 표시 상태를 관리합니다.

import { createClient } from "@/lib/supabase/client";
import type { LiveMessageRow } from "@/types/live/live";
import type {
  LiveDonationAlertAudioSettings,
  LiveDonationAlertOverlayData,
  LiveDonationAlertOverlaySnapshot,
} from "@/types/live/live-donation-alert-overlay";
import { playDonationSound } from "@/utils/channel/donation-sound";
import { buildDonationTtsText } from "@/utils/channel/donation-tts";
import { playDonationTts } from "@/utils/channel/donation-tts-player";
import {
  DONATION_ALERT_TEST_EVENT,
  donationAlertTestChannel,
  type DonationAlertTestPayload,
} from "@/utils/live/donation-alert-test";
import { mapLiveMessageToDonationAlert } from "@/utils/live/live-overlay-message";
import { DONATION_TEST_ALERT_SAMPLE } from "@/constants/channel/donation";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseLiveDonationAlertOverlayOptions {
  isPreview?: boolean;
}

export function useLiveDonationAlertOverlay(
  initialSnapshot: LiveDonationAlertOverlaySnapshot,
  options?: UseLiveDonationAlertOverlayOptions,
) {
  const audio = initialSnapshot.audio;
  const isPreview = options?.isPreview ?? false;
  // 미리보기는 방송·후원 이력이 없어도 화면을 보여줘야 하므로 샘플 후원으로 시작한다.
  // (createdAt은 hydration 불일치가 없도록 고정 문자열)
  const initialDonation =
    initialSnapshot.donation ??
    (isPreview
      ? {
          id: "preview-sample-donation",
          creatorName: initialSnapshot.creatorName,
          donorName: DONATION_TEST_ALERT_SAMPLE.donorNickname,
          amount: audio.amountVisible ? DONATION_TEST_ALERT_SAMPLE.amount : null,
          message: DONATION_TEST_ALERT_SAMPLE.message,
          createdAt: "2026-01-01T00:00:00.000Z",
        }
      : null);
  const [donation, setDonation] = useState<LiveDonationAlertOverlayData | null>(initialDonation);
  const [isVisible, setIsVisible] = useState(Boolean(initialDonation));
  // 로드/새로고침마다 직전 후원 알림을 재생합니다(OBS 소스 새로고침으로 반복 테스트 가능).
  // 같은 렌더에서 중복 재생되는 것만 막기 위한 용도라 null로 시작합니다.
  const lastPlayedIdRef = useRef<string | null>(null);

  // 후원은 채널 단위(#111) — 방송 중이 아니어도 채널 후원 알림을 실시간으로 받는다.
  useEffect(() => {
    if (!initialSnapshot.creatorId) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`live-donation-alert-overlay:${initialSnapshot.creatorId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_message",
          filter: `creator_id=eq.${initialSnapshot.creatorId}`,
        },
        (payload) => {
          const message = payload.new as LiveMessageRow;

          if (message.message_type !== "donation") {
            return;
          }

          const nextDonation = mapLiveMessageToDonationAlert(message, {
            creatorId: initialSnapshot.creatorId,
            creatorName: initialSnapshot.creatorName,
          });

          if (nextDonation) {
            setDonation(nextDonation);
            setIsVisible(true);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [initialSnapshot.creatorId, initialSnapshot.creatorName]);

  // 알림음을 재생한 뒤(끝나면) TTS를 이어서 읽어줍니다.
  // audioSettings를 넘기면 그 설정으로 재생합니다(테스트 후원: 현재 설정값으로 재생).
  const playAlert = useCallback(
    (
      target: LiveDonationAlertOverlayData,
      audioSettings: LiveDonationAlertAudioSettings = audio,
    ) => {
      const playTts = () => {
        if (!audioSettings.ttsEnabled) {
          return;
        }

        playDonationTts(
          buildDonationTtsText({
            donorNickname: target.donorName,
            amount: target.amount,
            message: target.message,
            amountVisible: audioSettings.amountVisible,
          }),
          {
            voiceName: audioSettings.ttsVoiceUri || undefined,
            rate: audioSettings.ttsRate,
            volume: audioSettings.ttsVolume / 100,
            onError: (error) => {
              console.warn("후원 오버레이 TTS 재생 실패", error);
            },
          },
        );
      };

      if (audioSettings.alertSoundEnabled) {
        playDonationSound(audioSettings.alertSoundKey, audioSettings.alertVolume, playTts);
      } else {
        playTts();
      }
    },
    [audio],
  );

  // 테스트 후원(ephemeral): 설정 페이지에서 보낸 broadcast를 받아 1회 알림을 재생합니다.
  // DB에 남지 않고, 전달된 설정값(현재 설정)으로 재생합니다.
  useEffect(() => {
    if (!initialSnapshot.creatorId) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(donationAlertTestChannel(initialSnapshot.creatorId))
      .on("broadcast", { event: DONATION_ALERT_TEST_EVENT }, ({ payload }) => {
        const data = payload as DonationAlertTestPayload;
        const testDonation: LiveDonationAlertOverlayData = {
          id: `test-${Date.now()}`,
          creatorName: initialSnapshot.creatorName,
          donorName: data.donorName,
          amount: data.amount,
          message: data.message,
          createdAt: new Date().toISOString(),
        };

        // donation 효과의 중복 재생을 막고, 전달된 설정으로 직접 재생합니다.
        lastPlayedIdRef.current = testDonation.id;
        setDonation(testDonation);
        setIsVisible(true);
        playAlert(testDonation, data.audio);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [initialSnapshot.creatorId, initialSnapshot.creatorName, playAlert]);

  // 후원이 표시되면(로드/새로고침 시 초기 후원 포함) 알림 오디오를 재생합니다.
  // 서버 합성 TTS는 Web Speech처럼 음성 목록 로드를 기다릴 필요가 없어 즉시 재생합니다.
  useEffect(() => {
    if (!donation || !isVisible || lastPlayedIdRef.current === donation.id) {
      return;
    }

    lastPlayedIdRef.current = donation.id;
    playAlert(donation);
  }, [donation, isVisible, playAlert]);

  // 미리보기에서는 브라우저 자동재생이 막혀도 화면을 클릭하면 알림 오디오를 다시 재생합니다.
  useEffect(() => {
    if (!isPreview) {
      return;
    }

    const handlePointerDown = () => {
      if (donation) {
        setIsVisible(true);
        playAlert(donation);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isPreview, donation, playAlert]);

  useEffect(() => {
    if (!donation || !isVisible) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setIsVisible(false);
    }, initialSnapshot.alertVisibleMs);

    return () => window.clearTimeout(timerId);
  }, [donation, initialSnapshot.alertVisibleMs, isVisible]);

  return {
    donation,
    isVisible,
  };
}
