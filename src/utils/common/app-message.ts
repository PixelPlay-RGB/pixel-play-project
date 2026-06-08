// 앱 메시지 코드를 실제 사용자 표시 메시지로 변환하는 유틸리티

import { APP_MESSAGE } from "@/constants/common/app-message";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { AppMessageCode } from "@/constants/common/app-message-code";
import type { AppMessage } from "@/types/common/app-message";

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
    errorCode: "PX400",
    code: APP_MESSAGE_CODE.error.chatRoom.invalidInput,
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

const DONATION_RPC_ERROR_CODE_MAP: Array<{
  errorCode: string;
  code: AppMessageCode;
}> = [
  {
    errorCode: "PX401",
    code: APP_MESSAGE_CODE.error.auth.authInfoNotFound,
  },
  {
    errorCode: "PX402",
    code: APP_MESSAGE_CODE.error.live.donationInsufficientBalance,
  },
  {
    errorCode: "PX403",
    code: APP_MESSAGE_CODE.error.live.donationDisabled,
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
  const code = readSupabaseErrorCode(error);

  if (code === "42501") {
    return APP_MESSAGE_CODE.error.supabase.permissionDenied;
  }

  if (code === "PGRST116") {
    return APP_MESSAGE_CODE.error.supabase.dataNotFound;
  }

  return fallbackCode;
}

type RpcErrorCodeMap = Array<{ errorCode: string; code: AppMessageCode }>;

function readSupabaseErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  return (error as SupabaseLikeError).code;
}

// RPC 에러코드 → 앱 메시지 코드 변환의 공통 구현(도메인은 map/fallback만 주입).
function resolveRpcErrorCode(
  error: unknown,
  map: RpcErrorCodeMap,
  fallbackCode: AppMessageCode,
): AppMessageCode {
  const code = readSupabaseErrorCode(error);

  return map.find((item) => item.errorCode === code)?.code ?? fallbackCode;
}

function isKnownRpcError(error: unknown, map: RpcErrorCodeMap): boolean {
  const code = readSupabaseErrorCode(error);

  return map.some((item) => item.errorCode === code);
}

export function resolveChatRoomRpcErrorCode(
  error: unknown,
  fallbackCode: AppMessageCode = APP_MESSAGE_CODE.error.common.unknown,
): AppMessageCode {
  return resolveRpcErrorCode(error, CHAT_ROOM_RPC_ERROR_CODE_MAP, fallbackCode);
}

export function isKnownChatRoomRpcError(error: unknown) {
  return isKnownRpcError(error, CHAT_ROOM_RPC_ERROR_CODE_MAP);
}

export function resolveMessageRpcErrorCode(
  error: unknown,
  fallbackCode: AppMessageCode = APP_MESSAGE_CODE.error.common.unknown,
): AppMessageCode {
  return resolveRpcErrorCode(error, MESSAGE_RPC_ERROR_CODE_MAP, fallbackCode);
}

export function isKnownMessageRpcError(error: unknown) {
  return isKnownRpcError(error, MESSAGE_RPC_ERROR_CODE_MAP);
}

export function resolveDonationRpcErrorCode(
  error: unknown,
  fallbackCode: AppMessageCode = APP_MESSAGE_CODE.error.live.donationFailed,
): AppMessageCode {
  return resolveRpcErrorCode(error, DONATION_RPC_ERROR_CODE_MAP, fallbackCode);
}

export function isKnownDonationRpcError(error: unknown) {
  return isKnownRpcError(error, DONATION_RPC_ERROR_CODE_MAP);
}
