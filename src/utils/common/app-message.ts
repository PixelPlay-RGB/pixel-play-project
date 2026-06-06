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
    errorCode: "PX403",
    code: APP_MESSAGE_CODE.error.message.sendForbidden,
  },
  {
    errorCode: "PX404",
    code: APP_MESSAGE_CODE.error.chatRoom.notFound,
  },
  {
    errorCode: "PX422",
    code: APP_MESSAGE_CODE.error.message.linkBlocked,
  },
  {
    errorCode: "PX423",
    code: APP_MESSAGE_CODE.error.chatRoom.isKicked,
  },
  {
    // 채팅 규칙 미동의 — 정상적으로는 클라가 먼저 규칙 팝오버로 막지만 경합 시 방어한다.
    errorCode: "PX428",
    code: APP_MESSAGE_CODE.error.message.sendForbidden,
  },
  {
    // 슬로우모드 — 실시간 채팅에서 정상 거부이므로 실패가 아닌 안내로 다룬다.
    errorCode: "PX429",
    code: APP_MESSAGE_CODE.error.message.slowMode,
  },
  {
    errorCode: "PX461",
    code: APP_MESSAGE_CODE.error.message.sendForbidden,
  },
];

// 후원 RPC(send_live_donation)의 sqlstate를 사용자 메시지 코드로 매핑한다.
const DONATION_RPC_ERROR_CODE_MAP: Array<{
  errorCode: string;
  code: AppMessageCode;
}> = [
  {
    errorCode: "PX400",
    code: APP_MESSAGE_CODE.error.live.donationInvalid,
  },
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
  {
    errorCode: "PX409",
    code: APP_MESSAGE_CODE.error.live.donationDuplicate,
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
