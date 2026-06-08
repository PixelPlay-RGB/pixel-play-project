// format 유틸리티 함수를 제공합니다.

// 천 단위 구분 숫자 포맷(ko-KR). SSR/CSR 동일 출력을 위해 로케일을 고정하고 포맷터를 1회만 생성한다.
const NUMBER_FORMATTER = new Intl.NumberFormat("ko-KR");

export function formatNumber(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 상대 시간 표기("방금 전"/"5분 전"/"3시간 전"/"2일 전", 7일 이상은 날짜).
export function formatRelativeTime(iso: string): string {
  const target = new Date(iso).getTime();

  if (Number.isNaN(target)) {
    return "";
  }

  // 시계 오차 등으로 미래 시각이 들어오면 음수가 되어 "방금 전"으로 어긋나므로 0으로 clamp.
  const diffSeconds = Math.max(0, Math.floor((Date.now() - target) / 1000));

  if (diffSeconds < 60) {
    return "방금 전";
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}일 전`;
  }

  return formatDate(iso);
}

// 알림 수신함 그룹 라벨(오늘/최근 일주일/이전). '오늘'은 rolling 24h가 아니라 달력 날짜 기준으로 판정한다.
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function formatNotificationGroupLabel(iso: string): string {
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) {
    return "이전";
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (target >= startOfToday) {
    return "오늘";
  }
  if (Date.now() - target < WEEK_MS) {
    return "최근 일주일";
  }
  return "이전";
}

export const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};
