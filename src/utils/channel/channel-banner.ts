// 채널 배너 이미지 경로(storage path) → public URL 변환 유틸.
// channel-media 버킷은 public이라 결정적 URL을 직접 구성합니다(클라이언트/서버 공용).

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const BANNER_BUCKET = "channel-media";

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
