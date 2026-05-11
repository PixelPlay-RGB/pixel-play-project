// 앱 메시지 코드를 실제 사용자 표시 메시지로 변환하는 유틸리티

import { APP_MESSAGE } from "@/constants/app-message";
import type {
  AppMessage,
  AppMessageCode,
  AppMessageDomain,
  AppMessageType,
} from "@/types/app-message";

type AppMessageDomainMap = Record<string, AppMessage>;

interface SupabaseLikeError {
  code?: string;
}

export function getAppMessage(code?: AppMessageCode): AppMessage {
  if (!code) {
    return APP_MESSAGE.error.common.unknown;
  }

  const [type, domain, key] = code.split(".") as [AppMessageType, AppMessageDomain, string];
  const typeMessages = APP_MESSAGE[type] as Record<string, AppMessageDomainMap>;
  const domainMessages = typeMessages[domain];

  return domainMessages?.[key] ?? APP_MESSAGE.error.common.unknown;
}

export function getAppMessageTitle(code?: AppMessageCode): string {
  return getAppMessage(code).title;
}

export function resolveSupabaseErrorCode(
  error: unknown,
  fallbackCode: AppMessageCode = "error.common.unknown",
): AppMessageCode {
  if (typeof error !== "object" || error === null) {
    return fallbackCode;
  }

  const code = (error as SupabaseLikeError).code;

  if (code === "42501") {
    return "error.supabase.42501";
  }

  if (code === "PGRST116") {
    return "error.supabase.PGRST116";
  }

  return fallbackCode;
}
