// 채팅방 프리뷰에 표시되는 고정 문구와 더미 데이터를 관리합니다.

export type DummyChatMessage = {
  name: string;
  text: string;
  mine: boolean;
  color: string;
};

export const CHAT_ROOM_PREVIEW_DUMMY_MESSAGES: DummyChatMessage[] = [
  { name: "하린", text: "오늘 방송 다들 보러 가나요?", mine: false, color: "text-brand" },
  { name: "민수", text: "저는 일하면서 켜둘게요 ㅋㅋ", mine: false, color: "text-warning" },
  { name: "나", text: "저도 같이 볼게요!", mine: true, color: "" },
  { name: "수연", text: "방송 시작했어요!", mine: false, color: "text-info" },
  { name: "지호", text: "오늘 라우터 갈아엎는다고 했잖아요 ㄷㄷ", mine: false, color: "text-live" },
  { name: "하린", text: "기대됩니다 ㅎㅎ", mine: false, color: "text-brand" },
  { name: "예린", text: "저지연 모드 진짜 빠르네요", mine: false, color: "text-muted-foreground" },
  { name: "나", text: "투표 참여했어요!", mine: true, color: "" },
  { name: "도윤", text: "채팅창 분위기 좋네요", mine: false, color: "text-warning" },
];

export const CHAT_ROOM_PREVIEW_LABELS = {
  loginCta: "로그인 후 참여",
  signupCta: "회원가입",
  loginBannerText: "채팅 메시지를 읽고 참여하려면",
  loginBannerHighlight: "로그인",
  loginBannerSuffix: "이 필요해요.",
  joinAvailable: "참여 가능",
  notFound: "채팅방을 찾을 수 없습니다.",
  notFoundDescription: "로그인하면 PixelPlay 채팅방에 참여하고 메시지를 확인할 수 있습니다.",
} as const;
