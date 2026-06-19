"use client";
// 채널 보안 설정 화면의 클라이언트 상호작용을 관리합니다.

import { rotateChannelSecurityTokenAction } from "@/actions/channel/security";
import {
  CHANNEL_SECURITY_ROTATE_SUCCESS_DESCRIPTION,
  SECURITY_REVEAL_DURATION_MS,
} from "@/constants/channel/security";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type {
  ChannelSecuritySnapshot,
  ChannelSecurityTokenKind,
  ChannelSecurityUrlPopupSize,
} from "@/types/channel/security";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";
import { useEffect, useState, useTransition } from "react";

export function useChannelSecurityControls(initialSnapshot: ChannelSecuritySnapshot) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [rotatingKind, setRotatingKind] = useState<ChannelSecurityTokenKind | null>(null);
  // 노출 중인 토큰별 자동 마스킹 만료 시각(epoch ms). 키 존재 자체가 "노출 중"을 뜻하며,
  // 카운트다운 표시와 만료 시 자동 가림(CSEC-011, 어깨너머·송출 노출 차단)에 함께 쓴다.
  const [revealExpiry, setRevealExpiry] = useState<
    Partial<Record<ChannelSecurityTokenKind, number>>
  >({});
  // 카운트다운(남은 초)을 주기적으로 다시 그리기 위한 틱. 값 자체는 리렌더 트리거 용도로만 쓴다.
  const [, setRevealTick] = useState(0);
  const [isPending, startTransition] = useTransition();

  const hasRevealCountdown = Object.keys(revealExpiry).length > 0;

  // 노출 중인 토큰이 있는 동안 0.5초마다: 남은 시간 표시를 갱신하고 만료된 토큰은 자동으로 다시 가린다.
  // setState를 effect 본문이 아니라 타이머 콜백에서 호출해 cascading 렌더를 피한다.
  useEffect(() => {
    if (!hasRevealCountdown) {
      return;
    }
    const intervalId = setInterval(() => {
      const now = Date.now();
      setRevealExpiry((current) => {
        const remaining: Partial<Record<ChannelSecurityTokenKind, number>> = {};
        let changed = false;
        for (const key of Object.keys(current) as ChannelSecurityTokenKind[]) {
          const expiry = current[key];
          if (expiry !== undefined && expiry > now) {
            remaining[key] = expiry;
          } else {
            // 만료 → remaining에 넣지 않음(= 자동으로 다시 가려짐).
            changed = true;
          }
        }
        return changed ? remaining : current;
      });
      setRevealTick((tick) => tick + 1);
    }, 500);
    return () => clearInterval(intervalId);
  }, [hasRevealCountdown]);

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toastAppSuccess(APP_MESSAGE_CODE.success.channel.securityCopied);
    } catch (error) {
      console.error("채널 보안 정보 복사 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.channel.securityCopyFailed);
    }
  };

  const handlePreview = (url: string, popup: ChannelSecurityUrlPopupSize) => {
    const left = window.screenX + Math.max((window.outerWidth - popup.width) / 2, 0);
    const top = window.screenY + Math.max((window.outerHeight - popup.height) / 2, 0);
    const features = [
      "popup=yes",
      `width=${popup.width}`,
      `height=${popup.height}`,
      `left=${Math.round(left)}`,
      `top=${Math.round(top)}`,
      "resizable=yes",
      "scrollbars=yes",
      "noopener",
      "noreferrer",
    ].join(",");

    // 미리보기는 "직전 알림"을 그대로 한 번 재생(소리 포함)해 확인할 수 있게 preview 플래그를 붙입니다.
    // (실제 OBS 소스는 plain URL을 쓰므로 새로고침마다 직전 알림이 다시 울리지 않습니다.)
    const previewUrl = `${url}${url.includes("?") ? "&" : "?"}preview=1`;

    window.open(previewUrl, `pixelplay_obs_${popup.width}x${popup.height}`, features);
  };

  const handleToggleVisible = (tokenKind: ChannelSecurityTokenKind) => {
    // 노출 중(키 존재)이면 즉시 가리고, 아니면 만료 시각을 찍어 켠다(켜는 순간 카운트다운 시작).
    setRevealExpiry((current) => {
      const next = { ...current };
      if (next[tokenKind] !== undefined) {
        delete next[tokenKind];
      } else {
        next[tokenKind] = Date.now() + SECURITY_REVEAL_DURATION_MS;
      }
      return next;
    });
  };

  const handleRotate = (tokenKind: ChannelSecurityTokenKind, onSuccess?: () => void) => {
    setRotatingKind(tokenKind);
    startTransition(async () => {
      try {
        const result = await rotateChannelSecurityTokenAction(tokenKind);

        if (!result.success || !result.data) {
          toastAppError(result.code ?? APP_MESSAGE_CODE.error.channel.securityTokenRotateFailed);
          return;
        }

        setSnapshot(result.data.snapshot);

        toastAppSuccess(
          result.code ?? APP_MESSAGE_CODE.success.channel.securityTokenRotated,
          CHANNEL_SECURITY_ROTATE_SUCCESS_DESCRIPTION[result.data.tokenKind],
        );
        onSuccess?.();
      } catch (error) {
        console.error("채널 보안 토큰 재발급 요청 실패", error);
        toastAppError(APP_MESSAGE_CODE.error.channel.securityTokenRotateFailed);
      } finally {
        setRotatingKind(null);
      }
    });
  };

  // 노출 중인 토큰의 자동 마스킹까지 남은 초(올림). 노출 중이 아니면 0.
  const getRevealRemaining = (tokenKind: ChannelSecurityTokenKind) => {
    const expiry = revealExpiry[tokenKind];
    if (expiry === undefined) {
      return 0;
    }
    return Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
  };

  return {
    snapshot,
    rotatingKind,
    isPending,
    isRotating: isPending && rotatingKind !== null,
    isVisibleKind: (tokenKind: ChannelSecurityTokenKind) => revealExpiry[tokenKind] !== undefined,
    getRevealRemaining,
    handleCopy,
    handlePreview,
    handleToggleVisible,
    handleRotate,
  };
}
