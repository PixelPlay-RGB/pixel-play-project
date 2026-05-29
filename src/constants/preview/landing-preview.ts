// 랜딩 프리뷰에 표시되는 고정 문구와 데이터를 관리합니다.
import type {
  LandingChatMessage,
  LandingHeroStat,
  LandingLiveCard,
  LandingSceneCopy,
  LandingTutorialStep,
} from "@/types/preview/landing-preview";

export const LANDING_ROUTES = {
  live: "/live",
  chat: "/chat",
  login: "/auth/login",
  loginNext: "/live",
} as const;

export const LANDING_CTA_LABELS = {
  live: "라이브 둘러보기",
  chat: "채팅 시작하기",
  login: "로그인",
} as const;

export const LANDING_LIVE_LABEL = "LIVE";
export const LANDING_LIVE_VIEWER_TEXT = "1,240명 보는 중";
export const LANDING_BROADCAST_TITLE = "오늘은 뭐해볼까?";
export const LANDING_CREATOR_META = "하린 · 토크 · 32분째 방송 중";
export const LANDING_CHAT_INPUT_PLACEHOLDER = "메시지를 입력하세요 · 5초 저속 모드";

export const LANDING_DONATION_TEXT = {
  badge: "♥ 하린 · 5,000P",
  message: "방송 화이팅!! 잘 보고 있어요",
} as const;

export const LANDING_HERO_STATS = [
  { value: "248", label: "방송 중" },
  { value: "12,481", label: "같이 보는 중" },
  { value: "1,820", label: "실시간 채팅방" },
] as const satisfies readonly LandingHeroStat[];

export const LANDING_LIVE_CARDS = [
  {
    title: "오늘 저녁 뭐 할지 같이 골라요",
    creator: "하린 · 토크",
    viewers: "842",
    tone: "from-emerald-900 to-brand",
  },
  {
    title: "요즘 신작 게임 ㄱㄱ",
    creator: "민수 · 게임",
    viewers: "318",
    tone: "from-rose-950 to-live",
  },
  {
    title: "랭크 올릴 때까지... 오늘은 간다",
    creator: "서진 · 게임",
    viewers: "2.1K",
    tone: "from-violet-950 to-violet-500",
  },
  {
    title: "새벽 작업용 잔잔한 음악만 틀어드림",
    creator: "지윤 · 음악",
    viewers: "512",
    tone: "from-amber-950 to-amber-500",
  },
] as const satisfies readonly LandingLiveCard[];

export const LANDING_CHAT_MESSAGES = [
  { name: "하린", color: "text-brand", text: "오 화면 잘 보여요" },
  { name: "민수", color: "text-warning", text: "저지연 진짜 빠르네요 ㄷㄷ" },
  { name: "수연", color: "text-violet-400", text: "투표 열렸다 ㄱㄱ" },
  { name: "예린", color: "text-live", text: "이 장면 같이 보니까 더 재밌네요" },
  { name: "지윤", color: "text-brand", text: "ㅇㅈ" },
  { name: "도윤", color: "text-warning", text: "다음 주제는 뭐예요?" },
] as const satisfies readonly LandingChatMessage[];

export const LANDING_HERO_CHAT_LINES = [
  { name: "하린", color: "text-brand", text: "오 화면 잘 보여요" },
  { name: "민수", color: "text-warning", text: "저지연 빠르네요 ㄷㄷ" },
  { name: "유나", color: "text-live", text: "오늘 방송 편하게 보기 좋네요" },
] as const satisfies readonly LandingChatMessage[];

export const LANDING_TUTORIAL_STEPS = [
  {
    step: "1",
    title: "제목과 태그 확인",
    description: "시청자에게 보일 제목과 방송 태그를 먼저 정해요.",
    active: true,
  },
  {
    step: "2",
    title: "채팅 규칙 선택",
    description: "저속 모드와 링크 허용 여부를 정해요.",
  },
  {
    step: "3",
    title: "스트림 키 사용",
    description: "외부 프로그램과 연동할 수 있어요.",
  },
] as const satisfies readonly LandingTutorialStep[];

export const LANDING_SECTION_TEXT = {
  hero: {
    badge: "지금 248개 방송이 켜져 있어요",
    titlePrefixLines: ["라이브 방송,", "실시간 채팅,"],
    brandLine: "PixelPlay에서",
    liveLine: "시작해보세요.",
    descriptionLines: [
      "로그인 없이도 방송을 볼 수 있어요.",
      "마음에 든다면, 채팅방에서 사람들과 함께 이야기 해봐요.",
    ],
    readyLabel: "LIVE READY",
    readyTime: "3분",
    readySuffix: "만에 준비",
    readyDescriptionLines: ["제목과 채팅 규칙만 정하면", "바로 시작할 수 있어요"],
  },
  live: {
    kicker: "LIVE STREAMING",
    kickerTone: "brand",
    titleLines: ["취향에 맞는 방송을 찾아,", "입장해보세요."],
    description:
      "로그인은 요구하지 않아요.\n진행 중인 방송을 먼저 보고,\n마음에 들면 팔로잉하거나 채팅까지 이어갈 수 있어요.",
    bullets: [
      { strong: "라이브 목록", rest: "에서 지금 볼 수 있는 방송들을 한눈에 확인해요" },
      { strong: "비로그인 시청", rest: "으로 부담 없이 먼저 둘러봐요" },
      { strong: "팔로잉", rest: "으로 다시 보고 싶은 크리에이터를 저장해요" },
    ],
  },
  chat: {
    kicker: "REAL-TIME CHAT",
    kickerTone: "violet",
    titleLines: ["실시간 채팅으로", "방송에 함께 참여해요."],
    description:
      "방송을 보고 있는 시청자들과 소통하고,\n크리에이터는 투표를 생성할 수 있어요.\n대화를 이어가며 방송을 더 재미있게 즐겨보세요!",
    bullets: [
      { strong: "라이브 채팅방", rest: "에서 다른 시청자들과 실시간으로 소통해요" },
      { strong: "채팅 안내", rest: "로 입장 안내와 규칙 확인을 분리해요" },
      { strong: "투표 참여와 후원", rest: "으로 좋아하는 크리에이터를 응원해요" },
    ],
  },
  creator: {
    kicker: "START STREAMING",
    kickerTone: "live",
    titleLines: ["방송 설정은,", "간결하고 빠르게."],
    description:
      "자주 쓰는 제목, 채팅 규칙을 미리 정해둘 수 있어요.\n방송을 켤 때마다 같은 설정을 다시 입력하지 않아도 됩니다.",
    bullets: [
      { strong: "송출 기본값", rest: "으로 제목과 방송 태그를 미리 설정해요" },
      { strong: "스트림 키", rest: "를 사용해서 외부 서비스와 연동해요" },
      { strong: "채팅 규칙", rest: "은 저장하면 다음 메시지부터 바로 적용돼요" },
    ],
    tutorialLabel: "Broadcast Tutorial",
    tutorialTitleLines: ["방송 전,", "이것만 확인하세요."],
    tutorialBadge: "3단계",
    readyTitle: "방송 준비 완료",
    readyDescription: "설정은 저장됐고, 바로 시작할 수 있어요.",
    readyAction: "방송 시작",
  },
  explore: {
    kicker: "EXPLORE LIVE",
    titleLines: ["라이브 중인 방송들을,", "가볍게 둘러보세요."],
    descriptionLines: [
      "당장에 보고 싶은 방송이 없어도 괜찮아요.",
      "다양한 방송들을 둘러보다 보면 취향에 맞는 방송을 찾을 수 있을 거예요.",
    ],
  },
  finalCta: {
    titleLines: ["라이브 방송,", "실시간 채팅,", "PixelPlay에서", "시작해보세요."],
    descriptionLines: [
      "보고 싶은 방송을 찾아 둘러보고,",
      "방송에 참여해 실시간 채팅으로 사람들과 소통해보세요.",
    ],
  },
} as const satisfies {
  hero: {
    badge: string;
    titlePrefixLines: readonly string[];
    brandLine: string;
    liveLine: string;
    descriptionLines: readonly string[];
    readyLabel: string;
    readyTime: string;
    readySuffix: string;
    readyDescriptionLines: readonly string[];
  };
  live: LandingSceneCopy;
  chat: LandingSceneCopy;
  creator: LandingSceneCopy & {
    tutorialLabel: string;
    tutorialTitleLines: readonly string[];
    tutorialBadge: string;
    readyTitle: string;
    readyDescription: string;
    readyAction: string;
  };
  explore: {
    kicker: string;
    titleLines: readonly string[];
    descriptionLines: readonly string[];
  };
  finalCta: {
    titleLines: readonly string[];
    descriptionLines: readonly string[];
  };
};
