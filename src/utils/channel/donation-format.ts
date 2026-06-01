// 후원 금액·날짜 표시용 포맷 헬퍼를 제공합니다.

const POINT_FORMATTER = new Intl.NumberFormat("ko-KR");

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "long",
  day: "numeric",
});

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatPoint(amount: number): string {
  return `${POINT_FORMATTER.format(amount)}P`;
}

export function formatDonationDate(iso: string): string {
  const time = new Date(iso).getTime();

  if (!Number.isFinite(time)) {
    return "";
  }

  const diff = Date.now() - time;

  if (diff < HOUR) {
    return "방금 전";
  }

  if (diff < DAY) {
    return `${Math.floor(diff / HOUR)}시간 전`;
  }

  if (diff < 7 * DAY) {
    return `${Math.floor(diff / DAY)}일 전`;
  }

  return SHORT_DATE_FORMATTER.format(time);
}
