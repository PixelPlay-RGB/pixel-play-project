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

const RPC_ERROR_MESSAGE_CODE_MAP: Array<{
  pattern: string;
  code: AppMessageCode;
}> = [
  {
    pattern: "owner cannot leave",
    code: APP_MESSAGE_CODE.error.chatRoom.leaveOwnerBlocked,
  },
  {
    pattern: "target is not an active member",
    code: APP_MESSAGE_CODE.error.chatRoomMember.targetNotActive,
  },
  {
    pattern: "only owner can kick members",
    code: APP_MESSAGE_CODE.error.chatRoomMember.notOwner,
  },
  {
    pattern: "only owner can transfer ownership",
    code: APP_MESSAGE_CODE.error.chatRoomMember.notOwner,
  },
  {
    pattern: "owner cannot kick self",
    code: APP_MESSAGE_CODE.error.chatRoomMember.ownerCannotKickSelf,
  },
  {
    pattern: "owner cannot transfer to self",
    code: APP_MESSAGE_CODE.error.chatRoomMember.ownerCannotTransferSelf,
  },
  {
    pattern: "owner transfer failed",
    code: APP_MESSAGE_CODE.error.chatRoomMember.ownerTransferFailed,
  },
  {
    pattern: "not an active member",
    code: APP_MESSAGE_CODE.error.chatRoom.notActiveMember,
  },
  {
    pattern: "not a member",
    code: APP_MESSAGE_CODE.error.chatRoom.notMember,
  },
  {
    pattern: "room not found",
    code: APP_MESSAGE_CODE.error.chatRoom.notFound,
  },
  {
    pattern: "not authenticated",
    code: APP_MESSAGE_CODE.error.auth.authInfoNotFound,
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

export function resolveRpcErrorCode(
  error: unknown,
  fallbackCode: AppMessageCode = APP_MESSAGE_CODE.error.common.unknown,
): AppMessageCode {
  if (typeof error !== "object" || error === null) {
    return fallbackCode;
  }

  const message = (error as SupabaseLikeError).message?.toLowerCase();

  if (!message) {
    return fallbackCode;
  }

  return (
    RPC_ERROR_MESSAGE_CODE_MAP.find(({ pattern }) => message.includes(pattern))?.code ??
    fallbackCode
  );
}
