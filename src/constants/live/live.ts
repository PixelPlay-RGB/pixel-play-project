// 라이브 시청 화면에서 사용하는 상수를 정의합니다.

export const LIVE_LABEL = {
  chatRulePlaceholder: "채팅 규칙을 확인해주세요.",
  chatRuleTitle: "채팅 규칙 안내",
  chatRuleDescription: "첫 채팅 전에 한 번만 확인합니다.",
  chatRuleDefaultText: "서로를 존중하며 대화해주세요. 반복 도배, 비방, 홍보성 메시지는 제한될 수 있습니다.",
  chatRuleAccept: "규칙 확인하고 채팅하기",
  live: "LIVE",
  chat: "라이브 채팅",
  follow: "팔로우",
  following: "팔로잉",
  unfollow: "팔로우 취소",
  unfollowConfirmTitle: "팔로우를 취소하시겠습니까?",
  unfollowConfirmDescription: "팔로우를 취소하면 팔로워 전용 채팅에 참여할 수 없게 됩니다.",
  confirm: "확인",
  share: "공유",
  more: "더보기",
  donate: "후원하기",
  vote: "투표 참여",
  chatMenu: "채팅 메뉴",
  viewers: "명 시청 중",
  followers: "팔로워",
  broadcasts: "방송",
  filteredMessage: "클린봇이 부적절한 표현을 감지해 메시지를 가렸습니다.",
  donationRankingTitle: "이번 주 후원 랭킹",
  emptyWeeklyDonation: "이번 주 첫 번째 팬이 되어보세요!",
  chatLoginPlaceholder: "로그인 후 채팅할 수 있습니다.",
  chatPlaceholder: "채팅 입력...",
  loginRequired: "로그인이 필요합니다.",
  loginDescription: "이 기능을 사용하려면 로그인이 필요합니다.",
  loginButton: "로그인",
  cancel: "취소",
  close: "닫기",
  anonymousAuthor: "익명",
  shareCopy: "복사",
  broadcastOffline: "방송이 종료되었거나 준비 중입니다.",
  chatFollowerPlaceholder: "팔로우 후 채팅할 수 있습니다.",
  chatWaitPlaceholder: "잠시 후 채팅할 수 있습니다.",
  chatManagerOnlyPlaceholder: "매니저만 채팅할 수 있습니다.",
  participationFollowerTitle: "팔로우 전용 채팅",
  participationFollowerDesc: "이 방송은 팔로우한 시청자만 채팅할 수 있습니다.",
  participationWaitTitle: "팔로우 대기 중",
  participationWaitDesc: "팔로우 후 잠시 기다려야 채팅할 수 있습니다.",
} as const;

export const LIVE_DONATION_AMOUNTS = [100, 500, 1000, 5000, 10000] as const;

export const LIVE_DONATION_LABEL = {
  title: "후원하기",
  anonymous: "익명 후원",
  amountLabel: "후원 금액",
  directInput: "직접 입력",
  messageLabel: "후원 메시지",
  messagePlaceholder: "응원 메시지를 남겨주세요. (선택)",
  balance: "보유 후원금",
  afterBalance: "후원 후 잔액",
  balanceLoading: "조회 중...",
  balanceError: "조회 실패",
  submit: "후원하기",
  cancel: "취소",
  unit: "P",
} as const;

export const LIVE_VOTE_LABEL = {
  title: "투표 참여",
  description: "진행 중인 투표 항목을 선택하고 참여할 수 있습니다.",
  loading: "투표를 불러오는 중입니다.",
  error: "투표를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
  empty: "현재 진행 중인 투표가 없습니다.",
  submit: "참여하기",
  participated: "참여 완료",
  ended: "투표 종료",
  totalCount: "명 참여",
} as const;

export const LIVE_CHANNEL_MENU_LABEL = {
  share: "공유하기",
  report: "신고하기",
} as const;

export const LIVE_CHAT_MENU_LABEL = {
  cleanbot: "클린봇 켜짐",
  cleanbotOff: "클린봇 꺼짐",
  rules: "채팅 규칙",
  popout: "채팅창 팝업",
} as const;

export const LIVE_MOCK_BALANCE = 12000;
