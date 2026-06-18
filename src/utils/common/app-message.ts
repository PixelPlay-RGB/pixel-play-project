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
    errorCode: "PX451",
    code: APP_MESSAGE_CODE.error.message.banned,
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

// 클립 RPC(create_live_clip)의 sqlstate를 사용자 메시지 코드로 매핑한다.
const CLIP_RPC_ERROR_CODE_MAP: Array<{
  errorCode: string;
  code: AppMessageCode;
}> = [
  {
    errorCode: "PX400",
    code: APP_MESSAGE_CODE.error.clip.createFailed,
  },
  {
    errorCode: "PX401",
    code: APP_MESSAGE_CODE.error.auth.authInfoNotFound,
  },
  {
    // 활성 방송 없음 — 시청 중 방송이 끝난 직후 요청하는 경합 케이스.
    errorCode: "PX404",
    code: APP_MESSAGE_CODE.error.clip.noBroadcast,
  },
  {
    // 채널당 보관 상한(30개) 도달 — 정책상 생성 차단(삭제 없음).
    errorCode: "PX413",
    code: APP_MESSAGE_CODE.error.clip.channelFull,
  },
  {
    // 방송 시작 직후 — 버퍼에 요청 길이만큼의 영상이 아직 없다.
    errorCode: "PX425",
    code: APP_MESSAGE_CODE.error.clip.tooEarly,
  },
  {
    errorCode: "PX429",
    code: APP_MESSAGE_CODE.error.clip.rateLimited,
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

export function resolveClipRpcErrorCode(
  error: unknown,
  fallbackCode: AppMessageCode = APP_MESSAGE_CODE.error.clip.createFailed,
): AppMessageCode {
  return resolveRpcErrorCode(error, CLIP_RPC_ERROR_CODE_MAP, fallbackCode);
}

export function isKnownClipRpcError(error: unknown) {
  return isKnownRpcError(error, CLIP_RPC_ERROR_CODE_MAP);
}

// 클립 삭제 RPC(delete_live_clip)의 sqlstate 매핑 — create와 PX코드 의미가 달라(PX404=클립 없음,
// PX403=권한 없음) 별도 맵을 둔다(create 맵의 PX404=noBroadcast를 재사용하면 안 됨).
const CLIP_DELETE_RPC_ERROR_CODE_MAP: RpcErrorCodeMap = [
  {
    errorCode: "PX401",
    code: APP_MESSAGE_CODE.error.auth.authInfoNotFound,
  },
  {
    errorCode: "PX403",
    code: APP_MESSAGE_CODE.error.supabase.permissionDenied,
  },
  {
    errorCode: "PX404",
    code: APP_MESSAGE_CODE.error.clip.notFound,
  },
];

export function resolveClipDeleteRpcErrorCode(
  error: unknown,
  fallbackCode: AppMessageCode = APP_MESSAGE_CODE.error.clip.deleteFailed,
): AppMessageCode {
  return resolveRpcErrorCode(error, CLIP_DELETE_RPC_ERROR_CODE_MAP, fallbackCode);
}

export function isKnownClipDeleteRpcError(error: unknown) {
  return isKnownRpcError(error, CLIP_DELETE_RPC_ERROR_CODE_MAP);
}
