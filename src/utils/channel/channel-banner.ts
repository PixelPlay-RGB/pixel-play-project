// 채널 배너 이미지 경로(storage path) → public URL 변환 유틸.
// channel-media 버킷은 public이라 결정적 URL을 직접 구성합니다(클라이언트/서버 공용).

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const BANNER_BUCKET = "channel-media";

// 허용 이미지 MIME → storage 객체 확장자.
const BANNER_MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/bmp": "bmp",
};

// storage 객체 이름을 배너 제목 기반으로 생성(UUID 대신). 충돌 방지를 위해 짧은 접미사만 덧붙인다.
// 한글 제목은 그대로 유지하고 경로/특수문자만 제거한다(공개 URL은 getChannelBannerSrc에서 세그먼트 인코딩).
// 확장자는 파일명이 아니라 검증된 MIME 타입에서 결정해 오확장자를 막는다.
export function buildBannerObjectName(title: string, mimeType: string): string {
  const ext = BANNER_MIME_EXTENSION[mimeType] ?? "png";
  const base =
    title
      .trim()
      .replace(/[\\/]+/g, " ")
      .replace(/\s+/g, "-")
      .replace(/[^\p{L}\p{N}_-]/gu, "")
      .replace(/-+/g, "-")
      .replace(/^[-_]+|[-_]+$/g, "")
      .slice(0, 40) || "banner";
  return `${base}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
}

export function getChannelBannerSrc(imagePath: string): string {
  if (!imagePath) {
    return "";
  }
  // 이미 완전한 URL이면 그대로 사용(방어적).
  if (/^https?:\/\//.test(imagePath)) {
    return imagePath;
  }
  // 객체 이름이 제목 기반(한글·공백 가능)이므로 세그먼트별로 인코딩한다.
  const encodedPath = imagePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${SUPABASE_URL}/storage/v1/object/public/${BANNER_BUCKET}/${encodedPath}`;
}
