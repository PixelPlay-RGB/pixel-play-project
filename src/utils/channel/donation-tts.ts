// 후원 알림 TTS로 읽을 문구를 만듭니다.

interface DonationTtsParams {
  donorNickname: string;
  amount: number;
  message: string;
  amountVisible: boolean;
}

// 금액 표시가 꺼져 있으면 후원 금액(포인트)을 읽지 않습니다.
export function buildDonationTtsText({
  donorNickname,
  amount,
  message,
  amountVisible,
}: DonationTtsParams): string {
  const head = amountVisible
    ? `${donorNickname}님이 ${amount.toLocaleString("ko-KR")}포인트를 후원했습니다.`
    : `${donorNickname}님이 후원했습니다.`;

  const trimmedMessage = message.trim();

  return trimmedMessage ? `${head} ${trimmedMessage}` : head;
}
