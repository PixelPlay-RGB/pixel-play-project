"use client";

// 앱 메시지 코드를 Sonner toast로 출력하는 클라이언트 유틸리티

import { toast } from "sonner";

import { getAppMessage } from "@/utils/app-message";
import type { AppMessageCode } from "@/constants/app-message";

export function toastAppSuccess(code: AppMessageCode, description?: string) {
  const message = getAppMessage(code);

  toast.success(message.title, {
    description: description ?? message.description,
  });
}

export function toastAppError(code: AppMessageCode, description?: string) {
  const message = getAppMessage(code);

  toast.error(message.title, {
    description: description ?? message.description,
  });
}
