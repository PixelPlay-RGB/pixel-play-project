// 채팅방 멤버 관리 액션에 사용되는 고정 문구
export const MEMBER_ACTION_COPY = {
  kick: {
    title: "강퇴하기",
    description: "님을 채팅방에서 강퇴하시겠습니까?",
    confirm: "강퇴하기",
    success: "참여자를 강퇴했습니다.",
  },
  transfer: {
    title: "방장 위임",
    description: "님에게 방장 권한을 위임하시겠습니까?",
    confirm: "위임하기",
    success: "방장 권한을 위임했습니다.",
  },
} as const;

export type MemberAction = keyof typeof MEMBER_ACTION_COPY;
