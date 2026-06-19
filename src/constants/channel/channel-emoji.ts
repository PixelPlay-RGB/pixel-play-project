// 채널 이모지(구독티콘) 정책·라벨 상수를 정의합니다.

// insert_channel_emoji RPC의 검증과 동일해야 한다(채널당 ≤10, 이름 1~20자).
export const CHANNEL_EMOJI_MAX = 10;
export const CHANNEL_EMOJI_NAME_MAX = 20;
export const CHANNEL_EMOJI_MAX_SIZE = 5 * 1024 * 1024; // 5MB
export const CHANNEL_EMOJI_ALLOWED_TYPES = ["image/png", "image/webp"];
export const CHANNEL_EMOJI_ACCEPT = "image/png,image/webp";

export const CHANNEL_EMOJI_LABEL = {
  // 페이지 헤더
  kicker: "구독 · 이모지",
  title: "채널 이모지",
  description:
    "구독자가 채팅에서 쓸 수 있는 우리 채널만의 이모지예요. 투명 배경 PNG·WebP로 최대 10개까지 등록할 수 있어요.",

  // 관리 카드(좌측)
  manageTitle: "등록한 이모지",
  manageDescription: "이미지를 끌어 순서를 바꾸고, 연필을 눌러 이미지·이름을 수정할 수 있어요.",
  countUnit: "개",
  spec: "PNG·WebP · 112×112px 권장 · 5MB 이하",
  add: "이모지 추가",
  addShort: "추가",
  dragHint: "이미지를 끌어 순서를 바꿀 수 있어요.",
  empty: "아직 등록한 이모지가 없어요.",
  emptyHint: "첫 이모지를 추가해 구독자에게 선물해 보세요.",

  // 미리보기(등록 카드 아래)
  previewTitle: "구독자에게 이렇게 보여요",
  previewDescription: "구독자가 채팅에서 보게 될 내 채널 이모지예요. 등록·수정하면 바로 반영돼요.",
  previewChannelEmpty: "이모지를 등록하면 여기에 표시돼요.",
  previewChatNickname: "구독자",
  previewChatText: "이모지 너무 귀여워요",

  // 사이드 팁
  tipTitle: "이모지를 등록하기 전에 확인해요",
  tipDescription:
    "투명 배경 PNG·WebP로 우리 채널만의 이모지를 만들 수 있어요.\n구독자는 채팅에서 이 이모지를 골라 쓸 수 있어요.",
  tipStep1Title: "투명 배경 PNG·WebP로 준비해요",
  tipStep1Desc: "배경이 비치는 정사각형 PNG·WebP가 채팅에서 가장 깔끔하게 보여요.",
  tipStep2Title: "최대 10개까지 등록해요",
  tipStep2Desc: "자주 쓰는 표정·반응 위주로 골라 담으면 구독자가 더 즐겨 써요.",
  tipStep3Title: "구독자 전용으로 제공돼요",
  tipStep3Desc: "등록한 이모지는 구독자와 크리에이터가 채팅에서 사용할 수 있어요.",

  // 다이얼로그(추가/수정)
  addTitle: "이모지 추가",
  editTitle: "이모지 수정",
  addDescription: "투명 배경 PNG·WebP 이미지를 올리고 짧은 이름을 붙여 주세요.",
  uploadTitle: "이미지 업로드",
  uploadHint: "PNG·WebP를 끌어다 놓거나 클릭해서 선택해요",
  changeImage: "이미지 변경",
  inChatPreviewLabel: "채팅에서",
  pickerPreviewLabel: "이모지 목록에서",
  nameLabel: "이름",
  namePlaceholder: "예: 하트뿅",
  submitAdd: "등록",
  submitEdit: "저장",
  cancel: "취소",

  // 삭제 확인
  deleteTitle: "이모지 삭제",
  deleteDescription: "삭제하면 채널에서 사라지며 복구할 수 없어요.",
} as const;
