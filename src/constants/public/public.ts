// public preview 화면에서 사용하는 상수를 정의합니다.
import { MessageCircle, Sparkles, UsersRound } from "lucide-react";

export const PUBLIC_HOME_FEATURES = [
  {
    icon: MessageCircle,
    title: "실시간 채팅",
    description: "채팅방을 만들고 팀원들과 바로 대화를 시작할 수 있습니다.",
  },
  {
    icon: UsersRound,
    title: "채팅방 참여",
    description: "관심 있는 채팅방에 참여하고 새 메시지를 확인할 수 있습니다.",
  },
  {
    icon: Sparkles,
    title: "PixelPlay",
    description: "라이브와 채팅 흐름을 한 화면에서 자연스럽게 이어갑니다.",
  },
];
