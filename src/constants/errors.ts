export const ERROR_MESSAGES: Record<
  string,
  { title: string; description: string }
> = {
  "42501": {
    title: "권한 없음",
    description:
      "메시지를 보낼 수 있는 권한이 없어요. 관리자에게 문의해 주세요!",
  },
  DEFAULT: {
    title: "전송 실패",
    description: "알 수 없는 에러가 발생했습니다.",
  },
};
