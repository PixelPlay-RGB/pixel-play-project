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
import { useEffect, useRef, useState, useTransition } from "react";

export function useChannelSecurityControls(initialSnapshot: ChannelSecuritySnapshot) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [rotatingKind, setRotatingKind] = useState<ChannelSecurityTokenKind | null>(null);
  const [visibleKinds, setVisibleKinds] = useState<ChannelSecurityTokenKind[]>([]);
  const [isPending, startTransition] = useTransition();
  // 노출 후 자동 마스킹 타이머(어깨너머 노출 차단, CSEC-011) — 토큰별로 따로 건다.
  const hideTimersRef = useRef(new Map<ChannelSecurityTokenKind, ReturnType<typeof setTimeout>>());

  // 언마운트 시 떠 있는 자동 숨김 타이머를 모두 정리한다.
  useEffect(() => {
    const timers = hideTimersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

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
    const timers = hideTimersRef.current;
    const existing = timers.get(tokenKind);
    if (existing) {
      clearTimeout(existing);
      timers.delete(tokenKind);
    }

    if (visibleKinds.includes(tokenKind)) {
      setVisibleKinds((current) => current.filter((item) => item !== tokenKind));
      return;
    }

    setVisibleKinds((current) => [...current, tokenKind]);
    // 보기로 켜면 일정 시간 뒤 자동으로 다시 가린다(복사 버튼이 있어 길게 노출할 필요가 없다).
    const timer = setTimeout(() => {
      setVisibleKinds((current) => current.filter((item) => item !== tokenKind));
      timers.delete(tokenKind);
    }, SECURITY_REVEAL_DURATION_MS);
    timers.set(tokenKind, timer);
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

  return {
    snapshot,
    rotatingKind,
    isPending,
    isRotating: isPending && rotatingKind !== null,
    isVisibleKind: (tokenKind: ChannelSecurityTokenKind) => visibleKinds.includes(tokenKind),
    handleCopy,
    handlePreview,
    handleToggleVisible,
    handleRotate,
  };
}
