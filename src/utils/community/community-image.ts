// 커뮤니티 게시글 첨부 이미지의 storage 경로를 생성한다(단일 이미지).
import { pickImageExtension } from "@/utils/storage/user-media";

// user-media/{userId}/community/{uuid}.{ext}
export function buildCommunityImagePath(userId: string, mimeType: string): string {
  return `${userId}/community/${crypto.randomUUID()}.${pickImageExtension(mimeType)}`;
}
