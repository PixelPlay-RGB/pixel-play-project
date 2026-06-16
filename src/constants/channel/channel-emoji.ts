// 채널 이모지(구독티콘) 정책·라벨 상수를 정의합니다.

// insert_channel_emoji RPC의 검증과 동일해야 한다(채널당 ≤10, 이름 1~20자).
export const CHANNEL_EMOJI_MAX = 10;
export const CHANNEL_EMOJI_NAME_MAX = 20;
export const CHANNEL_EMOJI_MAX_SIZE = 5 * 1024 * 1024; // 5MB
export const CHANNEL_EMOJI_ALLOWED_TYPES = ["image/png"];
export const CHANNEL_EMOJI_ACCEPT = "image/png";

export const CHANNEL_EMOJI_LABEL = {
  kicker: "구독 · 이모지",
  title: "채널 이모지",
  description:
    "구독자가 채팅에서 쓸 수 있는 채널 전용 이모지예요. PNG로 최대 10개까지 등록할 수 있어요.",
  countLabel: "이모지",
  spec: "112×112px · PNG · 5MB 이하",
  add: "추가",
  empty: "아직 등록한 이모지가 없어요.",
  dragHint: "이미지를 끌어 순서를 바꿀 수 있어요.",
  addTitle: "이모지 추가",
  editTitle: "이모지 수정",
  imageLabel: "이미지",
  changeImage: "이미지 변경",
  uploadHint: "이미지를 끌어다 놓거나 클릭해 선택",
  nameLabel: "이름",
  namePlaceholder: "예: 하이",
  submitAdd: "등록",
  submitEdit: "저장",
  cancel: "취소",
  deleteTitle: "이모지 삭제",
  deleteDescription: "삭제하면 채널에서 사라지며 복구할 수 없어요.",
} as const;
