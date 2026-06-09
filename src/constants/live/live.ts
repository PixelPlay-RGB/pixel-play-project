// 라이브 시청 화면에서 사용하는 상수를 정의합니다.

export const LIVE_LABEL = {
  chatRuleTitle: "채팅 규칙 안내",
  chatRuleDescription: "첫 채팅 전에 한 번만 확인합니다.",
  chatRuleDefaultText:
    "서로를 존중하며 대화해주세요. 반복 도배, 비방, 홍보성 메시지는 제한될 수 있습니다.",
  chatRuleAccept: "규칙 확인하고 채팅하기",
  live: "LIVE",
  chat: "라이브 채팅",
  follow: "팔로우",
  following: "팔로잉",
  unfollowConfirmTitle: "팔로우를 취소하시겠습니까?",
  unfollowConfirmDescription: "팔로우를 취소하면 팔로워 전용 채팅에 참여할 수 없게 됩니다.",
  confirm: "확인",
  close: "닫기",
  share: "공유",
  donate: "후원하기",
  vote: "투표 참여",
  chatMenu: "채팅 메뉴",
  chatCollapse: "채팅 접기",
  chatExpand: "채팅 열기",
  playerVolume: "음량 조절",
  playerQuality: "화질 설정",
  playerFullscreen: "전체화면",
  playerFullscreenExit: "전체화면 종료",
  playerPlay: "재생",
  playerPause: "일시정지",
  playerMute: "음소거",
  playerUnmute: "음소거 해제",
  playerTheater: "극장 모드",
  playerTheaterExit: "기본 모드",
  playerQualityAuto: "자동",
  viewers: "명 시청 중",
  followers: "팔로워",
  broadcasts: "방송",
  cleanbotHidden: "클린봇이 가린 메시지입니다.",
  cleanbotReveal: "보기",
  donationRankingTitle: "이번 주 후원 랭킹",
  emptyWeeklyDonation: "이번 주 첫 번째 팬이 되어보세요!",
  chatLoginPlaceholder: "로그인 후 채팅할 수 있습니다.",
  chatPlaceholder: "채팅 입력...",
  chatPausedPlaceholder: "지금은 시청자 채팅이 일시정지되었습니다.",
  loginRequired: "로그인이 필요합니다.",
  loginDescription: "이 기능을 사용하려면 로그인이 필요합니다.",
  loginButton: "로그인",
  cancel: "취소",
  anonymousAuthor: "익명",
  broadcastOffline: "방송이 종료되었거나 준비 중입니다.",
  chatPopoutActive: "채팅창이 팝업으로 열려 있습니다.",
  chatFollowerPlaceholder: "팔로우 후 채팅할 수 있습니다.",
  chatWaitPlaceholder: "잠시 후 채팅할 수 있습니다.",
  chatManagerOnlyPlaceholder: "매니저만 채팅할 수 있습니다.",
  participationFollowerTitle: "팔로우 전용 채팅",
  participationFollowerDesc: "이 방송은 팔로우한 시청자만 채팅할 수 있습니다.",
  participationWaitTitle: "팔로우 대기 중",
  participationWaitDesc: "팔로우 후 잠시 기다려야 채팅할 수 있습니다.",
  openLiveWatch: "시청 화면에서 확인",
  chatPopoutBlocked: "팝업 차단을 해제한 뒤 다시 열어주세요.",
  selfAuthorFallback: "나",
  // 금칙어가 포함돼 메시지가 전송되지 않았을 때 작성자 본인에게만 보이는 안내.
  bannedWordNotice: "금칙어가 포함되어 메시지가 전송되지 않았습니다.",
} as const;

// 어두운 플레이어 배경 위 아이콘 버튼 공통 스타일(컨트롤 바·음량·화질 공유).
export const LIVE_PLAYER_ICON_BUTTON_CLASS = "text-white/80 hover:bg-white/10 hover:text-white";

export const LIVE_DONATION_MIN_AMOUNT = 1000;
export const LIVE_DONATION_AMOUNTS = [1000, 3000, 5000, 10000, 50000] as const;
export const LIVE_CHAT_MESSAGE_MAX_LENGTH = 2000;
export const LIVE_DONATION_MESSAGE_MAX_LENGTH = 300;
// 채팅 메시지 목록에 유지하는 최대 건수(쿼리 limit + 낙관적/realtime 추가 시 slice 기준).
export const LIVE_MESSAGE_LIMIT = 100;

export const LIVE_DONATION_LABEL = {
  title: "후원하기",
  description: "최소 {amount}부터 후원할 수 있습니다.",
  anonymous: "익명 후원",
  amountLabel: "후원 금액",
  directInput: "직접 입력 (최소 {amount})",
  minAmountError: "최소 {amount}부터 후원할 수 있습니다.",
  messageLabel: "후원 메시지",
  messagePlaceholder: "응원 메시지를 남겨주세요. (선택)",
  balance: "보유 후원금",
  afterBalance: "후원 후 잔액",
  balanceLoading: "조회 중...",
  balanceError: "조회 실패",
  submit: "후원하기",
  cancel: "취소",
  disabled: "후원이 비활성화된 방송입니다.",
  unit: "P",
} as const;

export const LIVE_VOTE_LABEL = {
  title: "투표 참여",
  description: "진행 중인 투표 항목을 선택하고 참여할 수 있습니다.",
  resultTitle: "투표 결과",
  resultDescription: "종료된 투표의 최종 결과입니다.",
  loading: "투표를 불러오는 중입니다.",
  error: "투표를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
  empty: "현재 진행 중인 투표가 없습니다.",
  emptyTitle: "진행 중인 투표가 없어요",
  emptyDesc:
    "투표 버튼은 항상 열 수 있고, 투표가 시작되면 이 영역에서 실시간으로 참여 화면을 볼 수 있습니다.",
  waiting: "대기 중",
  active: "진행 중",
  submit: "참여하기",
  confirmVote: "투표 확정",
  participated: "참여 완료",
  participatedStatus: "참여 완료",
  selectedSuffix: "에 투표했어요",
  waitForResult: "크리에이터가 투표를 종료할 때까지 기다려주세요.",
  waitForResultFallback: "투표 결과를 기다리고 있습니다.",
  changeVote: "투표 변경",
  cancelVote: "투표 취소",
  changeHint: "다른 항목을 선택하면 투표가 변경되고, 선택한 항목을 다시 누르면 취소됩니다.",
  submitting: "처리 중...",
  ended: "종료",
  winner: "1위",
  yourChoice: "내 선택",
  votesUnit: "표",
  totalPrefix: "총",
  participantsUnit: "명 참여",
  liveParticipantsSuffix: "명 참여 중",
  resultLoading: "결과를 불러오는 중입니다.",
  resultError: "결과를 불러오지 못했습니다.",
  recentResults: "최근 결과",
  drawResult: "추첨 결과",
  rouletteResult: "룰렛 결과",
} as const;

export const LIVE_CHAT_MENU_LABEL = {
  cleanbot: "클린봇 켜짐",
  cleanbotOff: "클린봇 꺼짐",
  rules: "채팅 규칙",
  popout: "채팅창 팝업",
} as const;

export const LIVE_CHAT_POPOUT_WINDOW = {
  name: "pixelPlayLiveChatPopout",
  width: 400,
  height: 600,
} as const;
