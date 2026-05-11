// 앱 메시지 코드를 실제 사용자 표시 메시지로 변환하는 유틸리티

import { APP_MESSAGE, APP_MESSAGE_CODE } from "@/constants/app-message";
import type { AppMessageCode } from "@/constants/app-message";
import type { AppMessage } from "@/types/app-message";

type AppMessageDomainMap = Record<string, AppMessage>;
type AppMessageTypeMap = Record<string, Record<string, AppMessageDomainMap>>;

interface SupabaseLikeError {
  code?: string;
}

export function getAppMessage(code?: AppMessageCode): AppMessage {
  if (!code) {
    return APP_MESSAGE.error.common.unknown;
  }

  const [type, domain, key] = code.split(".");
  const messageMap = APP_MESSAGE as AppMessageTypeMap;
  const typeMessages = messageMap[type];
  const domainMessages = typeMessages?.[domain];

  return domainMessages?.[key] ?? APP_MESSAGE.error.common.unknown;
}

export function getAppMessageTitle(code?: AppMessageCode): string {
  return getAppMessage(code).title;
}

export function resolveSupabaseErrorCode(
  error: unknown,
  fallbackCode: AppMessageCode = APP_MESSAGE_CODE.error.common.unknown,
): AppMessageCode {
  if (typeof error !== "object" || error === null) {
    return fallbackCode;
  }

  const code = (error as SupabaseLikeError).code;

  if (code === "42501") {
    return APP_MESSAGE_CODE.error.supabase.permissionDenied;
  }

  if (code === "PGRST116") {
    return APP_MESSAGE_CODE.error.supabase.dataNotFound;
  }

  return fallbackCode;
}
