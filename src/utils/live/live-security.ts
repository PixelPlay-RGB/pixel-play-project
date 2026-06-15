// 라이브 스트림키와 OBS 오버레이 보안 key를 생성합니다.
import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

import { isUuid } from "@/utils/common/uuid";

const LIVE_STREAM_KEY_LENGTH = 40;
const LIVE_OVERLAY_KEY_LENGTH = 32;
// hex 문자 32개 = 128비트 — 위조 방어에 충분하다(더 줄이지 말 것).
const LIVE_ANON_VIEWER_SIGNATURE_LENGTH = 32;
// 검증 시 서명이 정확히 이 형식(소문자 hex N자)인지 먼저 거른다(timingSafeEqual throw 방지).
const ANON_VIEWER_SIGNATURE_REGEX = new RegExp(`^[0-9a-f]{${LIVE_ANON_VIEWER_SIGNATURE_LENGTH}}$`);

export function buildLiveStreamKey(creatorId: string, version: number) {
  const secret = readLiveOverlayTokenSecret();
  const token = createHmac("sha256", secret)
    .update(`stream:${creatorId}:${version}`)
    .digest("hex")
    .slice(0, LIVE_STREAM_KEY_LENGTH);

  return `pp_live_${token}`;
}

export function buildLiveOverlayKey(kind: "chat" | "donation", creatorId: string, version: number) {
  const secret = readLiveOverlayTokenSecret();

  return createHmac("sha256", secret)
    .update(`${kind}:${creatorId}:${version}`)
    .digest("hex")
    .slice(0, LIVE_OVERLAY_KEY_LENGTH);
}

// 익명 시청자 식별 쿠키(pp_anon_viewer)의 서명 — 값은 `<uuid>.<서명>` 형태로 클라이언트에
// 전달되며, 서버만 시크릿을 알기에 클라이언트가 임의의 익명 신원을 위조할 수 없다(#97 A 트랙).
export function signAnonViewerKey(uuid: string): string {
  const secret = readLiveOverlayTokenSecret();

  return createHmac("sha256", secret)
    .update(`anon-viewer:${uuid}`)
    .digest("hex")
    .slice(0, LIVE_ANON_VIEWER_SIGNATURE_LENGTH);
}

// 쿠키 값(`<uuid>.<서명>`)을 검증해 유효하면 uuid를, 변조·형식 오류면 null을 반환한다.
export function verifyAnonViewerKey(cookieValue: string): string | null {
  const separatorIndex = cookieValue.lastIndexOf(".");
  if (separatorIndex <= 0) return null;

  const uuid = cookieValue.slice(0, separatorIndex);
  const signature = cookieValue.slice(separatorIndex + 1);

  if (!isUuid(uuid)) return null;

  // 서명은 항상 소문자 hex 32자다. 형식을 먼저 검증해 거른다 — 이렇게 하면 두 utf8 버퍼의
  // 바이트 길이가 반드시 같아져, 멀티바이트 문자로 코드유닛 길이만 맞춘 변조에도 timingSafeEqual이
  // throw하지 않는다(문자열 길이 비교만으론 바이트 길이 불일치를 못 걸러 RangeError가 날 수 있다).
  if (!ANON_VIEWER_SIGNATURE_REGEX.test(signature)) return null;

  const expected = signAnonViewerKey(uuid);

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  return uuid;
}

function readLiveOverlayTokenSecret() {
  const secret = process.env.LIVE_OVERLAY_TOKEN_SECRET;

  if (!secret) {
    throw new Error("LIVE_OVERLAY_TOKEN_SECRET 환경변수가 필요합니다.");
  }

  return secret;
}
