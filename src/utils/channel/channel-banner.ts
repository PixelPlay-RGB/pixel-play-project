// 채널 배너 이미지의 storage 객체 이름 생성 + 경로 → public URL 변환.
import { getUserMediaPublicUrl, pickImageExtension } from "@/utils/storage/user-media";

// storage 객체 이름을 배너 제목 기반으로 생성(UUID 대신). 충돌 방지를 위해 짧은 접미사만 덧붙인다.
// Supabase storage 객체 키는 비ASCII(한글 등)를 허용하지 않으므로 ASCII 슬러그로 정규화한다.
// ASCII가 남지 않으면(예: 순수 한글 제목) "banner"로 폴백한다.
// 확장자는 파일명이 아니라 검증된 MIME 타입에서 결정해 오확장자를 막는다.
export function buildBannerObjectName(title: string, mimeType: string): string {
  const base =
    title
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "banner";
  return `${base}-${crypto.randomUUID().slice(0, 8)}.${pickImageExtension(mimeType)}`;
}

// image_path(상대 경로) → user-media public URL. (공용 빌더 위임)
export function getChannelBannerSrc(imagePath: string): string {
  return getUserMediaPublicUrl(imagePath);
}
