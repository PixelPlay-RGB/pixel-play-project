// 라이브 스트림키와 OBS 오버레이 보안 key를 생성합니다.
import "server-only";

import { createHmac } from "crypto";

const LIVE_STREAM_KEY_LENGTH = 40;
const LIVE_OVERLAY_KEY_LENGTH = 32;

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

function readLiveOverlayTokenSecret() {
  const secret = process.env.LIVE_OVERLAY_TOKEN_SECRET;

  if (!secret) {
    throw new Error("LIVE_OVERLAY_TOKEN_SECRET 환경변수가 필요합니다.");
  }

  return secret;
}
