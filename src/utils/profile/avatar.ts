// 아바타 대체 텍스트를 생성하는 유틸리티
export const DEFAULT_AVATAR_SRC = "/default-avatar.webp";

export const getAvatarImageSrc = (photoUrl?: string | null) => photoUrl || DEFAULT_AVATAR_SRC;

export const getAvatarFallbackText = (value: string, length = 2) =>
  value.slice(0, length).toUpperCase();
