// 채널 이모지(구독티콘) 도메인 타입을 정의합니다.

// 화면용 — get_channel_emojis jsonb를 정규화한 형태(image_path → public URL).
export interface ChannelEmoji {
  id: string;
  imageUrl: string;
  name: string;
  sortOrder: number;
}
