"use client";
// OBS 후원 알림 오버레이의 실시간 후원 표시 상태를 관리합니다.

import { useSpeechSynthesis } from "@/hooks/common/use-speech-synthesis";
import { createClient } from "@/lib/supabase/client";
import type { LiveMessageRow } from "@/types/live/live";
import type {
  LiveDonationAlertOverlayData,
  LiveDonationAlertOverlaySnapshot,
} from "@/types/live/live-donation-alert-overlay";
import { playDonationSound } from "@/utils/channel/donation-sound";
import { buildDonationTtsText } from "@/utils/channel/donation-tts";
import { mapLiveMessageToDonationAlert } from "@/utils/live/live-overlay-message";
import { useEffect, useRef, useState } from "react";

export function useLiveDonationAlertOverlay(initialSnapshot: LiveDonationAlertOverlaySnapshot) {
  const { speak } = useSpeechSynthesis();
  const audio = initialSnapshot.audio;
  const [donation, setDonation] = useState<LiveDonationAlertOverlayData | null>(
    initialSnapshot.donation,
  );
  const [isVisible, setIsVisible] = useState(Boolean(initialSnapshot.donation));
  // 초기 스냅샷의 후원(이전 후원)은 새로고침마다 재생되지 않도록 "이미 재생됨"으로 둡니다.
  const lastPlayedIdRef = useRef<string | null>(initialSnapshot.donation?.id ?? null);

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

  // 새 후원이 표시되면 알림음을 재생한 뒤(끝나면) TTS를 이어서 읽어줍니다.
  useEffect(() => {
    if (!donation || !isVisible || lastPlayedIdRef.current === donation.id) {
      return;
    }

    lastPlayedIdRef.current = donation.id;

    const playTts = () => {
      if (!audio.ttsEnabled) {
        return;
      }

      speak(
        buildDonationTtsText({
          donorNickname: donation.donorName,
          amount: donation.amount,
          message: donation.message,
          amountVisible: audio.amountVisible,
        }),
        {
          rate: audio.ttsRate,
          volume: audio.ttsVolume / 100,
          voiceURI: audio.ttsVoiceUri || undefined,
        },
      );
    };

    if (audio.alertSoundEnabled) {
      playDonationSound(audio.alertSoundKey, audio.alertVolume, playTts);
    } else {
      playTts();
    }
  }, [donation, isVisible, audio, speak]);

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
