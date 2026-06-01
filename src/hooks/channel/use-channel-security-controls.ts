"use client";
// 채널 보안 설정 화면의 클라이언트 상호작용을 관리합니다.

import { rotateChannelSecurityTokenAction } from "@/actions/channel/security";
import { CHANNEL_SECURITY_ROTATE_SUCCESS_DESCRIPTION } from "@/constants/channel/security";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type {
  ChannelSecuritySnapshot,
  ChannelSecurityTokenKind,
  ChannelSecurityUrlPopupSize,
} from "@/types/channel/security";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";
import { useState, useTransition } from "react";

export function useChannelSecurityControls(initialSnapshot: ChannelSecuritySnapshot) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [rotatingKind, setRotatingKind] = useState<ChannelSecurityTokenKind | null>(null);
  const [visibleKinds, setVisibleKinds] = useState<ChannelSecurityTokenKind[]>([]);
  const [isPending, startTransition] = useTransition();

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

    window.open(url, `pixelplay_obs_${popup.width}x${popup.height}`, features);
  };

  const handleToggleVisible = (tokenKind: ChannelSecurityTokenKind) => {
    setVisibleKinds((current) =>
      current.includes(tokenKind)
        ? current.filter((item) => item !== tokenKind)
        : [...current, tokenKind],
    );
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
