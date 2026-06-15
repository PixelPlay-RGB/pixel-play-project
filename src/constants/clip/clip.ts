// 라이브 클립 라벨·정책 상수를 정의합니다.

import type { ClipPeriod, ClipSort } from "@/types/clip/clip";

// 길이 슬라이더 범위 — create_live_clip RPC의 검증(15~30)과 동일해야 한다.
export const CLIP_DURATION_MIN_SECONDS = 15;
export const CLIP_DURATION_MAX_SECONDS = 30;
export const CLIP_DURATION_DEFAULT_SECONDS = 30;
// 필름 트리머가 보여주는 "되돌리기" 범위(초) = 안전 추출 한계. HLS 버퍼(≈60초)에서 클레임/추출
// 예약분을 뺀 값으로, create_live_clip RPC의 윈도우 검증(end_offset + duration ≤ 40)과 동일해야 한다.
// EC2 MediaMTX 버퍼를 키우면 이 값과 RPC 검증·claim 컷오프를 함께 올려 60초까지 확장할 수 있다.
export const CLIP_BUFFER_SECONDS = 40;
export const CLIP_TITLE_MAX_LENGTH = 100;

// 시청 페이지 섹션: 한 줄 어림치(그리드 최대 칼럼 수)와 더보기 최대 줄 수.
// 4줄에 도달하면 더보기 버튼이 "전체보기"(채널 클립 탭 이동)로 바뀐다.
export const CLIP_SECTION_ROW_SIZE = 6;
export const CLIP_SECTION_MAX_ROWS = 4;
// 채널 클립 탭 한 번에 보여줄 최대 수(더보기 단위).
export const CLIP_CHANNEL_PAGE_SIZE = 18;
// 디테일 쇼츠 캐러셀이 한 번에 불러올 같은 채널 클립 수(채널당 보관 상한 30개를 덮는다).
export const CLIP_SHORTS_LIST_LIMIT = 30;

export const CLIP_LABEL = {
  // 생성(에디터)
  create: "클립",
  editorTitle: "클립 만들기",
  editorSubtitle: "방금 지나간 순간을 세로형 클립으로 저장해요.",
  cropGuide: "화면을 좌우로 드래그해 잘라낼 위치를 정해요.",
  preview: "미리보기",
  titleLabel: "제목",
  titlePlaceholder: "클립 제목",
  durationLabel: "길이",
  durationUnit: "초",
  clipMoment: "클립 시점",
  windowGuide: "구간의 양옆을 끌어 길이와 위치를 정해요.",
  now: "지금",
  submit: "클립 생성",
  submitting: "요청 중",
  creating: "생성 중",
  keepOpenHint: "완성 알림을 받을 때까지 창을 닫지 마세요.",
  viewClip: "클립 보기",
  backToLive: "라이브로 돌아가기",
  goToChannel: "채널로 가기",
  close: "닫기",
  retry: "다시 시도",
  processingTitle: "클립을 만들고 있어요",
  processingDescription: "잠시만 기다리면 완성된 클립을 보여드릴게요.",
  readyTitle: "클립이 완성됐어요!",
  readyDescription: "지금 바로 확인하거나 라이브로 돌아갈 수 있어요.",
  failedTitle: "클립 생성에 실패했어요",
  failedDescription: "방송 상태를 확인하고 잠시 후 다시 시도해 주세요.",
  directEntryTitle: "라이브에서 클립을 만들 수 있어요",
  directEntryDescription: "방송을 보다가 클립 버튼을 누르면 이 화면이 열려요.",
  loginRequiredTitle: "로그인 필요",
  loginRequiredDescription: "클립을 만들려면 로그인이 필요해요.",
  // 목록(시청 페이지 섹션·채널 탭)
  sectionTitle: "이 채널의 클립",
  refresh: "새로고침",
  sortPopular: "인기순",
  sortRecent: "최신순",
  showMore: "더보기",
  viewAll: "전체보기",
  empty: "아직 클립이 없어요.",
  emptyPeriod: "선택한 기간에 만들어진 클립이 없어요.",
  viewCountSuffix: "회",
  // 디테일(쇼츠)
  prevClip: "이전 클립",
  nextClip: "다음 클립",
  share: "공유",
  delete: "삭제",
  deleteTitle: "클립을 삭제할까요?",
  deleteDescription: "삭제한 클립은 되돌릴 수 없어요.",
  play: "재생",
  volume: "음량",
  mute: "음소거",
  unmute: "음소거 해제",
  unmuteHint: "소리를 켜려면 누르세요",
  channelLink: "채널 보기",
  liveLink: "라이브 보기",
  ambient: "엠비언트 모드",
  fullscreen: "전체화면",
  exitFullscreen: "전체화면 종료",
} as const;

export const CLIP_SORT_OPTIONS: Array<{ value: ClipSort; label: string }> = [
  { value: "popular", label: CLIP_LABEL.sortPopular },
  { value: "recent", label: CLIP_LABEL.sortRecent },
];

export const CLIP_PERIOD_OPTIONS: Array<{ value: ClipPeriod; label: string }> = [
  { value: "all", label: "전체" },
  { value: "24h", label: "24시간" },
  { value: "7d", label: "7일" },
  { value: "30d", label: "30일" },
];
