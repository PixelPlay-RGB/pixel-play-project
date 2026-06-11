// 후원 알림 TTS로 읽을 문구를 만듭니다.

import { formatNumber } from "@/utils/common/format";

interface DonationTtsParams {
  donorNickname: string;
  amount: number | null;
  message: string;
  amountVisible: boolean;
}

// 이모지·이모티콘은 TTS 엔진이 "웃는 얼굴" 같은 명칭으로 읽어버리므로 읽기 전에 제거합니다.
// (그림 문자 + 변형 선택자/ZWJ 조합 문자까지 제거 후 남은 중복 공백을 정리)
function stripEmoji(text: string): string {
  return text
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// 금액 표시가 꺼져 있거나 금액이 없으면 후원 금액(포인트)을 읽지 않습니다.
export function buildDonationTtsText({
  donorNickname,
  amount,
  message,
  amountVisible,
}: DonationTtsParams): string {
  const speakableNickname = stripEmoji(donorNickname) || "시청자";
  const head =
    amountVisible && amount !== null
      ? `${speakableNickname}님이 ${formatNumber(amount)}포인트를 후원했습니다.`
      : `${speakableNickname}님이 후원했습니다.`;

  const speakableMessage = stripEmoji(message);

  return speakableMessage ? `${head} ${speakableMessage}` : head;
}
