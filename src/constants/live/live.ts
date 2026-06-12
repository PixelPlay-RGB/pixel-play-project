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
  playerAtLiveEdge: "실시간 방송 중",
  playerGoToLiveEdge: "실시간으로 이동",
  playerTimeline: "재생 위치",
  viewers: "명 시청 중",
  followers: "팔로워",
  broadcasts: "방송",
  cleanbotHidden: "클린봇이 부적절한 표현을 가렸습니다.",
  // 첫 진입 시 채팅 목록 상단에 항상 보여주는 필터링 안내.
  chatFilterNotice:
    "쾌적한 시청 환경을 위해 일부 메시지는 필터링 됩니다.\n클린 라이브 채팅 문화 만들기에 동참해 주세요.",
  chatLoadingOlder: "이전 채팅 불러오는 중",
  chatScrollToLatest: "최근 채팅으로",
  donationRankingTitle: "이번 주 후원 랭킹",
  donationRankingCollapse: "후원 랭킹 접기",
  donationRankingExpand: "후원 랭킹 펼치기",
  emptyWeeklyDonation: "이번 주 첫 번째 팬이 되어보세요!",
  chatLoginPlaceholder: "로그인 후 채팅할 수 있습니다.",
  chatPlaceholder: "채팅을 입력해보세요!",
  chatSend: "채팅 전송",
  loginRequired: "로그인이 필요합니다.",
  loginDescription: "라이브 채팅에 참여하려면 로그인해 주세요.",
  loginPromptSummaryTitle: "로그인 후 이용할 수 있어요",
  loginPromptSummaryItems: [
    "시청 중인 방송으로 돌아와 바로 채팅할 수 있습니다.",
    "팔로우, 투표, 후원 같은 라이브 참여 기능도 함께 사용할 수 있습니다.",
  ],
  loginButton: "로그인",
  cancel: "취소",
  anonymousAuthor: "익명",
  hostBadge: "크리에이터",
  donorBadge: "후원자",
  managerBadge: "매니저",
  subscriberBadge: "구독자",
  broadcastOffline: "방송이 종료되었거나 준비 중입니다.",
  broadcastOfflineTitle: "지금은 방송 중이 아니에요",
  offlineInfoTitle: "다음 방송에서 만나요! 👋",
  offlineInfoDescription: "크리에이터가 방송을 시작하면 이곳에서 바로 시청할 수 있어요.",
  // 방송은 시작됐지만 아직 송출(OBS) 영상이 도착하지 않은 동안 비디오 영역에 띄우는 안내.
  streamWaitingTitle: "송출 대기 중",
  streamWaitingDescription: "스트리머가 방송을 준비하고 있어요. 잠시만 기다려 주세요.",
  viewChannel: "채널 보기",
  browseLive: "다른 라이브 보기",
  chatUnavailable: "지금은 채팅을 이용할 수 없습니다",
  chatPopoutActive: "채팅창이 팝업으로 열려 있습니다.",
  chatFollowerPlaceholder: "팔로우 후 채팅할 수 있습니다.",
  chatWaitPlaceholder: "잠시 후 채팅할 수 있습니다.",
  chatManagerOnlyPlaceholder: "매니저만 채팅할 수 있습니다.",
  participationFollowerTitle: "팔로우 전용 채팅",
  participationFollowerDesc: "이 방송은 팔로우한 시청자만 채팅할 수 있습니다.",
  // 팔로우 후 대기 시간이 설정된 채널에서 팔로우 popover에 덧붙이는 안내.
  participationFollowerWaitDesc: (waitTime: string) =>
    `팔로우 후 ${waitTime}이 지나면 참여할 수 있어요.`,
  // 슬로우 모드 잠금 중 입력칸 placeholder — 남은 시간을 실시간으로 보여준다.
  chatSlowModePlaceholder: (seconds: number) => `슬로우 모드 — ${seconds}초 후 입력할 수 있어요.`,
  participationWaitTitle: "팔로우 대기 중",
  participationWaitDesc: "팔로우 후 잠시 기다려야 채팅할 수 있습니다.",
  chatPopoutBlocked: "팝업 차단을 해제한 뒤 다시 열어주세요.",
  selfAuthorFallback: "나",
  // 금칙어가 포함돼 메시지가 전송되지 않았을 때 작성자 본인에게만 보이는 안내.
  bannedWordNotice: "금칙어가 포함되어 메시지가 전송되지 않았습니다.",
} as const;

// 어두운 플레이어 배경 위 아이콘 버튼 공통 스타일(컨트롤 바·음량·화질 공유).
// 영상 위에서도 또렷하도록 기본을 완전 흰색으로 둔다(흐림은 hover 배경으로만 구분).
export const LIVE_PLAYER_ICON_BUTTON_CLASS = "text-white hover:bg-white/15 hover:text-white";

// 전체화면 채팅 패널 폭(w-80)과, 패널을 피해 줄어드는 영상·상단/하단 오버레이의 우측 인셋(right-80)은
// 같은 값(20rem)이어야 한다. 한쪽만 바꾸면 영상이 패널 밑으로 깔리거나 빈틈이 생기므로 여기 한 곳에서 관리한다.
// 일반 시청 화면의 채팅 패널 폭(md:w-88)과 동일하게 유지한다.
export const LIVE_FULLSCREEN_CHAT_PANEL_WIDTH = "w-88";
// 전체화면 채팅 패널 폭(LIVE_FULLSCREEN_CHAT_PANEL_WIDTH=w-88)과 반드시 함께 갱신한다 —
// 어긋나면 우상단 hover 버튼·컨트롤 바가 패널에 가려진다.
export const LIVE_FULLSCREEN_CHAT_INSET = "right-88";

export const LIVE_DONATION_MIN_AMOUNT = 1000;
export const LIVE_DONATION_AMOUNTS = [1000, 3000, 5000, 10000, 50000] as const;
export const LIVE_CHAT_MESSAGE_MAX_LENGTH = 2000;
export const LIVE_DONATION_MESSAGE_MAX_LENGTH = 300;
// 채팅 로딩 정책(#111 확정): 첫 진입 50건 → 위로 스크롤 시 50건씩 과거 적재 → 누적 300건 도달 시 중단.
// HISTORY_CAP은 낙관적/realtime 추가 시 slice 기준으로도 쓴다(과거 적재분은 새 메시지에 밀려 정리).
export const LIVE_MESSAGE_INITIAL_LIMIT = 50;
export const LIVE_MESSAGE_PAGE_SIZE = 50;
export const LIVE_MESSAGE_HISTORY_CAP = 300;

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
  interactionTitle: "참여하기",
  interactionDescription: "방송자가 진행 중인 투표, 추첨, 룰렛을 확인합니다.",
  interactionResultTitle: "상호작용 결과",
  interactionResultDescription: "최근 투표, 추첨, 룰렛 결과입니다.",
  title: "투표 참여",
  description: "진행 중인 투표 항목을 선택하고 참여할 수 있습니다.",
  resultTitle: "투표 결과",
  resultDescription: "종료된 투표의 최종 결과입니다.",
  loading: "투표를 불러오는 중입니다.",
  error: "투표를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
  empty: "현재 진행 중인 투표가 없습니다.",
  emptyTitle: "진행 중인 상호작용이 없어요",
  emptyDesc: "방송자가 투표, 추첨, 룰렛을 시작하면 이 영역에서 바로 확인할 수 있습니다.",
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
  drawActiveTitle: "추첨 진행 중",
  drawActiveDescription: "방송자가 추첨을 진행하고 있습니다.",
  drawCheck: "추첨 확인",
  drawCandidatesTitle: "추첨 참여 후보",
  drawCandidateJoined: "참여 완료",
  drawCandidateWaiting: "참여 버튼을 누르면 후보에 들어갑니다.",
  drawNoWinner: "아직 당첨자가 없습니다.",
  drawResult: "추첨 결과",
  drawWinnerTitle: "당첨자",
  rouletteActiveTitle: "룰렛 진행 중",
  rouletteActiveDescription: "방송자가 룰렛을 돌리고 있습니다.",
  rouletteCheck: "룰렛 확인",
  rouletteResult: "룰렛 결과",
  emptyInteraction: "진행 중인 참여 이벤트가 없습니다",
} as const;

export const LIVE_CHAT_MENU_LABEL = {
  cleanbot: "클린봇",
  rules: "채팅 규칙",
  popout: "채팅창 팝업",
} as const;

export const LIVE_CHAT_POPOUT_WINDOW = {
  name: "pixelPlayLiveChatPopout",
  width: 400,
  height: 600,
} as const;
