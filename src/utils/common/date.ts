// 날짜 입력과 검증에 사용하는 순수 유틸리티를 제공합니다.
import { getKstDateKey } from "@/utils/common/kst";

const DATE_INPUT_VALUE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// 시·분 표기를 KST로 고정한다. 타임존을 박지 않으면 서버(UTC)·클라이언트 출력이 달라져
// SSR 텍스트가 하이드레이션 때 어긋난다.
const KST_TIME_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  hourCycle: "h23", // 24시간 "14:30" 표기로 고정(좁은 mono 셀에 맞고 오전/오후 표기 폭 변동 제거)
  hour: "2-digit",
  minute: "2-digit",
});

export function formatKstTime(at: number | string | Date) {
  return KST_TIME_FORMATTER.format(new Date(at));
}

// YYYY-MM-DD를 KST로 고정한다(en-CA가 ISO식 "2026-06-08" 표기를 준다). SSR 결정성 보장.
const KST_NUMERIC_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// "2026-06-08 10:20" (날짜 + 시각, KST 고정)
export function formatKstDateTimeNumeric(at: number | string | Date) {
  const date = new Date(at);
  return `${KST_NUMERIC_DATE_FORMATTER.format(date)} ${formatKstTime(date)}`;
}

// "2025년 3월 15일" (KST 날짜, 한글 표기) — 팔로우 시작일 등 사람이 읽는 날짜.
const KST_KOREAN_DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function formatKstDateKorean(at: number | string | Date) {
  return KST_KOREAN_DATE_FORMATTER.format(new Date(at));
}

// 경과 시간을 "N시간 M분"(1시간 미만이면 "M분")으로 표기한다.
export function formatDurationKo(ms: number) {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
}

// KST 기준 오늘 날짜('YYYY-MM-DD')를 반환합니다.
export function getTodayDateInputValue() {
  return getKstDateKey();
}

export function isValidDateInputValue(value: string) {
  if (!DATE_INPUT_VALUE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function isDateInputValueOnOrBeforeToday(value: string) {
  return isValidDateInputValue(value) && value <= getTodayDateInputValue();
}
