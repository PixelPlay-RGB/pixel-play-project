// 사용자 미디어 통합 storage 버킷. 경로 구조: {userId}/{avatar|banner|live-thumbnail|community|emoticon|subscription}/...
export const USER_MEDIA_BUCKET = "user-media";

// 프로필 아바타 이미지 업로드 용량 제한. user-media/{userId}/avatar/avatar.{ext}에 저장.
export const PROFILE_IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5MB
