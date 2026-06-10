"use client";
// OBS 후원 알림 오버레이의 실시간 후원 표시 상태를 관리합니다.

import { useSpeechSynthesis } from "@/hooks/common/use-speech-synthesis";
import { createClient } from "@/lib/supabase/client";
import type { LiveMessageRow } from "@/types/live/live";
import type {
  LiveDonationAlertAudioSettings,
  LiveDonationAlertOverlayData,
  LiveDonationAlertOverlaySnapshot,
} from "@/types/live/live-donation-alert-overlay";
import { playDonationSound } from "@/utils/channel/donation-sound";
import { buildDonationTtsText } from "@/utils/channel/donation-tts";
import {
  DONATION_ALERT_TEST_EVENT,
  donationAlertTestChannel,
  type DonationAlertTestPayload,
} from "@/utils/live/donation-alert-test";
import { mapLiveMessageToDonationAlert } from "@/utils/live/live-overlay-message";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseLiveDonationAlertOverlayOptions {
  isPreview?: boolean;
}

export function useLiveDonationAlertOverlay(
  initialSnapshot: LiveDonationAlertOverlaySnapshot,
  options?: UseLiveDonationAlertOverlayOptions,
) {
  const { speak, voices } = useSpeechSynthesis();
  const audio = initialSnapshot.audio;
  const isPreview = options?.isPreview ?? false;
  const voicesReady = voices.length > 0;
  const hasPlayedRef = useRef(false);
  const [donation, setDonation] = useState<LiveDonationAlertOverlayData | null>(
    initialSnapshot.donation,
  );
  const [isVisible, setIsVisible] = useState(Boolean(initialSnapshot.donation));
  // 로드/새로고침마다 직전 후원 알림을 재생합니다(OBS 소스 새로고침으로 반복 테스트 가능).
  // 같은 렌더에서 중복 재생되는 것만 막기 위한 용도라 null로 시작합니다.
  const lastPlayedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!initialSnapshot.broadcastId) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`live-donation-alert-overlay:${initialSnapshot.broadcastId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_message",
          filter: `broadcast_id=eq.${initialSnapshot.broadcastId}`,
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
  }, [initialSnapshot.broadcastId, initialSnapshot.creatorId, initialSnapshot.creatorName]);

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

        // 음성 선택은 준비 중이라 기본 음성으로 고정합니다(voiceURI 미지정).
        speak(
          buildDonationTtsText({
            donorNickname: target.donorName,
            amount: target.amount,
            message: target.message,
            amountVisible: audioSettings.amountVisible,
          }),
          {
            rate: audioSettings.ttsRate,
            volume: audioSettings.ttsVolume / 100,
          },
        );
      };

      if (audioSettings.alertSoundEnabled) {
        playDonationSound(audioSettings.alertSoundKey, audioSettings.alertVolume, playTts);
      } else {
        playTts();
      }
    },
    [audio, speak],
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
  useEffect(() => {
    if (!donation || !isVisible || lastPlayedIdRef.current === donation.id) {
      return;
    }

    const play = () => {
      lastPlayedIdRef.current = donation.id;
      hasPlayedRef.current = true;
      playAlert(donation);
    };

    // 첫 재생(로드/새로고침 직후)은 TTS 음성 목록이 아직 로드되지 않아 기본 음성으로 빠질 수 있어,
    // 음성이 준비될 때까지(또는 폴백 시간까지) 기다렸다 재생합니다. 이후 실시간 후원은 즉시 재생합니다.
    if (!hasPlayedRef.current && !voicesReady) {
      const fallbackTimer = window.setTimeout(play, 1200);
      return () => window.clearTimeout(fallbackTimer);
    }

    play();
  }, [donation, isVisible, playAlert, voicesReady]);

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
