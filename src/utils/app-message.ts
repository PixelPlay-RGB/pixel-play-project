// 앱 메시지 코드를 실제 사용자 표시 메시지로 변환하는 유틸리티

import { APP_MESSAGE } from "@/constants/app-message";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import type { AppMessageCode } from "@/constants/app-message-code";
import type { AppMessage } from "@/types/app-message";

type AppMessageDomainMap = Record<string, AppMessage>;
type AppMessageTypeMap = Record<string, Record<string, AppMessageDomainMap>>;

interface SupabaseLikeError {
  code?: string;
  message?: string;
}

const CHAT_ROOM_RPC_ERROR_CODE_MAP: Array<{
  errorCode: string;
  code: AppMessageCode;
}> = [
  {
    errorCode: "PX401",
    code: APP_MESSAGE_CODE.error.auth.authInfoNotFound,
  },
  {
    errorCode: "PX404",
    code: APP_MESSAGE_CODE.error.chatRoom.notFound,
  },
  {
    errorCode: "PX409",
    code: APP_MESSAGE_CODE.error.chatRoom.full,
  },
  {
    errorCode: "PX423",
    code: APP_MESSAGE_CODE.error.chatRoom.isKicked,
  },
  {
    errorCode: "PX460",
    code: APP_MESSAGE_CODE.error.chatRoom.leaveOwnerBlocked,
  },
  {
    errorCode: "PX461",
    code: APP_MESSAGE_CODE.error.chatRoom.notActiveMember,
  },
  {
    errorCode: "PX462",
    code: APP_MESSAGE_CODE.error.chatRoomMember.notOwner,
  },
  {
    errorCode: "PX463",
    code: APP_MESSAGE_CODE.error.chatRoomMember.ownerCannotKickSelf,
  },
  {
    errorCode: "PX464",
    code: APP_MESSAGE_CODE.error.chatRoomMember.targetNotActive,
  },
  {
    errorCode: "PX465",
    code: APP_MESSAGE_CODE.error.chatRoomMember.ownerCannotTransferSelf,
  },
  {
    errorCode: "PX466",
    code: APP_MESSAGE_CODE.error.chatRoomMember.ownerTransferFailed,
  },
];

const MESSAGE_RPC_ERROR_CODE_MAP: Array<{
  errorCode: string;
  code: AppMessageCode;
}> = [
  {
    errorCode: "PX400",
    code: APP_MESSAGE_CODE.error.message.invalidInput,
  },
  {
    errorCode: "PX401",
    code: APP_MESSAGE_CODE.error.auth.authInfoNotFound,
  },
  {
    errorCode: "PX404",
    code: APP_MESSAGE_CODE.error.chatRoom.notFound,
  },
  {
    errorCode: "PX423",
    code: APP_MESSAGE_CODE.error.chatRoom.isKicked,
  },
  {
    errorCode: "PX461",
    code: APP_MESSAGE_CODE.error.message.sendForbidden,
  },
];

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

export function resolveChatRoomRpcErrorCode(
  error: unknown,
  fallbackCode: AppMessageCode = APP_MESSAGE_CODE.error.common.unknown,
): AppMessageCode {
  if (typeof error !== "object" || error === null) {
    return fallbackCode;
  }

  const code = (error as SupabaseLikeError).code;

  return CHAT_ROOM_RPC_ERROR_CODE_MAP.find((item) => item.errorCode === code)?.code ?? fallbackCode;
}

export function isKnownChatRoomRpcError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const code = (error as SupabaseLikeError).code;

  return CHAT_ROOM_RPC_ERROR_CODE_MAP.some((item) => item.errorCode === code);
}

export function resolveMessageRpcErrorCode(
  error: unknown,
  fallbackCode: AppMessageCode = APP_MESSAGE_CODE.error.common.unknown,
): AppMessageCode {
  if (typeof error !== "object" || error === null) {
    return fallbackCode;
  }

  const code = (error as SupabaseLikeError).code;

  return MESSAGE_RPC_ERROR_CODE_MAP.find((item) => item.errorCode === code)?.code ?? fallbackCode;
}

export function isKnownMessageRpcError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const code = (error as SupabaseLikeError).code;

  return MESSAGE_RPC_ERROR_CODE_MAP.some((item) => item.errorCode === code);
}
