// user-media 통합 버킷 storage 유틸. 경로(상대) → public URL, MIME → 확장자.
import { USER_MEDIA_BUCKET } from "@/constants/common/storage";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// 허용 이미지 MIME → storage 객체 확장자.
export const USER_MEDIA_IMAGE_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/bmp": "bmp",
};

export function pickImageExtension(mimeType: string): string {
  return USER_MEDIA_IMAGE_EXTENSION[mimeType] ?? "png";
}

// user-media는 public 버킷이라 결정적 URL을 직접 구성한다(클라이언트/서버 공용).
// 경로에 한글·공백이 있을 수 있어 세그먼트별로 인코딩한다.
export function getUserMediaPublicUrl(path: string): string {
  if (!path) {
    return "";
  }
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${SUPABASE_URL}/storage/v1/object/public/${USER_MEDIA_BUCKET}/${encodedPath}`;
}
