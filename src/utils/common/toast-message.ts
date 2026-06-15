"use client";
// 앱 메시지 코드를 Sonner toast로 출력하는 클라이언트 유틸리티

import { toast } from "sonner";

import type { AppMessageCode } from "@/constants/common/app-message-code";
import { getAppMessage } from "@/utils/common/app-message";

export function toastAppSuccess(
  code: AppMessageCode,
  description?: string,
  // Sonner 네이티브 action — 완료 토스트에 이동 버튼(예: 클립 보기)을 붙일 때 쓴다.
  action?: { label: string; onClick: () => void },
) {
  const message = getAppMessage(code);

  toast.success(message.title, {
    description: description ?? message.description,
    action,
  });
}

export function toastAppError(code: AppMessageCode, description?: string) {
  const message = getAppMessage(code);

  toast.error(message.title, {
    description: description ?? message.description,
  });
}

export function toastAppInfo(code: AppMessageCode, description?: string) {
  const message = getAppMessage(code);

  toast.info(message.title, {
    description: description ?? message.description,
  });
}
