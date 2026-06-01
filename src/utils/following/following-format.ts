// 팔로잉 채널 표시용 포맷 헬퍼를 제공합니다.

const RELATIVE_DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "long",
  day: "numeric",
});

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// 오프라인 채널의 마지막 방송 시점을 상대 시간 라벨로 변환합니다.
export function formatLastBroadcastLabel(lastBroadcastAt: string | null): string {
  if (!lastBroadcastAt) {
    return "방송 기록 없음";
  }

  const broadcastTime = new Date(lastBroadcastAt).getTime();

  if (!Number.isFinite(broadcastTime)) {
    return "방송 기록 없음";
  }

  const diff = Date.now() - broadcastTime;

  if (diff < HOUR) {
    return "방금 전 방송";
  }

  if (diff < DAY) {
    return `${Math.floor(diff / HOUR)}시간 전 방송`;
  }

  const diffDays = Math.floor(diff / DAY);

  if (diffDays === 1) {
    return "어제 방송";
  }

  if (diffDays < 7) {
    return `${diffDays}일 전 방송`;
  }

  return `${RELATIVE_DATE_FORMATTER.format(broadcastTime)} 방송`;
}
